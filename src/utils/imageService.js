import { compressImage } from './imageCompression';
import { supabase } from '../lib/supabase';

// Cloudinary settings
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/do9t8preg/upload';
const CLOUDINARY_CLOUD_NAME = 'do9t8preg';
const CLOUDINARY_API_KEY = '417482147356551';
const CLOUDINARY_API_SERVER = 'https://cloudinary-api-uapz.onrender.com';

// Use the new preset created by the user
const CLOUDINARY_UPLOAD_PRESET = 'postss'; 

/**
 * Service for handling image uploads to Cloudinary
 */
const imageService = {
  /**
   * Extract the public_id from a Cloudinary URL
   * 
   * @param {string} url - The Cloudinary URL
   * @returns {string|null} - The public_id or null if invalid URL
   */
  extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') {
      console.warn('Invalid URL:', url);
      return null;
    }
    
    try {
      // Check if it's a Cloudinary URL
      if (!url.includes('cloudinary.com')) {
        return null;
      }
      
      // Check if it's a fetch URL - these don't have proper public_ids in the standard way
      if (url.includes('/image/fetch/')) {
        console.warn('Found fetch URL, attempting alternate extraction:', url);
        return this.extractPublicIdFromFetchUrl(url);
      }
      
      console.log('Extracting public_id from URL:', url);
      
      const parts = url.split('/');
      
      // Find the position of 'upload' in the URL
      const uploadIndex = parts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        console.warn('Could not find "upload" in Cloudinary URL:', url);
        return null;
      }
      
      if (parts.length <= uploadIndex + 2) {
        console.warn('URL structure not as expected after "upload":', url);
        return null;
      }
      
      // Check if there's a version segment (v1234567890) after 'upload'
      let startIndex = uploadIndex + 1;
      if (parts[startIndex] && parts[startIndex].startsWith('v')) {
        startIndex++;
      }
      
      // Take parts after version and before the last segment with file extension
      const afterUpload = parts.slice(startIndex);
      if (afterUpload.length === 0) {
        console.warn('No path segments after version in URL:', url);
        return null;
      }
      
      // Get the filename without extension
      const filenameWithExt = afterUpload.pop();
      const fileName = filenameWithExt.split('.')[0];
      
      // Combine to get the full public_id
      const publicId = [...afterUpload, fileName].join('/');
      console.log('Extracted public_id:', publicId);
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public_id from URL:', error, url);
      return null;
    }
  },

  /**
   * Attempt to extract a public_id from a fetch URL
   * 
   * @param {string} url - The Cloudinary fetch URL
   * @returns {string|null} - An approximated public_id or null
   */
  extractPublicIdFromFetchUrl(url) {
    if (!url || !url.includes('/image/fetch/')) {
      return null;
    }

    try {
      // For fetch URLs, we'll create a synthetic public_id based on the original URL
      // Format: fetch/{timestamp}_{hash}
      
      // Extract the target URL being fetched (everything after /fetch/v...)
      const fetchPattern = /\/image\/fetch\/(?:v\d+\/)?(.+)$/;
      const match = url.match(fetchPattern);
      
      if (!match || !match[1]) {
        console.warn('Could not extract target URL from fetch URL:', url);
        return null;
      }
      
      // Get the target URL
      let targetUrl = match[1];
      
      // If the target is another Cloudinary URL, try to extract that public_id
      if (targetUrl.includes('cloudinary.com') && targetUrl.includes('/image/upload/')) {
        // This is a fetch of another Cloudinary upload
        const nestedPublicId = this.extractPublicIdFromUrl(targetUrl);
        if (nestedPublicId) {
          return nestedPublicId;
        }
      }
      
      // For other cases, create a hash from the URL
      // Extract the filename from the end of the URL (if possible)
      const urlParts = targetUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // See if we can extract a filename
      if (lastPart.includes('.')) {
        const filename = lastPart.split('.')[0];
        return `fetch/${filename}`;
      }
      
      // If we can't extract a meaningful identifier, use a hash of the URL
      const timestamp = url.match(/\/v(\d+)\//)?.[1] || '';
      return `fetch/${timestamp}_unknown`;
    } catch (error) {
      console.error('Error extracting from fetch URL:', error);
      return null;
    }
  },
  
  /**
   * Upload an image to Cloudinary with folder organization
   * 
   * @param {File|Blob} imageFile - The image file to upload (File object)
   * @param {Object} options - Upload options
   * @param {string} options.folder - The folder to upload to (e.g., 'posts', 'avatars')
   * @param {boolean} options.compress - Whether to compress the image before upload (default: true)
   * @param {Object} options.compressionOptions - Options for image compression
   * @returns {Promise<Object>} - The upload result with secure_url
   */
  async uploadToCloudinary(imageFile, options = {}) {
    try {
      const { 
        folder = 'posts',
        compress = true, 
        compressionOptions = {} 
      } = options;
      
      // Process the image file (compression, etc)
      let processedImage = imageFile;
      if (compress && imageFile instanceof File) {
        processedImage = await compressImage(imageFile, compressionOptions);
      }
      
      // Generate a unique ID for logging purposes
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 10);
      
      // Create form data for upload - ONLY include allowed parameters for unsigned uploads
      const formData = new FormData();
      formData.append('file', processedImage);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // You can optionally include these allowed parameters
      // formData.append('folder', folder); // Let preset control this
      formData.append('tags', 'app_upload'); // Optional tagging
      
      console.log(`Uploading to Cloudinary using preset: ${CLOUDINARY_UPLOAD_PRESET}`);
      console.log(`Upload parameters:`, {
        fileName: processedImage.name,
        fileSize: processedImage.size,
        fileType: processedImage.type,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET
      });
      
      // Upload to Cloudinary
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary error response:', errorText);
        let errorMessage = 'Unknown error';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText || `Status ${response.status}`;
        }
        throw new Error(`Cloudinary upload failed: ${errorMessage}`);
      }
      
      // Get the response data
      const imageData = await response.json();
      console.log('Cloudinary upload successful:', imageData.public_id);
      
      return {
        url: imageData.secure_url,
        publicId: imageData.public_id,
        version: imageData.version,
        format: imageData.format,
        width: imageData.width,
        height: imageData.height
      };
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  },
  
  /**
   * Upload multiple images to Cloudinary in parallel
   * 
   * @param {Array<File>} imageFiles - Array of image files to upload
   * @param {Object} options - Upload options (same as uploadToCloudinary)
   * @returns {Promise<Array<Object>>} - Array of upload results
   */
  async uploadMultipleImages(imageFiles, options = {}) {
    try {
      const uploadPromises = imageFiles.map(file => this.uploadToCloudinary(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  },
  
  /**
   * Delete an image from Cloudinary
   * 
   * @param {string} publicId - The public ID of the image to delete
   * @returns {Promise<boolean>} - Success or failure
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        console.warn('No publicId provided for deletion');
        return false;
      }
      
      console.log(`Attempting to delete Cloudinary image with publicId: ${publicId}`);
      
      // Send request to our Cloudinary API server
      const response = await fetch(`${CLOUDINARY_API_SERVER}/api/cloudinary/delete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ publicIds: [publicId] })
      });
      
      if (response.ok) {
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.log('API returned ok status but invalid JSON. Considering delete successful.');
          return true;
        }
        
        console.log('Successfully deleted image from Cloudinary');
        return true;
      } else {
        let errorMessage = `Status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        
        console.error(`Error from delete API: ${errorMessage}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  },
  
  /**
   * Delete multiple images from Cloudinary
   * 
   * @param {Array<string>} publicIds - Array of public IDs to delete
   * @returns {Promise<boolean>} - Success or failure
   */
  async deleteMultipleImages(publicIds) {
    try {
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        console.warn('No publicIds provided for deletion');
        return false;
      }
      
      console.log(`Attempting to delete ${publicIds.length} Cloudinary images`);
      
      // Send request to our Cloudinary API server for multiple deletions
      const response = await fetch(`${CLOUDINARY_API_SERVER}/api/cloudinary/delete-multiple`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ publicIds })
      });
      
      if (response.ok) {
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.log('API returned ok status but invalid JSON. Considering delete successful.');
          return true;
        }
        
        console.log(`Successfully deleted ${publicIds.length} images from Cloudinary`);
        return true;
      } else {
        let errorMessage = `Status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        
        console.error(`Error from delete API: ${errorMessage}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      return false;
    }
  },
  
  /**
   * Clean up orphaned images in a folder
   * 
   * @param {Object} options - Options for cleanup
   * @param {boolean} options.dryRun - Whether to only simulate deletion (default: true)
   * @param {number} options.maxResources - Maximum resources to fetch (default: 500)
   * @param {string} options.folder - Folder to scan (default: 'posts')
   * @returns {Promise<Object>} - Result of cleanup operation
   */
  async cleanupOrphanedImages(options = {}) {
    try {
      const { dryRun = true } = options;
      
      console.log(`Initiating cleanup of orphaned Cloudinary images (dryRun: ${dryRun})`);
      
      // Call our cleanup API
      const response = await fetch(`${CLOUDINARY_API_SERVER}/api/cloudinary/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cleanup failed: ${error.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      
      console.log('Cleanup completed:', result.message);
      console.log(`Found ${result.summary.orphanedResourcesCount} orphaned resources out of ${result.summary.totalCloudinaryResources} total`);
      
      return result;
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error);
      throw error;
    }
  }
};

export default imageService; 