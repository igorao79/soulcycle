export const lorefilter = (characters: Record<string, string>, id: string): string | undefined => {
  return characters[id];
};

export const splitLoreIntoPages = (lore: string): string[] => {
  const paragraphs: string[] = lore.match(/<p>(.*?)<\/p>/g)?.map(p => p.replace(/<\/?p>/g, '')) || [];
  const quote: string | null = paragraphs.length > 0 ? paragraphs.pop() || null : null;

  const pages: string[] = [];
  let currentPageContent = '';
  let charCount = 0;

  const isMobile: boolean = window.innerWidth <= 768;
  const screenHeight: number = window.innerHeight;

  const tempDiv: HTMLDivElement = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.maxWidth = '600px';
  tempDiv.style.fontFamily = 'graphr, sans-serif';
  tempDiv.style.fontSize = '1.6rem';
  tempDiv.style.lineHeight = '1.5';
  tempDiv.style.padding = '10px';
  tempDiv.style.wordWrap = 'break-word';
  document.body.appendChild(tempDiv);

  const maxHeight: number = isMobile && screenHeight > 400 ? 600 : 800;
  const maxChars: number = isMobile ? 500 : Infinity;

  if (paragraphs.length > 0) {
      const firstParagraph: string = paragraphs.shift()!.trim();
      currentPageContent = `<p>${firstParagraph}</p>`;
      charCount = firstParagraph.length;
  }

  paragraphs.forEach((paragraph: string) => {
      const trimmedParagraph: string = paragraph.trim();
      const paragraphHtml: string = `<p>${trimmedParagraph}</p>`;
      const paragraphLength: number = trimmedParagraph.length;

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

  // Добавляем quote, только если он не пустой
  if (quote && quote.trim()) {
      if (pages.length === 0) {
          pages.push(`<blockquote>${quote.trim()}</blockquote>`); // Если нет страниц, создаем первую
      } else {
          pages[pages.length - 1] += `<blockquote>${quote.trim()}</blockquote>`;
      }
  }

  document.body.removeChild(tempDiv);
  return pages;
};
