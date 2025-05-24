import { compressImage } from './imageCompression';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_URL } from '../config/cloudinary';
import sha1 from 'crypto-js/sha1';

console.log('[imageService] Attempting to load VITE_CLOUDINARY_API_SECRET directly from import.meta.env:', import.meta.env.VITE_CLOUDINARY_API_SECRET);

// Cloudinary settings
const CLOUDINARY_API_KEY = '417482147356551';
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET; // This should be stored securely
// Поддержка как локального, так и production сервера
const CLOUDINARY_API_SERVER = import.meta.env.VITE_CLOUDINARY_API_SERVER || 'https://cloudinary-api-uapz.onrender.com';

console.log('Using Cloudinary API server:', CLOUDINARY_API_SERVER);

// Оптимизированные настройки для изображений
const CLOUDINARY_OPTIMIZED_PARAMS = 'f_auto,q_auto:eco,dpr_auto,w_auto,c_limit';
const DEFAULT_MAX_WIDTH = 800;

// Validate required credentials
if (!CLOUDINARY_API_SECRET) {
  console.error('[imageService] CRITICAL: Cloudinary API Secret is MISSING or undefined AFTER assignment. Ensure VITE_CLOUDINARY_API_SECRET is in your .env file and the server was restarted.');
} else {
  console.log('[imageService] Cloudinary API Secret loaded (first 5 chars for verification):', CLOUDINARY_API_SECRET.substring(0, 5));
}

/**
 * Оптимизирует URL изображения Cloudinary
 * @param {string} url - Оригинальный URL изображения
 * @returns {string} Оптимизированный URL
 */
function optimizeCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return url;

    // Вставляем оптимизационные параметры после 'upload'
    pathParts.splice(uploadIndex + 1, 0, CLOUDINARY_OPTIMIZED_PARAMS);
    urlObj.pathname = pathParts.join('/');
    
    return urlObj.toString();
  } catch (error) {
    console.warn('Error optimizing Cloudinary URL:', error);
    return url;
  }
}

/**
 * Создает оптимизированный URL для предварительного просмотра
 * @param {string} url - Оригинальный URL изображения
 * @returns {string} URL для превью
 */
function createThumbnailUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return url;

    // Параметры для превью
    const thumbnailParams = 'f_auto,q_auto:eco,w_200,h_200,c_fill';
    pathParts.splice(uploadIndex + 1, 0, thumbnailParams);
    urlObj.pathname = pathParts.join('/');
    
    return urlObj.toString();
  } catch (error) {
    console.warn('Error creating thumbnail URL:', error);
    return url;
  }
}

/**
 * Service for handling image uploads to Cloudinary
 */
