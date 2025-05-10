import React, { useEffect, useRef } from 'react';

// Встроенные стили для HTML-элементов
const styles = {
  container: {
    fontFamily: 'Graphr, sans-serif',
    lineHeight: '1.5',
  },
  paragraph: {
    marginBottom: '10px',
    lineHeight: '1.5',
    position: 'relative',
  },
  bulletPoint: {
    marginBottom: '10px',
    textIndent: '0',
    position: 'relative',
  },
  blockquote: {
    margin: '2rem 0rem',
    borderLeft: '4px solid var(--accent-color)',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0 8px 8px 0',
  },
  blurredText: {
    filter: 'blur(4px)',
    display: 'inline-block',
  }
};

const HtmlContent = ({ html, onHeightChange }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && onHeightChange) {
      const height = contentRef.current.scrollHeight;
      onHeightChange(height);
    }
  }, [html, onHeightChange]);

  if (!html || typeof html !== 'string') {
    return null;
  }

  // Создаем временный div для парсинга HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Рекурсивно преобразуем HTML в React элементы
  const convertNodeToReact = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes).map(convertNodeToReact);
      const props = {
        key: Math.random().toString(36).substr(2, 9),
        className: node.className || undefined,
      };

      // Определяем встроенные стили в зависимости от типа элемента
      let nodeStyle = {};

      if (node.tagName.toLowerCase() === 'p') {
        // Проверяем, содержит ли параграф маркер • в начале
        const content = node.textContent.trim();
        if (content.startsWith('•')) {
          nodeStyle = { ...styles.bulletPoint };
        } else {
          nodeStyle = { ...styles.paragraph };
        }
      } else if (node.tagName.toLowerCase() === 'blockquote') {
        nodeStyle = { ...styles.blockquote };
      } else if (node.tagName.toLowerCase() === 'span' && 
                node.className && 
                node.className.includes('blur')) {
        nodeStyle = { ...styles.blurredText };
      }

      // Добавляем встроенные стили
      props.style = nodeStyle;

      // Копируем все атрибуты
      Array.from(node.attributes).forEach(attr => {
        if (attr.name !== 'class' && attr.name !== 'style') {
          props[attr.name] = attr.value;
        }
      });

      return React.createElement(node.tagName.toLowerCase(), props, ...children);
    }

    return null;
  };

  return (
    <div ref={contentRef} style={styles.container}>
      {convertNodeToReact(tempDiv)}
    </div>
  );
};

export default HtmlContent; 