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
 * API endpoint to delete multiple images from Cloudinary
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
    const { publicIds } = req.body;

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'publicIds array is required and must not be empty'
      });
    }

    // Check authentication
    const { user, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.split(' ')[1]
    );

    if (authError || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('perks, active_perk, email')
      .eq('id', user.id)
      .single();

    const isAdmin = 
      profile?.email === 'igoraor79@gmail.com' || 
      profile?.perks?.includes('admin') || 
      profile?.active_perk === 'admin';

    // Only admins or post owners can do bulk deletions
    // For individual posts, we check ownership in the delete.js endpoint
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden - admin rights required for bulk operations' });
    }

    console.log(`Bulk deleting ${publicIds.length} images from Cloudinary:`, publicIds);

    // Delete images from Cloudinary in batches (Cloudinary recommends max 100 per call)
    const MAX_BATCH_SIZE = 100;
    const results = [];

    // Split into batches and delete
    for (let i = 0; i < publicIds.length; i += MAX_BATCH_SIZE) {
      const batch = publicIds.slice(i, i + MAX_BATCH_SIZE);
      
      console.log(`Deleting batch ${i/MAX_BATCH_SIZE + 1} with ${batch.length} images`);
      
      try {
        const result = await cloudinary.v2.api.delete_resources(batch);
        results.push(result);
      } catch (batchError) {
        console.error(`Error with batch ${i/MAX_BATCH_SIZE + 1}:`, batchError);
        results.push({
          error: true,
          batch: i/MAX_BATCH_SIZE + 1,
          message: batchError.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${publicIds.length} images for deletion`,
      results
    });
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting images',
      error: error.message
    });
  }
} 