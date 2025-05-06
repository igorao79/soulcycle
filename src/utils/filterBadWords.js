/**
 * Улучшенный фильтр нецензурных слов с использованием корней слов,
 * проверки на замену символов и детекцией эвфемизмов
 */

// Корни нецензурных слов для основного анализа
const RUSSIAN_PROFANITY_ROOTS = [
  // Базовые корни
  'бля', 'хуй', 'хуе', 'хуё', 'пизд', 'еба', 'ебл', 'пидор', 'пидар', 'муда', 
  'залуп', 'еби', 'ебы', 'ебу', 'ебё', 'еба', 'дроч', 'хер', 'жоп', 'уеб',
  // Дополнительные корни
  'ебан', 'хуя', 'пизж', 'бляд', 'сук', 'чмо', 'говн', 'мраз', 'долбо', 'дерьм',
  'высер', 'гонд', 'дебил', 'гандон', 'манд', 'шлюх'
];

// Полные слова для проверки, когда корни могут быть частью нормальных слов
const FULL_PROFANITY_WORDS = [
  'блядь', 'бля', 'ебать', 'ебанутый', 'хуй', 'хуйня', 'пизда', 'пиздец', 'пидор', 'пидорас',
  'сука', 'мудак', 'мудила', 'залупа', 'хер', 'херня', 'говно', 'говнюк', 'хуесос', 'долбоеб',
  'дебил', 'гандон', 'шлюха', 'проститутка', 'жопа', 'манда', 'мразь', 'высер', 'дрочить',
  'ебал', 'ебло', 'ебун', 'заебись', 'заебал', 'похуй', 'нахуй', 'чмо', 'дерьмо', 'уебок', 
  'уебище', 'хуила', 'хуево', 'пиздато', 'пиздатый', 'ебаный', 'ебанько', 'пиздабол'
];

// Комбинации символов, которые часто используются для маскировки нецензурных слов
const DISGUISE_PATTERNS = [
  { pattern: /\./, replaceWith: '' },  // х.у.й -> хуй
  { pattern: /\*/, replaceWith: '' },  // х*й -> хуй
  { pattern: /_/, replaceWith: '' },   // х_у_й -> хуй
  { pattern: /-/, replaceWith: '' },   // х-у-й -> хуй
  { pattern: /\s+(?=[а-яёa-z])/, replaceWith: '' }, // х у й -> хуй
  { pattern: /(\w)\1+/, replaceWith: '$1' } // хууууй -> хуй (сжатие повторяющихся букв)
];

// Карта для замены латинских символов на кириллические и наоборот
const CHAR_MAPPINGS = {
  // Латинские символы, которые похожи на кириллические
  'a': 'а', 'b': 'б', 'c': 'с', 'd': 'д', 'e': 'е', 'h': 'н', 'k': 'к', 
  'm': 'м', 'n': 'н', 'o': 'о', 'p': 'р', 'r': 'р', 's': 'с', 't': 'т', 
  'u': 'у', 'v': 'в', 'w': 'ш', 'x': 'х', 'y': 'у', 'z': 'з',
  
  // Кириллические символы, которые могут быть заменены латинскими
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ы': 'i',
  'э': 'e', 'ю': 'yu', 'я': 'ya'
};

/**
 * Проверяет, является ли пользователь администратором
 * @param {Object|null} user - Объект пользователя
 * @returns {boolean} true если пользователь администратор
 */
function isAdminUser(user) {
  if (!user) return false;
  
  // Проверка по различным полям
  if (user.email === 'igoraor79@gmail.com') return true;
  if (user.role === 'admin') return true;
  if (user.activePerk === 'admin') return true;
  if (Array.isArray(user.perks) && user.perks.includes('admin')) return true;
  
  return false;
}

/**
 * Нормализует текст для анализа, удаляя спецсимволы и выполняя 
 * другие преобразования для детекции замаскированных слов
 * @param {string} text - Исходный текст
 * @returns {string} Нормализованный текст
 */
function normalizeText(text) {
  // Приводим к нижнему регистру
  let normalized = text.toLowerCase();
  
  // Применяем шаблоны маскировки
  DISGUISE_PATTERNS.forEach(({ pattern, replaceWith }) => {
    normalized = normalized.replace(pattern, replaceWith);
  });
  
  return normalized;
}

/**
 * Создает альтернативные варианты текста с учетом возможных
 * замен латинских-кириллических символов
 * @param {string} text - Исходный текст
 * @returns {Array<string>} Массив вариантов текста
 */
