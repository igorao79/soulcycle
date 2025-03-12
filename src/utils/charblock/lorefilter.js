export const lorefilter = (characters, id) => {
  return characters[id];
};

export const splitLoreIntoPages = (lore) => {
  const paragraphs = lore.split(/<\/?p>/).filter(p => p.trim() !== '');
  const quote = paragraphs.pop();

  const pages = [];
  let currentPageContent = '';
  let charCount = 0;

  const isMobile = window.innerWidth <= 768;
  const screenHeight = window.innerHeight;

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.maxWidth = '600px';
  tempDiv.style.fontFamily = 'graphr, sans-serif';
  tempDiv.style.fontSize = '1.6rem';
  tempDiv.style.lineHeight = '1.5';
  tempDiv.style.padding = '10px';
  tempDiv.style.wordWrap = 'break-word';
  document.body.appendChild(tempDiv);

  const maxHeight = isMobile && screenHeight > 400 ? 600 : 800;
  const maxChars = isMobile ? 500 : Infinity;

  // Если есть хотя бы один абзац, добавляем его сразу
  if (paragraphs.length > 0) {
    const firstParagraph = paragraphs.shift().trim();
    currentPageContent = `<p>${firstParagraph}</p>`;
    charCount = firstParagraph.length;
  }

  paragraphs.forEach((paragraph) => {
    const trimmedParagraph = paragraph.trim();
    const paragraphHtml = `<p>${trimmedParagraph}</p>`;
    const paragraphLength = trimmedParagraph.length;

    tempDiv.innerHTML = currentPageContent + paragraphHtml;

    if (tempDiv.scrollHeight > maxHeight || charCount + paragraphLength > maxChars) {
      pages.push(currentPageContent);
      currentPageContent = paragraphHtml;
      charCount = paragraphLength;
    } else {
      currentPageContent += paragraphHtml;
      charCount += paragraphLength;
    }
  });

  if (currentPageContent) {
    pages.push(currentPageContent);
  }

  if (quote) {
    pages[pages.length - 1] += `<blockquote>${quote.trim()}</blockquote>`;
  }

  document.body.removeChild(tempDiv);
  return pages;
};
