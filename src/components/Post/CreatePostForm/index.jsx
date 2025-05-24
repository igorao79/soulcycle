import React, { useState } from 'react';
import { FiEdit, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import postService from '../../../services/postService';
import styles from '../Post.module.scss';

// Import sub-components
import ImageUploadField from './components/ImageUploadField';
import PollCreationForm from './components/PollCreationForm';
import StylingOptions from './components/StylingOptions';
import FormToggles from './components/FormToggles';

// Import utilities and styles
import { formOptionsStyle } from './styles/FormStyles';

const CreatePostForm = ({ onPostCreated }) => {
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  // Pin state
  const [isPinned, setIsPinned] = useState(false);
  
  // Styling options
  const [showStylingOptions, setShowStylingOptions] = useState(false);
  const [titleColor, setTitleColor] = useState('#000000');
  const [contentColor, setContentColor] = useState('#000000');
  const [pollOptionsColor, setPollOptionsColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('inherit');
  
  // Check admin rights
  const isAdmin = isAuthenticated && user && (
    user.email === 'igoraor79@gmail.com' || 
    user.perks?.includes('admin') || 
    user.activePerk === 'admin'
  );
  
  // If user is not an admin, don't show the form
  if (!isAdmin) {
    return null;
  }
  
  // Toggle poll interface
  const togglePoll = () => {
    setShowPoll(!showPoll);
    if (showPoll) {
      // Reset poll data
      setPollOptions(['', '']);
    } else {
      // Start with two empty options
      setPollOptions(['', '']);
    }
  };
  
  // Toggle styling options
  const toggleStylingOptions = () => {
    setShowStylingOptions(!showStylingOptions);
  };
  
  const validatePoll = () => {
    // Check if at least two poll options are filled
    const filledOptions = pollOptions.filter(option => option.trim().length > 0);
    if (filledOptions.length < 2) {
      setError('Для опроса необходимо минимум два варианта ответа');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double check admin rights
    if (!isAdmin) {
      setError('У вас недостаточно прав для создания постов');
      return;
    }
    
    // Require text only if there's no poll
    if (!showPoll && !content.trim()) {
      setError('Текст поста не может быть пустым');
      return;
    }
    
    // If poll is enabled but both fields are empty - error
    if (showPoll && !content.trim() && !title.trim()) {
      setError('Добавьте текст поста или заголовок для опроса');
      return;
    }
    
    // Validate poll if it's shown
    if (showPoll && !validatePoll()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Prepare poll data if needed
      const pollData = showPoll ? {
        question: title.trim() || content.trim().split(' ').slice(0, 5).join(' ') + '...', 
        options: pollOptions.filter(option => option.trim().length > 0).map(option => option.trim()),
        optionsColor: pollOptionsColor,
        styling: {
          optionsColor: pollOptionsColor,
          fontFamily: selectedFont
        }
      } : null;
      
      // Create post data object with optimized image URLs
      const postData = {
        title: title.trim() || null, 
        content: content.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
        userId: user.id,
        styling: {
          titleColor: titleColor, 
          contentColor: contentColor,
          fontFamily: selectedFont
        },
        poll: pollData,
        isPinned: isPinned
      };
      
      const newPost = await postService.createPost(postData);
      
      // Clear form
      setTitle('');
      setContent('');
      setImageUrls([]);
      setShowPoll(false);
      setPollOptions(['', '']);
      setShowStylingOptions(false);
      setTitleColor('#000000');
      setContentColor('#000000');
      setPollOptionsColor('#000000');
      setSelectedFont('inherit');
      setIsPinned(false);
      
      // Call callback to update posts list
      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      
      // Display detailed error info
      if (err.message) {
        setError("Failed to create post: " + err.message);
      } else if (err.details) {
        setError("Error: " + err.details);
      } else {
        setError('Failed to create post. Try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={styles.createPostContainer}>
      {/* Inject responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: formOptionsStyle }} />
      
      <h3 className={styles.createPostTitle}>
        <FiEdit /> Создать пост
      </h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <FiAlertCircle /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.createPostForm}>
        <input
          type="text"
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок поста"
          disabled={isSubmitting || isImageUploading}
          style={{ color: titleColor, fontFamily: selectedFont }}
        />
        
        <textarea
          className={styles.contentInput}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={showPoll ? "Текст поста с опросом (необязательно)..." : "Текст вашего поста..."}
          rows={4}
          disabled={isSubmitting || isImageUploading}
          required={!showPoll}
          style={{ color: contentColor, fontFamily: selectedFont }}
        />
        
        {/* Display image upload field only when not creating a poll */}
        {!showPoll && (
          <ImageUploadField 
            imageUrls={imageUrls}
            setImageUrls={setImageUrls}
            isSubmitting={isSubmitting}
            setIsImageUploading={setIsImageUploading}
          />
        )}
        
        {/* Display poll form when poll is enabled */}
        {showPoll && (
          <PollCreationForm
            pollOptions={pollOptions}
            setPollOptions={setPollOptions}
            isSubmitting={isSubmitting}
            selectedFont={selectedFont}
            pollOptionsColor={pollOptionsColor}
          />
        )}
        
        {/* Display styling options when enabled */}
        {showStylingOptions && (
          <StylingOptions
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            titleColor={titleColor}
            setTitleColor={setTitleColor}
            contentColor={contentColor}
            setContentColor={setContentColor}
            pollOptionsColor={pollOptionsColor}
            setPollOptionsColor={setPollOptionsColor}
            showPoll={showPoll}
            isSubmitting={isSubmitting}
          />
        )}
        
        <FormToggles
          showPoll={showPoll}
          togglePoll={togglePoll}
          showStylingOptions={showStylingOptions}
          toggleStylingOptions={toggleStylingOptions}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          isSubmitting={isSubmitting || isImageUploading}
          onSubmit={handleSubmit}
          isImageUploading={isImageUploading}
        />
      </form>
    </div>
  );
};

export default CreatePostForm; 