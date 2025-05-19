import React from 'react';
import { FiDroplet } from 'react-icons/fi';
import styles from '../../Post.module.scss';
import { FONT_OPTIONS, isDarkColor } from '../utils/helpers';
import { 
  ColorPickerContainer, 
  ColorPreview, 
  ColorNote
} from '../styles/FormStyles';

const StylingOptions = ({
  selectedFont,
  setSelectedFont,
  titleColor,
  setTitleColor,
  contentColor,
  setContentColor,
  pollOptionsColor,
  setPollOptionsColor,
  showPoll,
  isSubmitting
}) => {
  return (
    <div className={styles.stylingOptions}>
      <h4 className={styles.stylingTitle}>
        <FiDroplet /> Настройки стиля
      </h4>
      
      <div className={styles.stylingGroup}>
        <label>Шрифт:</label>
        <select 
          value={selectedFont} 
          onChange={(e) => setSelectedFont(e.target.value)}
          className={styles.fontSelector}
          disabled={isSubmitting}
          style={{ fontFamily: selectedFont }}
        >
          {FONT_OPTIONS.map(font => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className={styles.stylingGroup}>
        <label>Цвет заголовка:</label>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <input 
            type="color" 
            value={titleColor} 
            onChange={(e) => setTitleColor(e.target.value)}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              cursor: 'pointer'
            }}
          />
          <span>{titleColor}</span>
        </div>
        {isDarkColor(titleColor) && (
          <ColorNote>
            Примечание: тёмные цвета будут автоматически адаптированы в темной теме для лучшей читаемости.
          </ColorNote>
        )}
      </div>
      
      <div className={styles.stylingGroup}>
        <label>Цвет текста поста:</label>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <input 
            type="color" 
            value={contentColor} 
            onChange={(e) => setContentColor(e.target.value)}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              cursor: 'pointer'
            }}
          />
          <span>{contentColor}</span>
        </div>
        {isDarkColor(contentColor) && (
          <ColorNote>
            Примечание: тёмные цвета будут автоматически адаптированы в темной теме для лучшей читаемости.
          </ColorNote>
        )}
      </div>
      
      {showPoll && (
        <div className={styles.stylingGroup}>
          <label>Цвет вариантов опроса:</label>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <input 
              type="color" 
              value={pollOptionsColor} 
              onChange={(e) => setPollOptionsColor(e.target.value)}
              style={{
                width: '40px',
                height: '40px',
                border: 'none',
                cursor: 'pointer'
              }}
            />
            <span>{pollOptionsColor}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StylingOptions; 