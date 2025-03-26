export const getSkilledName = (character) => {
  if (!character) return 'Не найден';

  const { name } = character;
  const requiresDeclension = ['Фауст', 'Лонариус']; // Список имен, требующих склонения

  return requiresDeclension.includes(name) ? `${name}а` : name; // Склоняем имя, если это из списка
};
