/**
 * Utility functions for posts
 */
const postUtils = {
  /**
   * Transform post data from server response
   * @param {Object} post - Post data from server
   * @returns {Object} - Transformed post data
   */
  transformPost(post) {
    return {
      id: post.id,
      title: post.title || null,
      content: post.content,
      image_url: post.image_url,
      image_urls: post.image_urls || null,
      user_id: post.user_id,
      created_at: post.created_at,
      updated_at: post.updated_at,
      poll: post.poll || null,
      styling: post.styling || null,
      author: {
        id: post.author?.id || post.user_id,
        displayName: post.author?.display_name,
        avatar: post.author?.avatar,
        activePerk: post.author?.active_perk || 'user'
      },
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0
    };
  },
  
  /**
   * Check if user has admin rights
   * @param {Object} profileData - User profile data
   * @returns {boolean} - Whether the user is an admin
   */
  isUserAdmin(profileData) {
    if (!profileData) return false;
    
    const { perks = [], active_perk = '', email = '' } = profileData;
    
    return (
      email === 'igoraor79@gmail.com' || 
      perks.includes('admin') || 
      active_perk === 'admin'
    );
  },
  
  /**
   * Format date string for display
   * @param {string} dateString - Date string from server
   * @returns {string} - Formatted date string
   */
  formatPostDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  },
  
  /**
   * Get summary of post content
   * @param {string} content - Post content
   * @param {number} maxLength - Maximum length of summary (default: 150)
   * @returns {string} - Summary of post content
   */
  getPostSummary(content, maxLength = 150) {
    if (!content) return '';
    
    // Remove HTML tags if present
    const textContent = content.replace(/<[^>]+>/g, '');
    
    if (textContent.length <= maxLength) {
      return textContent;
    }
    
    // Find last space before maxLength
    const lastSpace = textContent.lastIndexOf(' ', maxLength);
    const summary = textContent.substring(0, lastSpace > 0 ? lastSpace : maxLength);
    
    return summary + '...';
  }
};

export default postUtils; 