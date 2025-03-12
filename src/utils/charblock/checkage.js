export function getAgeWord(age) {
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;
  
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'лет';
    }
    if (lastDigit === 1) {
      return 'год';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'года';
    }
    return 'лет';
  }