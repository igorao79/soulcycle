import React, { useEffect, useRef } from 'react';

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
        style: node.style.cssText || undefined,
      };

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
    <div ref={contentRef} className="html-content">
      {convertNodeToReact(tempDiv)}
    </div>
  );
};

export default HtmlContent; 