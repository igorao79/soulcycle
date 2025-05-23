import postCrudService from './postCrudService';
import postLikeService from './postLikeService';
import postPollService from './postPollService';
import postPinService from './postPinService';
import postUtils from './postUtils';

/**
 * Unified post service that combines all post-related services
 */
const postService = {
  // CRUD Operations
  getPosts: postCrudService.getPosts,
  getPostById: postCrudService.getPostById,
  createPost: postCrudService.createPost,
  updatePost: postCrudService.updatePost,
  deletePost: postCrudService.deletePost,

  // Like Operations
  toggleLike: postLikeService.toggleLike,
  isLikedByUser: postLikeService.isLikedByUser,
  getLikesCount: postLikeService.getLikesCount,

  // Poll Operations
  getPollVoteStatus: postPollService.getPollVoteStatus,
  votePoll: postPollService.votePoll,
  getPollResults: postPollService.getPollResults,
  
  // Pin Operations
  pinPost: postPinService.pinPost,
  unpinPost: postPinService.unpinPost,

  // Utilities
  utils: postUtils
};

export default postService;

// Named exports for individual services
export {
  postCrudService,
  postLikeService,
  postPollService,
  postPinService,
  postUtils
}; 