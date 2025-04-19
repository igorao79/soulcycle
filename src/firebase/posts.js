import { postsApi } from '../services/api';

// Создание нового поста
export const createPost = async (postData) => {
  try {
    return await postsApi.createPost(postData);
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Удаление поста
export const deletePost = async (postId) => {
  try {
    await postsApi.deletePost(postId);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Обновление поста
export const updatePost = async (postId, postData) => {
  try {
    await postsApi.updatePost(postId, postData);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}; 