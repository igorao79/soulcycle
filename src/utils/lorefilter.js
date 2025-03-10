export const lorefilter = (characters, id) => {
    return characters[id];
  };
  
  export const splitLoreIntoPages = (lore) => {
    const paragraphs = lore.split(/<\/?p>/).filter(p => p.trim() !== '');
    const pages = [];
    for (let i = 0; i < paragraphs.length; i += 5) {
      const pageContent = paragraphs.slice(i, i + 5).map(p => `<p>${p.trim()}</p>`).join('');
      pages.push(pageContent);
    }
    return pages;
  };
  