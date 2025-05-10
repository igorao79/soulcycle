// @ts-check
const fs = require('fs');
const path = require('path');

// Путь к файлу version.json
const versionFilePath = path.join(__dirname, '..', 'public', 'version.json');

// Функция для чтения текущей версии
const readCurrentVersion = () => {
  try {
    if (fs.existsSync(versionFilePath)) {
      const data = fs.readFileSync(versionFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка при чтении файла версии:', error);
  }
  
  // Если файл не существует или произошла ошибка, возвращаем версию по умолчанию
  return { version: '1.0.0', buildTimestamp: Date.now() };
};

// Функция для обновления версии
const updateVersion = (type = 'patch') => {
  const currentVersionData = readCurrentVersion();
  const versionParts = currentVersionData.version.split('.').map(Number);
  
  // Обновляем соответствующую часть версии
  switch (type) {
    case 'major':
      versionParts[0] += 1;
      versionParts[1] = 0;
      versionParts[2] = 0;
      break;
    case 'minor':
      versionParts[1] += 1;
      versionParts[2] = 0;
      break;
    case 'patch':
    default:
      versionParts[2] += 1;
      break;
  }
  
  // Формируем новую версию
  const newVersion = versionParts.join('.');
  
  // Обновляем timestamp
  const newTimestamp = Date.now();
  
  // Сохраняем обновленные данные
  const newVersionData = {
    version: newVersion,
    buildTimestamp: newTimestamp
  };
  
  // Создаем директорию public, если она не существует
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Записываем в файл
  fs.writeFileSync(versionFilePath, JSON.stringify(newVersionData, null, 2), 'utf8');
  
  console.log(`Версия обновлена: ${currentVersionData.version} -> ${newVersion}`);
  console.log(`Timestamp: ${newTimestamp}`);
  
  return newVersionData;
};

// Получаем тип обновления из аргументов командной строки
const args = process.argv.slice(2);
const updateType = args[0] || 'patch';

// Запускаем обновление версии
updateVersion(updateType); 