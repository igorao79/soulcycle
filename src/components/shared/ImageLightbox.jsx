import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, rgba(33, 33, 38, 0.85) 0%, rgba(68, 68, 77, 0.85) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  box-sizing: border-box;
  perspective: 1000px;
`;

const Modal = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  border-radius: 12px;
  background: rgba(25, 25, 30, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  @media (max-width: 768px) {
    max-width: 95vw;
    padding: 15px;
    border-radius: 8px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  &.prev {
    left: 15px;
  }
  
  &.next {
    right: 15px;
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 18px;
    
    &.prev {
      left: 10px;
    }
    
    &.next {
      right: 10px;
    }
  }
`;

const ImageContainer = styled.div`
  position: relative;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledImage = styled(motion.img)`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
  
  @media (max-width: 768px) {
    max-height: 80vh;
  }
`;

const ImageCounter = styled.div`
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  
  @media (max-width: 768px) {
    bottom: 10px;
    padding: 4px 10px;
    font-size: 12px;
  }
`;

const ImageLightbox = ({ 
  images = [], 
  initialIndex = 0, 
  onClose,
  singleImage = null
}) => {
  // If singleImage is provided, use it as the only image
  const imageList = singleImage ? [singleImage] : images;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);
  
  const handleNext = useCallback(() => {
    if (currentIndex < imageList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, imageList.length]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    // Prevent scrolling while lightbox is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore scrolling when lightbox is closed
      document.body.style.overflow = '';
    };
  }, [onClose, handlePrev, handleNext]);
  
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Exit if no images
  if (!imageList.length) return null;
  
  const showNavigation = imageList.length > 1;
  
  return ReactDOM.createPortal(
    <Backdrop onClick={handleBackdropClick}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
        
        <ImageContainer>
          {showNavigation && (
            <>
              <NavButton 
                className="prev" 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                disabled={currentIndex === 0}
              >
                <FiChevronLeft />
              </NavButton>
              
              <NavButton 
                className="next" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={currentIndex === imageList.length - 1}
              >
                <FiChevronRight />
              </NavButton>
            </>
          )}
          
          <AnimatePresence mode="wait">
            <StyledImage
              key={`lightbox-image-${currentIndex}`}
              src={imageList[currentIndex]}
              alt={`Изображение ${currentIndex + 1}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          
          {showNavigation && (
            <ImageCounter>
              {currentIndex + 1} / {imageList.length}
            </ImageCounter>
          )}
        </ImageContainer>
      </Modal>
    </Backdrop>,
    document.getElementById('modal-root') || document.body
  );
};

export default ImageLightbox; 