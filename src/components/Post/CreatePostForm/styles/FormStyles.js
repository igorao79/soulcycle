import styles from '../../Post.module.scss';
import styled from 'styled-components';
import { FiDroplet } from 'react-icons/fi';

// Responsive form styles
export const formOptionsStyle = `
  .${styles.formOptions} {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }
  
  .${styles.formToggles} {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .${styles.optionToggle} {
    display: flex;
    align-items: center;
    gap: 5px;
    background-color: rgba(0, 0, 0, 0.03);
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
    margin-bottom: 5px;
  }
  
  .${styles.submitButton} {
    margin-top: 5px;
    align-self: flex-end;
  }

  .${styles.imagePreview} {
    max-width: 100%;
    margin-top: 10px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ddd;
    position: relative;
  }
  
  .${styles.imagePreview} img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  
  .${styles.imageNote} {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
  }
  
  .${styles.imageUrlInputContainer} {
    display: flex;
    gap: 10px;
  }
  
  .${styles.imageUrlInput} {
    flex: 1;
  }
  
  .${styles.addImageButton} {
    background-color: #f0f2f5;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .${styles.addImageButton}:hover {
    background-color: #e4e6eb;
  }
  
  .${styles.addImageButton}:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .${styles.imageGalleryContainer} {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }
  
  .${styles.imagePreviewItem} {
    position: relative;
  }
  
  .${styles.removeImageButton} {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.2s;
  }
  
  .${styles.removeImageButton}:hover {
    background: rgba(0, 0, 0, 0.7);
  }
  
  .${styles.imageLoading} {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    .${styles.formOptions} {
      width: 100%;
    }
    
    .${styles.formToggles} {
      width: 100%;
      justify-content: flex-start;
    }
    
    .${styles.optionToggle} {
      flex: 0 0 auto;
      font-size: 13px;
    }
    
    .${styles.submitButton} {
      width: 100%;
      margin-top: 10px;
    }
    
    .${styles.imageGalleryContainer} {
      grid-template-columns: 1fr;
    }
  }
`;

// Styled components for color picker
export const ColorPickerContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-left: 10px;
`;

export const ColorPreview = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 5;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const DropletIcon = styled(FiDroplet).attrs(props => ({
  style: {
    color: props.$isDark ? 'white' : 'black',
  }
}))`
  opacity: 0.7;
  stroke-width: 2.5px;
  font-size: 16px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
  
  &:hover {
    opacity: 1;
  }
`;

export const ColorPickerPopup = styled.div`
  position: absolute;
  z-index: 1000;
  top: calc(100% + 8px);
  left: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  border: 2px solid #fff;
  animation: fadeIn 0.2s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .react-colorful {
    width: 240px !important;
    height: 240px !important;
  }
`;

export const ColorPickerCover = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  cursor: default;
`;

export const ColorNote = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  max-width: 300px;
`; 