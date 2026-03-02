// Форматирование чисел с ограничением десятичных знаков
export const formatNumber = (num: number, decimals: number = 1): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  // Округляем до указанного количества знаков после запятой
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  
  // Убираем лишние нули после запятой
  return rounded.toFixed(decimals).replace(/\.?0+$/, '');
};

// Форматирование времени
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0 сек';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${secs}с`;
  }
  if (minutes > 0) {
    return `${minutes}м ${secs}с`;
  }
  return `${secs}с`;
};

// Форматирование процентов
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

// Округление до целого числа
export const roundToInteger = (num: number): number => {
  return Math.round(num);
};