function createTextVariations(text) {
  // Возвращаем исходный текст и его вариации
  const variations = [text];
  let hasAlternativeChars = false;
  
  // Создаем вариант, где латинские символы заменены на кириллические
  let cyrillicVariation = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (CHAR_MAPPINGS[char]) {
      cyrillicVariation += CHAR_MAPPINGS[char];
      hasAlternativeChars = true;
    } else {
      cyrillicVariation += char;
    }
  }
  
  // Создаем вариант, где кириллические символы заменены на латинские
  let latinVariation = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (CHAR_MAPPINGS[char]) {
      latinVariation += CHAR_MAPPINGS[char];
      hasAlternativeChars = true;
    } else {
      latinVariation += char;
    }
  }
  
  // Добавляем вариации только если они отличаются от оригинала
  if (hasAlternativeChars) {
    variations.push(cyrillicVariation);
    variations.push(latinVariation);
  }
  
  return variations;
}

/**
 * Проверяет, содержит ли текст нецензурные слова
 * @param {string} text - Текст для проверки
 * @returns {boolean} true если найдены нецензурные слова
 */
function containsProfanity(text) {
  // Нормализуем текст и создаем его вариации
  const normalizedText = normalizeText(text);
  const textVariations = createTextVariations(normalizedText);
  
  // Проверяем все вариации текста
  for (const variation of textVariations) {
    // Сначала проверяем полные слова
    for (const word of FULL_PROFANITY_WORDS) {
      // Ищем слово с границами слова
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(variation)) {
        return true;
      }
    }
    
    // Затем проверяем корни слов
    for (const root of RUSSIAN_PROFANITY_ROOTS) {
      // Проверка, что корень не является частью нормального слова через контекст
      const regex = new RegExp(`\\b\\w*${root}\\w*\\b`, 'i');
      if (regex.test(variation)) {
        // Дополнительная проверка найденного слова, содержащего корень
        const matches = variation.match(regex);
        if (matches) {
          const foundWord = matches[0];
          
          // Список исключений (слова, содержащие корни матов, но не являющиеся нецензурными)
          const exceptions = [
            'употребляя', 'употребление', 'заблуждение', 'хлебушек', 'херсон', 
            'схерсонес', 'херес', 'схер', 'хердер', 'гексахлороциклогексан', 'схерстить',
            'скипидар', 'хлеб'
          ];
          
          // Проверяем, не является ли слово исключением
          if (!exceptions.some(ex => foundWord.includes(ex))) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Заменяет нецензурные слова звездочками
 * @param {string} text - Исходный текст
 * @returns {string} Отцензурированный текст
 */
function censorText(text) {
  // Разбиваем текст на слова
  const words = text.split(/\s+/);
  
  // Проверяем каждое слово
  const censoredWords = words.map(word => {
    // Нормализуем слово
    const normalizedWord = normalizeText(word);
    const wordVariations = createTextVariations(normalizedWord);
    
    // Проверяем все вариации слова
    let shouldCensor = false;
    
    for (const variation of wordVariations) {
      // Проверка полных слов
      for (const profanityWord of FULL_PROFANITY_WORDS) {
        const regex = new RegExp(`\\b${profanityWord}\\b`, 'i');
        if (regex.test(variation)) {
          shouldCensor = true;
          break;
        }
      }
      
      if (shouldCensor) break;
      
      // Проверка корней
      for (const root of RUSSIAN_PROFANITY_ROOTS) {
        const regex = new RegExp(`\\b\\w*${root}\\w*\\b`, 'i');
        if (regex.test(variation)) {
          // Проверяем исключения
          const exceptions = [
            'употребляя', 'употребление', 'заблуждение', 'хлебушек', 'херсон', 
            'схерсонес', 'херес', 'схер', 'хердер', 'гексахлороциклогексан', 'схерстить',
            'скипидар', 'хлеб'
          ];
          
          // Если слово не в исключениях, цензурируем
          if (!exceptions.some(ex => variation.includes(ex))) {
            shouldCensor = true;
            break;
          }
        }
      }
      
      if (shouldCensor) break;
    }
    
    // Заменяем слово звездочками если нужно
    return shouldCensor ? '*'.repeat(word.length) : word;
  });
  
  // Собираем текст обратно
  return censoredWords.join(' ');
}

/**
 * Основная функция фильтрации нецензурных слов
 * @param {string} text - Исходный текст
 * @param {Object|null} user - Объект пользователя
 * @returns {string} Отфильтрованный текст
 */
function filterBadWords(text, user) {
  // Базовые проверки
  if (!text) return '';
  if (typeof text !== 'string') return '';
  
  // Админам разрешено использовать любые слова
  if (isAdminUser(user)) {
    return text;
  }
  
  try {
    // Проверяем, содержит ли текст нецензурные слова
    if (containsProfanity(text)) {
      // Если да, то цензурируем текст
      return censorText(text);
    }
    
    // Если нет, возвращаем исходный текст
    return text;
  } catch (error) {
    console.error('Ошибка при фильтрации текста:', error);
    // В случае ошибки возвращаем исходный текст
    return text;
  }
}

export default filterBadWords; 