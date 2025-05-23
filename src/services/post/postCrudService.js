import supabase from '../supabaseClient';
import imageService from '../../utils/imageService';

/**
 * Service for post CRUD operations
 */
const postCrudService = {
  /**
   * Get posts with pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} options.userId - Filter by user ID (optional)
   * @param {boolean} options.withPinned - Include pinned posts (default: true)
   */
  async getPosts({ page = 1, limit = 10, userId = null, withPinned = true } = {}) {
    try {
      // Calculate offset based on page and limit
      const offset = (page - 1) * limit;
      
      // Start building query
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, display_name, avatar, active_perk),
          likes_count:post_likes(count),
          comments_count:comments(count)
        `);
        
      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      // Order by pinned status first, then by created_at
      query = query.order('is_pinned', { ascending: false })
                   .order('created_at', { ascending: false })
                   .range(offset, offset + limit - 1);
                   
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Transform posts
      const transformedPosts = data.map(post => ({
        id: post.id,
        title: post.title || null,
        content: post.content,
        image_url: post.image_url,
        image_urls: post.image_urls || null,
        user_id: post.user_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
        poll_data: post.poll_data,
        styling: post.styling,
        is_pinned: post.is_pinned || false,
        author: {
          id: post.author?.id,
          displayName: post.author?.display_name,
          avatar: post.author?.avatar,
          activePerk: post.author?.active_perk
        },
        likes_count: post.likes_count?.[0]?.count || 0,
        comments_count: post.comments_count?.[0]?.count || 0
      }));
      
      return { 
        posts: transformedPosts,
        page,
        limit,
        hasMore: transformedPosts.length === limit
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },
  
  /**
   * Get a post by ID
   * @param {string} postId - Post ID
   */
  async getPostById(postId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, display_name, avatar, active_perk),
          likes_count:post_likes(count),
          comments_count:comments(count)
        `)
        .eq('id', postId)
        .single();
        
      if (error) throw error;
      
      if (!data) {
        throw new Error('Post not found');
      }
      
      // Transform post data
      return {
        id: data.id,
        title: data.title || null,
        content: data.content,
        image_url: data.image_url,
        image_urls: data.image_urls || null,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        poll_data: data.poll_data,
        styling: data.styling,
        is_pinned: data.is_pinned || false,
        author: {
          id: data.author?.id,
          displayName: data.author?.display_name,
          avatar: data.author?.avatar,
          activePerk: data.author?.active_perk
        },
        likes_count: data.likes_count?.[0]?.count || 0,
        comments_count: data.comments_count?.[0]?.count || 0
      };
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
  },
  
  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @param {string} postData.content - Post content
   * @param {string} postData.title - Post title (optional)
   * @param {Array<string>} postData.image_urls - Multiple image URLs (optional)
   * @param {Object} postData.poll_data - Poll data (optional)
   * @param {Object} postData.styling - Post styling (optional)
   */
  async createPost(postData) {
    try {
      // Get current user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const currentUser = sessionData?.session?.user;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Create post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: postData.title || null,
          content: postData.content,
          image_url: postData.image_urls && postData.image_urls.length > 0 ? postData.image_urls[0] : null,
          image_urls: postData.image_urls || null,
          user_id: currentUser.id,
          poll_data: postData.poll_data || null,
          styling: postData.styling || null
        })
        .select();
        
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },
  
  /**
   * Update a post
   * @param {string} postId - Post ID
   * @param {Object} postData - Updated post data
   */
  async updatePost(postId, postData) {
    try {
      // Get current user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const currentUser = sessionData?.session?.user;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get existing post to check ownership
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Check if user owns the post
      if (existingPost.user_id !== currentUser.id) {
        // Check if user is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('perks, active_perk, email')
          .eq('id', currentUser.id)
          .single();
        
        const isAdmin = 
          profileData?.email === 'igoraor79@gmail.com' || 
          profileData?.perks?.includes('admin') || 
          profileData?.active_perk === 'admin';
        
        if (!isAdmin) {
          throw new Error('You do not have permission to update this post');
        }
      }
      
      // Update post
      const { data, error } = await supabase
        .from('posts')
        .update({
          title: postData.title !== undefined ? postData.title : undefined,
          content: postData.content !== undefined ? postData.content : undefined,
          image_url: postData.image_urls !== undefined && postData.image_urls.length > 0 ? postData.image_urls[0] : undefined,
          image_urls: postData.image_urls !== undefined ? postData.image_urls : undefined,
          poll_data: postData.poll_data !== undefined ? postData.poll_data : undefined,
          styling: postData.styling !== undefined ? postData.styling : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select();
        
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },
  
  /**
   * Delete a post
   * @param {string} postId - Post ID
   */
  async deletePost(postId) {
    try {
      // Get current user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const currentUser = sessionData?.session?.user;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get existing post to check ownership and get image URLs
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id, image_url, image_urls')
        .eq('id', postId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Check if user owns the post
      if (existingPost.user_id !== currentUser.id) {
        // Check if user is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('perks, active_perk, email')
          .eq('id', currentUser.id)
          .single();
        
        const isAdmin = 
          profileData?.email === 'igoraor79@gmail.com' || 
          profileData?.perks?.includes('admin') || 
          profileData?.active_perk === 'admin';
        
        if (!isAdmin) {
          throw new Error('You do not have permission to delete this post');
        }
      }
      
      // Delete post
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (deleteError) throw deleteError;
      
      // Delete associated images from Cloudinary
      try {
        const publicIdsToDelete = [];
        
        // Add main image if exists
        if (existingPost.image_url) {
          const publicId = imageService.extractPublicIdFromUrl(existingPost.image_url);
          if (publicId) publicIdsToDelete.push(publicId);
        }
        
        // Add images from image_urls array if exists
        if (Array.isArray(existingPost.image_urls) && existingPost.image_urls.length > 0) {
          for (const url of existingPost.image_urls) {
            if (url && typeof url === 'string') {
              const publicId = imageService.extractPublicIdFromUrl(url);
              if (publicId) publicIdsToDelete.push(publicId);
            }
          }
        }
        
        // Delete images from Cloudinary if we have any public IDs
        if (publicIdsToDelete.length > 0) {
          console.log(`Attempting to delete ${publicIdsToDelete.length} images from Cloudinary`);
          // Use a non-blocking call to avoid errors affecting post deletion
          imageService.deleteMultipleImages(publicIdsToDelete)
            .then(success => {
              if (success) {
                console.log(`Successfully deleted ${publicIdsToDelete.length} images from Cloudinary`);
              } else {
                console.warn(`Failed to delete some or all images from Cloudinary`);
              }
            })
            .catch(err => {
              console.error('Error during image deletion:', err);
            });
        } else {
          console.log('No images to delete for this post');
        }
      } catch (imageError) {
        console.error('Error preparing images for deletion:', imageError);
        // Don't throw error here, as the post was successfully deleted
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
};

export default postCrudService; 