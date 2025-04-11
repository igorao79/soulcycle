import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

// Создание нового поста
export const createPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), postData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Удаление поста
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Обновление поста
export const updatePost = async (postId, postData) => {
  try {
    await updateDoc(doc(db, 'posts', postId), postData);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}; 