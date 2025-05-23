import cloudinary from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// Initialize Cloudinary with credentials
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'do9t8preg',
  api_key: process.env.CLOUDINARY_API_KEY || '417482147356551',
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * API endpoint to delete images from Cloudinary
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { postId, publicIds } = req.body;

    if (!publicIds && !postId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either postId or publicIds is required' 
      });
    }

    // Check authentication
    const { user, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.split(' ')[1]
    );

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let idsToDelete = publicIds || [];

    // If postId is provided, fetch the post's images
    if (postId) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('image_url, image_urls, user_id')
        .eq('id', postId)
        .single();

      if (postError) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check if user owns the post or is an admin
      const isOwner = post.user_id === user.id;
      
      // Check if user is admin
      let isAdmin = false;
      if (!isOwner) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('perks, active_perk, email')
          .eq('id', user.id)
          .single();

        isAdmin = 
          profile?.email === 'igoraor79@gmail.com' || 
          profile?.perks?.includes('admin') || 
          profile?.active_perk === 'admin';
      }

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      // Extract public IDs from post's image URLs
      if (post.image_url) {
        const publicId = extractPublicIdFromUrl(post.image_url);
        if (publicId) idsToDelete.push(publicId);
      }

      if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
        post.image_urls.forEach(url => {
          const publicId = extractPublicIdFromUrl(url);
          if (publicId) idsToDelete.push(publicId);
        });
      }
    }

    if (idsToDelete.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No images to delete' 
      });
    }

    console.log(`Deleting ${idsToDelete.length} images from Cloudinary:`, idsToDelete);

    // Delete images from Cloudinary
    const result = await cloudinary.v2.api.delete_resources(idsToDelete);

    return res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${idsToDelete.length} images`, 
      result 
    });
  } catch (error) {
    console.error('Error deleting images:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error deleting images',
      error: error.message 
    });
  }
}

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Check if it's a fetch URL - these don't have proper public_ids
    if (url.includes('/image/fetch/')) {
      console.warn('Found fetch URL, these are not stored in folders:', url);
      return null;
    }
    
    const parts = url.split('/');
    
    // Find the position of 'upload' in the URL
    const uploadIndex = parts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
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
      return null;
    }
    
    // Get the filename without extension
    const filenameWithExt = afterUpload.pop();
    const fileName = filenameWithExt.split('.')[0];
    
    // Combine to get the full public_id
    const publicId = [...afterUpload, fileName].join('/');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
} 