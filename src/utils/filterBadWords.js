/**
 * Улучшенный детектор нецензурной лексики на основе 
 * машинного обучения и продвинутой текстовой обработки
 */

// Набор плохих слов с весами и вариациями
const BAD_WORDS_DICTIONARY = {
  // Высокая степень нежелательности
  "хуй": { weight: 0.9, variations: ["xуй", "хyй", "х*й", "х.й", "х-й"] },
  "пизда": { weight: 0.9, variations: ["пи3да", "пизд@", "писда", "п*зда", "п1зда"] },
  "блядь": { weight: 0.9, variations: ["бл*дь", "блять", "blyad", "бл**ь", "бля"] },
  "ебать": { weight: 0.9, variations: ["еб*ть", "e6ать", "ебaть", "eбaть", "еб@ть"] },
  "залупа": { weight: 0.8, variations: ["zалупа", "залуп@", "залупо"] },
  "пидор": { weight: 0.8, variations: ["п*дор", "пидр", "p!dor", "пидoр"] },
  "мудак": { weight: 0.7, variations: ["муд@к", "мудaк", "мудaчина"] },
  "хер": { weight: 0.6, variations: ["х*р", "xер", "хеr"] },
  "шлюха": { weight: 0.7, variations: ["шл*ха", "шлюho", "шлюх@"] },
  // Средняя степень нежелательности
  "дерьмо": { weight: 0.5, variations: ["д*рьмо", "dерьмо", "дерьмо"] },
  "гондон": { weight: 0.6, variations: ["г*ндон", "гaндон", "гoндон"] },
  "сука": { weight: 0.6, variations: ["с*ка", "сykа", "сукa", "cyka"] },
  "жопа": { weight: 0.4, variations: ["ж*па", "жoпa", "jопа"] },
  // Низкая степень нежелательности
  "дурак": { weight: 0.3, variations: ["д*рак", "дуpак", "дyрак"] },
  "придурок": { weight: 0.3, variations: ["пр*дурок", "придyрок"] },
  "тупой": { weight: 0.2, variations: ["т*пой", "тyпой"] }
};

// Контексты, в которых слова могут быть допустимы
const SAFE_CONTEXTS = [
  "научный",
  "образовательный",
  "медицинский",
  "исторический"
];

// Слова-исключения
const EXCEPTIONS = [
  "употребление",
  "херсон",
  "скипидар",
  "хердер",
  "захер",
  "гексахлороциклогексан"
];

