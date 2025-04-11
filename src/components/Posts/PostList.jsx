import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Post from './Post';
import './Posts.css';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      setError('Ошибка при загрузке постов');
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
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