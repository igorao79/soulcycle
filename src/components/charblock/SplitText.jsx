// SplitText.jsx

import React from 'react';

const SplitText = ({ text }) => {
  return (
    <>
      {text.split('').map((char, index) => {
        // Если символ — пробел, добавляем явный пробел
        const content = char === ' ' ? '\u00A0' : char; // \u00A0 — это неразрывный пробел (&nbsp;)

        return (
          <span
            key={index}
            style={{ animationDelay: `${index * 0.05}s` }} // Задержка для каждой буквы
          >
            {content}
          </span>
        );
      })}
    </>
  );
};

export default SplitText;