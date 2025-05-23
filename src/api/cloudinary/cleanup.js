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
 * API endpoint to find and clean up orphaned Cloudinary images
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
    // Require admin rights
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

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden - admin rights required' });
    }

    const { dryRun = true, maxResources = 500, folder = 'posts' } = req.body;

    // Step 1: Fetch all images from Cloudinary in the specified folder
    console.log(`Fetching up to ${maxResources} resources from Cloudinary in folder: ${folder}`);
    const cloudinaryResult = await cloudinary.v2.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResources
    });

    // Extract URLs and public_ids
    const cloudinaryResources = cloudinaryResult.resources.map(resource => ({
      public_id: resource.public_id,
      url: resource.secure_url,
      created_at: resource.created_at,
      bytes: resource.bytes,
      format: resource.format
    }));

    console.log(`Found ${cloudinaryResources.length} resources in Cloudinary`);

    // Step 2: Fetch all image URLs used in posts
    console.log('Fetching all image URLs from posts database');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('image_url, image_urls');

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    // Collect all image URLs from posts
    const usedUrls = new Set();
    posts.forEach(post => {
      if (post.image_url) usedUrls.add(post.image_url);
      if (Array.isArray(post.image_urls)) {
        post.image_urls.forEach(url => usedUrls.add(url));
      }
    });

    console.log(`Found ${usedUrls.size} image URLs in use across ${posts.length} posts`);

    // Step 3: Identify orphaned images
    const orphanedResources = [];
    cloudinaryResources.forEach(resource => {
      if (!Array.from(usedUrls).some(url => url.includes(resource.public_id))) {
        orphanedResources.push(resource);
      }
    });

    console.log(`Identified ${orphanedResources.length} orphaned resources`);

    // Step 4: Delete orphaned images if not in dry-run mode
    let deletionResults = null;
    if (!dryRun && orphanedResources.length > 0) {
      console.log(`Deleting ${orphanedResources.length} orphaned resources`);
      
      // Delete in batches
      const MAX_BATCH_SIZE = 100;
      const results = [];
      
      for (let i = 0; i < orphanedResources.length; i += MAX_BATCH_SIZE) {
        const batch = orphanedResources
          .slice(i, i + MAX_BATCH_SIZE)
          .map(resource => resource.public_id);
        
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
      
      deletionResults = results;
    }

    // Return summary
    return res.status(200).json({
      success: true,
      dryRun,
      summary: {
        totalCloudinaryResources: cloudinaryResources.length,
        totalUsedUrls: usedUrls.size,
        totalPosts: posts.length,
        orphanedResourcesCount: orphanedResources.length,
      },
      orphanedResources: orphanedResources.map(r => ({
        public_id: r.public_id,
        url: r.url,
        created_at: r.created_at,
        size_bytes: r.bytes
      })),
      deletionResults: deletionResults,
      message: dryRun
        ? `Found ${orphanedResources.length} orphaned resources (DRY RUN - no deletions performed)`
        : `Successfully processed ${orphanedResources.length} orphaned resources`
    });
  } catch (error) {
    console.error('Error in cleanup operation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in cleanup operation',
      error: error.message
    });
  }
} 