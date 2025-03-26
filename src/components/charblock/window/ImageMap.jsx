const images = import.meta.glob('/src/pics2/icons/*.{png,avif,webp}', { eager: true });

export const ImageMap = Object.fromEntries(
  Object.entries(images).flatMap(([path, module]) => {
    const fileNameMatch = path.match(/([^/]+)\.(png|avif|webp)$/);
    if (!fileNameMatch) return [];

    const fileName = fileNameMatch[1];
    const extension = fileNameMatch[2];

    // Генерируем пути для всех вариантов
    const baseName = path.replace(/\.[^/.]+$/, ''); // Убираем расширение
    return [
      [`${fileName}-light`, {
        avif: `${baseName}.avif`,
        webp: `${baseName}.webp`,
        png: `${baseName}.png`,
      }],
      [`${fileName}-dark`, {
        avif: `${baseName}-black.avif`,
        webp: `${baseName}-black.webp`,
        png: `${baseName}-black.png`,
      }],
    ];
  })
);