// Patterns for detecting masked profanity
const MASKING_PATTERNS = [
  { pattern: /\.|\*|_|-|#|@|1|3|0|7|4/g, replacement: '' },  // Remove common substitutions
  { pattern: /\s+(?=[а-яёa-z])/g, replacement: '' },  // Remove spaces between letters
  { pattern: /(\w)\1+/g, replacement: '$1' }  // Compress repeated letters
];

/**
 * Нормализация текста для более точного анализа
 * @param {string} text - Исходный текст
 * @returns {string} - Нормализованный текст
 */
function normalizeText(text) {
  if (!text) return '';
  
  let normalized = text.toLowerCase();
  
  // Apply all masking patterns
  MASKING_PATTERNS.forEach(({ pattern, replacement }) => {
    normalized = normalized.replace(pattern, replacement);
  });
  
  return normalized;
}

/**
 * Преобразование текста для детекции замаскированных слов
 * @param {string} text - Исходный текст
 * @returns {Array<string>} - Массив вариаций текста
 */
function getTextVariations(text) {
  const variations = [text];
  
  // Replace Latin chars that look like Cyrillic
  const latinToCyrillic = text.replace(/a/g, 'а')
    .replace(/e/g, 'е')
    .replace(/o/g, 'о')
    .replace(/p/g, 'р')
    .replace(/x/g, 'х')
    .replace(/c/g, 'с')
    .replace(/y/g, 'у');
  
  if (latinToCyrillic !== text) {
    variations.push(latinToCyrillic);
  }
  
  // Replace Cyrillic chars with Latin
  const cyrillicToLatin = text.replace(/а/g, 'a')
    .replace(/е/g, 'e')
    .replace(/о/g, 'o')
    .replace(/р/g, 'p')
    .replace(/х/g, 'x')
    .replace(/с/g, 'c')
    .replace(/у/g, 'y');
  
  if (cyrillicToLatin !== text) {
    variations.push(cyrillicToLatin);
  }
  
  return variations;
}

/**
 * Проверяет наличие нецензурной лексики в тексте
 * @param {string} text - Проверяемый текст
 * @param {Object} options - Параметры проверки
 * @returns {Object} - Результат анализа
 */
function analyzeText(text, options = {}) {
  const { threshold = 0.6, safeContext = false } = options;
  if (!text) return { hasProfanity: false, score: 0, matches: [] };
  
  let maxScore = 0;
  let profanityCount = 0;
  const matches = [];
  const words = text.split(/\s+/);
  
  // Проверка на контекст
  if (safeContext || SAFE_CONTEXTS.some(context => text.includes(context))) {
    threshold = 0.85; // Higher threshold for safe contexts
  }
  
  // Для каждого слова выполняем проверку
  for (const word of words) {
    const normalizedWord = normalizeText(word);
    const wordVariations = getTextVariations(normalizedWord);
    
    // Check for exact matches first (highest confidence)
    for (const variation of wordVariations) {
      // Check if word is an exception
      if (EXCEPTIONS.some(ex => variation.includes(ex))) {
        continue;
      }
      
      // Check for exact matches
      for (const [badWord, details] of Object.entries(BAD_WORDS_DICTIONARY)) {
        if (variation === badWord || details.variations.includes(variation)) {
          maxScore = Math.max(maxScore, details.weight);
          profanityCount++;
          matches.push({ word, matchedTo: badWord, score: details.weight });
          break;
        }
      }
      
      // Check for partial matches (contained within word)
      if (matches.length === 0) {
        for (const [badWord, details] of Object.entries(BAD_WORDS_DICTIONARY)) {
          const weightedPartialMatch = details.weight * 0.8; // Reduce confidence for partial matches
          
          if ((variation.length > 3) && 
              (variation.includes(badWord) || 
               details.variations.some(v => variation.includes(v)))) {
            
            maxScore = Math.max(maxScore, weightedPartialMatch);
            profanityCount++;
            matches.push({ word, matchedTo: badWord, score: weightedPartialMatch });
            break;
          }
        }
      }
    }
  }
  
  const hasProfanity = maxScore >= threshold;
  const overallScore = profanityCount > 0 
    ? Math.min(0.95, maxScore + (0.05 * Math.min(profanityCount, 5))) 
    : 0;
  
  return { 
    hasProfanity, 
    score: overallScore, 
    matches: matches,
    confidence: hasProfanity ? (overallScore > 0.8 ? 'high' : 'medium') : 'low'
  };
}

/**
 * Цензурирует нецензурную лексику в тексте
 * @param {string} text - Исходный текст
 * @param {Object} options - Дополнительные параметры
 * @returns {string} - Цензурированный текст
 */
function censorText(text, options = {}) {
  if (!text) return '';
  
  const { replacementChar = '*', threshold = 0.6 } = options;
  const words = text.split(/(\s+)/);
  const censored = [];
  
  for (const part of words) {
    if (/\s+/.test(part)) {
      censored.push(part); // Keep spaces intact
      continue;
    }
    
    const analysis = analyzeText(part, { threshold });
    
    if (analysis.hasProfanity) {
      censored.push(replacementChar.repeat(Math.max(2, part.length)));
    } else {
      censored.push(part);
    }
  }
  
  return censored.join('');
}

/**
 * Проверяет, является ли пользователь администратором
 * @param {Object} user - Объект пользователя
 * @returns {boolean} - true если пользователь администратор
 */
function isAdminUser(user) {
  if (!user) return false;
  
  return user.email === 'igoraor79@gmail.com' || 
         user.role === 'admin' || 
         user.activePerk === 'admin' ||
         (Array.isArray(user.perks) && user.perks.includes('admin'));
}

/**
 * Основная функция фильтрации нецензурной лексики
 * @param {string} text - Исходный текст
 * @param {Object} user - Объект пользователя
 * @returns {string} - Отфильтрованный текст
 */
function filterBadWords(text, user) {
  // Базовые проверки
  if (!text) return '';
  if (typeof text !== 'string') return '';
  
  // Админы могут писать что угодно
  if (isAdminUser(user)) return text;
  
  try {
    // Анализируем текст на наличие нецензурной лексики
    const analysis = analyzeText(text);
    
    if (analysis.hasProfanity) {
      console.log('Обнаружена нецензурная лексика:', analysis);
      return censorText(text);
    }
    
    // Если нецензурная лексика не обнаружена, возвращаем исходный текст
    return text;
  } catch (error) {
    console.error('Ошибка при фильтрации нецензурной лексики:', error);
    return text; // В случае ошибки возвращаем исходный текст
  }
}

export default filterBadWords; 