const imageService = {
  /**
   * Extract public_id from Cloudinary URL
   * 
   * @param {string} url - Cloudinary URL
   * @returns {string|null} - Public ID or null if extraction failed
   */
  extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided to extractPublicIdFromUrl:', url);
      return null;
    }
    
    try {
      // Remove any transformation parameters
      const urlParts = url.split('/upload/');
      if (urlParts.length < 2) return null;
      
      // Get the part after /upload/
      let path = urlParts[1];
      
      // Remove any transformation parameters if they exist
      if (path.includes('/')) {
        path = path.split('/').slice(-2).join('/');
      }
      
      // Remove version number if it exists
      path = path.replace(/v\d+\//, '');
      
      // Remove file extension
      path = path.replace(/\.[^/.]+$/, '');
      
      return path;
    } catch (error) {
      console.error('Error extracting public_id from URL:', error, url);
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
      
      let processedImage = imageFile;
      if (compress && imageFile instanceof File) {
        processedImage = await compressImage(imageFile, compressionOptions);
      }
      
      const formData = new FormData();
      formData.append('file', processedImage);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
        credentials: 'omit' // Отключаем отправку куков
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const imageData = await response.json();
      
      // Сразу создаем оптимизированный URL
      const optimizedUrl = optimizeCloudinaryUrl(imageData.secure_url);
      
      return {
        url: optimizedUrl,
        publicId: imageData.public_id,
        version: imageData.version,
        format: imageData.format,
        width: imageData.width,
        height: imageData.height,
        thumbnailUrl: createThumbnailUrl(imageData.secure_url)
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
   * @param {string} publicId - The public_id of the image to delete
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        console.error('No public_id provided for deletion');
        return false;
      }

      const timestamp = Math.round((new Date()).getTime() / 1000);
      const signature = await this.generateSignature(publicId, timestamp);

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.statusText}`);
      }

      const result = await response.json();
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  },
  
  /**
   * Delete multiple images from Cloudinary
   * 
   * @param {Array<string>} items - Array of Cloudinary URLs or public_ids to delete
   * @returns {Promise<boolean>} - True if all deletions were successful
   */
  async deleteMultipleImages(items) {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        return true; // Nothing to delete
      }

      console.log('Deleting images from Cloudinary:', items);

      // Process items - they could be either URLs or public_ids
      // Use Set to deduplicate the array
      const publicIds = [...new Set(items.map(item => {
        // If it looks like a URL, extract the public_id
        if (item.includes('cloudinary.com')) {
          return this.extractPublicIdFromUrl(item);
        }
        // Otherwise assume it's already a public_id
        return item;
      }).filter(id => id !== null))];

      if (publicIds.length === 0) {
        console.warn('No valid public_ids found in items:', items);
        return false;
      }

      console.log('Processed unique public_ids:', publicIds);

      const timestamp = Math.round((new Date()).getTime() / 1000);
      
      // Delete images one by one to handle partial failures
      const results = await Promise.allSettled(
        publicIds.map(async (publicId) => {
          try {
            const signature = this.generateSignature(publicId, timestamp);
            
            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('api_key', CLOUDINARY_API_KEY);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);

            console.log(`Attempting to delete image with public_id: ${publicId}`);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
              method: 'POST',
              body: formData
            });

            const responseData = await response.json();
            
            // Consider both 'ok' and 'not found' as successful deletions
            // since the end goal (image not being in Cloudinary) is achieved
            if (responseData.result === 'ok' || responseData.result === 'not found') {
              console.log(`Successfully handled image ${publicId}:`, responseData);
              return true;
            }

            throw new Error(`Failed to delete image ${publicId}: ${responseData.error?.message || response.statusText}`);
          } catch (error) {
            console.error(`Error deleting image ${publicId}:`, error);
            return false;
          }
        })
      );

      // Check if all deletions were successful
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      const allSuccessful = successCount === publicIds.length;

      if (!allSuccessful) {
        console.warn(`Only ${successCount} out of ${publicIds.length} images were deleted successfully`);
      } else {
        console.log('All images were deleted successfully');
      }

      return allSuccessful;
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      return false;
    }
  },
  
  /**
   * Generate a signature for Cloudinary API requests
   * 
   * @param {string} publicId - The public_id of the image
   * @param {number} timestamp - Current timestamp
   * @returns {string} - Generated signature
   */
  generateSignature(publicId, timestamp) {
    try {
      console.log('[imageService Signature] CLOUDINARY_API_SECRET at start of generateSignature (first 5 chars):', CLOUDINARY_API_SECRET ? CLOUDINARY_API_SECRET.substring(0,5) : 'UNDEFINED or EMPTY');
      if (!CLOUDINARY_API_SECRET) {
        console.error('[imageService Signature] CRITICAL ERROR: CLOUDINARY_API_SECRET is not available. Signature generation will fail.');
        throw new Error('CLOUDINARY_API_SECRET is not configured. Check .env file and restart server.');
      }
      const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
      // Crucial check before forming stringToSign
      console.log('[imageService Signature] Value of CLOUDINARY_API_SECRET before appending (first 5 chars):', CLOUDINARY_API_SECRET.substring(0,5));
      const stringToSign = `${paramsToSign}${CLOUDINARY_API_SECRET}`;
      
      console.log('[imageService Signature] String being signed (first part + last 5 of secret for verification):', paramsToSign + (CLOUDINARY_API_SECRET ? CLOUDINARY_API_SECRET.slice(-5) : '[SECRET MISSING]'));

      const signature = sha1(stringToSign).toString();
      console.log('[imageService Signature] Generated signature:', signature);
      return signature;
    } catch (error) {
      console.error('[imageService Signature] Error during signature generation:', error.message);
      throw new Error(`Failed to generate signature: ${error.message}`);
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