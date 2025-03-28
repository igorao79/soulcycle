export const lorefilter = (characters, id) => {
  const character = characters[id];
  if (!character) {
    console.warn(`Character with id "${id}" not found.`);
    return undefined;
  }

  if (!character.lore || typeof character.lore !== 'string') {
    console.warn(`Invalid or missing "lore" for character "${id}".`);
    return undefined;
  }

  return character;
};

// Функция для замены class на className
const replaceClassWithClassName = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/class=/g, 'className=');
};

export const splitLoreIntoPages = (lore) => {
  if (!lore || typeof lore !== 'string') {
    console.warn('Invalid lore format. Expected a non-empty string.');
    return [];
  }

  if (!/<p>.*?<\/p>/g.test(lore)) {
    console.warn('Invalid lore format. Expected <p> tags.');
    return [`<p>${lore}</p>`];
  }

  const isClient = typeof window !== 'undefined';
  if (!isClient) {
    console.warn('splitLoreIntoPages is running on the server. Skipping layout calculations.');
    return [lore];
  }

  const paragraphs = lore.split('<p>').filter(Boolean).map(p => p.split('</p>')[0].trim());
  const quote = paragraphs.pop() || null;

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
  
  // Добавляем стили для размытых элементов
  const style = document.createElement('style');
  style.textContent = `
    .blur {
      filter: blur(4px);
      display: inline-block;
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(tempDiv);

  try {
    const maxHeight = isMobile && screenHeight > 400 ? 600 : 800;
    const maxChars = isMobile ? 500 : Infinity;

    if (paragraphs.length > 0) {
      const firstParagraph = paragraphs.shift().trim();
      currentPageContent = `<p>${firstParagraph}</p>`;
      charCount = firstParagraph.length;
    }

    paragraphs.forEach((paragraph) => {
      const trimmedParagraph = paragraph.trim();
      const paragraphHtml = `<p>${trimmedParagraph}</p>`;
      const paragraphLength = trimmedParagraph.length;

      tempDiv.innerHTML = replaceClassWithClassName(currentPageContent + paragraphHtml);

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

    if (quote && quote.trim()) {
      const quoteHtml = `<blockquote>${quote.trim()}</blockquote>`;
      tempDiv.innerHTML = replaceClassWithClassName(currentPageContent + quoteHtml);

      if (tempDiv.scrollHeight > maxHeight) {
        pages.push(currentPageContent);
        pages.push(quoteHtml);
      } else {
        pages[pages.length - 1] += quoteHtml;
      }
    }
  } finally {
    document.body.removeChild(tempDiv);
    document.head.removeChild(style);
  }

  return pages;
};