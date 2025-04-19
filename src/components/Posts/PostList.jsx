import React, { useState, useEffect } from 'react';
import Post from './Post';
import './Posts.css';
import { postsApi } from '../../services/api';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const postsData = await postsApi.getPosts({ orderBy: 'createdAt:desc' });
        
        // Преобразуем даты из строк в объекты Date
        const formattedPosts = postsData.map(post => ({
          ...post,
          createdAt: post.createdAt ? new Date(post.createdAt) : null
        }));
        
        setPosts(formattedPosts);
        setError('');
      } catch (err) {
        setError('Ошибка при загрузке постов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="loading">Загрузка постов...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <p className="no-posts">Пока нет постов. Будьте первым!</p>
      ) : (
        posts.map(post => (
          <Post key={post.id} post={post} />
        ))
      )}
    </div>
  );
};

export default PostList; 