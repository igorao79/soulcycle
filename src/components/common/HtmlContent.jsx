import React from 'react';

const HtmlContent = ({ html }) => {
  const createMarkup = () => {
    return { __html: html };
  };

  return (
    <div dangerouslySetInnerHTML={createMarkup()} />
  );
};

export default HtmlContent; 