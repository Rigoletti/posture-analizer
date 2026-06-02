import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Rating,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Fade,
  useTheme,
  alpha,
  useMediaQuery,
  SwipeableDrawer,
  Paper,
  Snackbar,
  Backdrop
} from '@mui/material';
import {
  Close,
  Star,
  Send,
  RateReview,
  Dashboard,
  Psychology,
  Lightbulb,
  Spa,
  Warning
} from '@mui/icons-material';
import { reviewsApi } from '../../api/reviews';

interface ReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onClose?: () => void;
}

const TAGS = [
  'точный',
  'удобный',
  'полезный',
  'инновационный',
  'надежный',
  'быстрый',
  'дружелюбный'
];

const REVIEW_TYPES = [
  { value: 'service', label: 'О сервисе', icon: <Dashboard sx={{ fontSize: 20 }} />, description: 'Общее впечатление о работе сервиса' },
  { value: 'product', label: 'О продукте', icon: <Psychology sx={{ fontSize: 20 }} />, description: 'Отзыв о конкретном продукте' },
  { value: 'feature', label: 'О функции', icon: <Lightbulb sx={{ fontSize: 20 }} />, description: 'Отзыв о конкретной функции' },
  { value: 'general', label: 'Общее впечатление', icon: <Spa sx={{ fontSize: 20 }} />, description: 'Общее впечатление о платформе' }
];

// Исправленная система фильтрации контента
class ContentFilter {
  // Только матерные слова и их производные
  private static badWords: string[] = [
    // Базовые матерные слова
    'хуй', 'хуя', 'хуе', 'хуё', 'хуи', 'хую', 'хуйня', 'хуйнёй', 'хуйней',
    'Кузьмин','хер', 'хера', 'херу', 'хере', 'херня', 'хернёй', 'херней',
    'пизда', 'пизды', 'пизде', 'пизду', 'пиздой', 'пиздец', 'пиздюк',
    'ебать', 'ебаться', 'ебал', 'ебала', 'ебали', 'ебанутый', 'ебанутая',
    'ебёт', 'ебет', 'ёбнет', 'ебнет', 'ёбнутый', 'ебнутый',
    'блядь', 'блять', 'блядина', 'блядский', 'блядская',
    'сука', 'суки', 'суке', 'суку', 'сукой', 'сучка', 'сучий',
    'нахуй', 'нахуя', 'нахер', 'нахера',
    'заебал', 'заебала', 'заебало', 'заебали', 'заёб',
    'охуел', 'охуела', 'охуело', 'охуели', 'охуеть', 'ахуеть',
    'хуево', 'хуёво', 'хуевый', 'хуёвый',
    'пидор', 'пидорас', 'пидарас', 'педик', 'пидр',
    'гондон', 'гандон',
    'мудак', 'мудила',
    'долбоёб', 'долбоеб', 'долбанутый',
    'уёбок', 'уебак', 'уёбище', 'уебище',
    'еблан',
    'выебон', 'выебываться',
    'манда', 'мандавошка',
    'елда', 'елдак',
    'жопа', 'жопой', 'жопе', 'жопу',
    'дрочить', 'дрочер', 'дрочила',
    'шлюха', 'шлюшка',
    'чмо', 'чмырь', 'чмошник',
    'ублюдок', 'ублюдка',
    'мразь', 'мрази',
    'тварь', 'твари',
    'гнида', 'гниды',
    'падла', 'падлюка',
    'козёл', 'козел', 'козлина',
  ];

  // Матерные фразы и выражения
  private static badPhrases: string[] = [
    'ёб твою мать', 'еб твою мать', 'ёб вашу мать', 'еб вашу мать',
    'ебал твою мать', 'ебал вашу мать', 'ебал я', 'я ебал',
    'выебал', 'выйебал', 'мать твою ебал', 'мать вашу ебал',
    'иди на хуй', 'иди нахуй', 'пошёл на хуй', 'пошел на хуй',
    'соси хуй', 'сосите хуй', 'сосёшь хуй', 'сосешь хуй'
  ];

  // Слова, связанные с политикой
  private static politicalWords: string[] = [
    'путин', 'зеленский', 'зеленський', 'трамп', 'байден', 'навальный',
    'выборы', 'голосование', 'партия', 'депутат', 'президент',
    'правительство', 'оппозиция', 'митинг', 'протест', 'революция',
    'демократия', 'диктатура', 'коррупция', 'санкции',
    'агрессия', 'оккупация', 'аннексия', 'крым', 'донбасс',
    'лнр', 'днр', 'сво', 'мобилизация', 'уклонист',
    'политик', 'политика', 'госдума', 'совет федерации',
    'конституция', 'референдум', 'импичмент', 'госпереворот',
    'евромайдан', 'майдан',
    'ватник', 'укроп', 'хохол', 'кацап', 'москаль',
    'бандеровец', 'фашист', 'нацист', 'рашист',
    'либерал', 'коммунист', 'демократ', 'республиканец',
  ];

  // Слова, связанные с религией
  private static religiousWords: string[] = [
    'бог', 'аллах', 'иисус', 'христос', 'мухаммед', 'пророк',
    'церковь', 'мечеть', 'синагога', 'храм', 'костел',
    'батюшка', 'священник', 'пастор', 'мулла', 'раввин',
    'патриарх', 'кирилл', 'ватикан',
    'православие', 'католицизм', 'ислам', 'мусульманство',
    'буддизм', 'иудаизм', 'атеизм', 'секта', 'религия',
    'вера', 'верующий', 
    'молитва', 'крещение', 'причастие', 'исповедь',
   'рамадан', 'курбан', 'ураза',
    'евангелие', 'библия', 'коран', 'тора', 
    'икона'
  ];

  // Слова, связанные с острыми социальными темами
  private static sensitiveTopics: string[] = [
    'наркотик', 'наркоман', 'наркота', 'героин', 'кокаин',
    'марихуана', 'трава', 'шишки', 'закладка', 'соль',
    'спайс', 'метадон', 'амфетамин', 'экстази', 'лсд',
    'алкоголь', 'водка', 'пиво', 'бухать', 'пьянка',
    'самоубийство', 'суицид', 'повеситься', 'утопиться',
    'убийство', 'убить', 'расчленить', 'зарезать',
    'теракт', 'террорист', 'взрыв', 'бомба',
    'оружие', 'пистолет', 'автомат', 'граната',
    'педофил', 'педофилия', 'насилие', 'изнасилование',
    'расизм', 'расист', 'дискриминация', 'ксенофобия',
    'гомофобия', 'гомофоб', 'трансфобия',
  ];

  // Нормализация текста для поиска (убираем цифры, латиницу и т.д.)
  private static normalizeText(text: string): string {
    let normalized = text.toLowerCase();
    
    // Замена цифр на буквы (leet speak)
    const digitMap: { [key: string]: string } = {
      '0': 'о', '1': 'и', '2': 'з', '3': 'е', '4': 'а', 
      '5': 'с', '6': 'б', '7': 'т', '8': 'в', '9': 'д'
    };
    
    for (const [digit, letter] of Object.entries(digitMap)) {
      normalized = normalized.replace(new RegExp(digit, 'g'), letter);
    }
    
    // Замена латиницы на кириллицу
    const latinToCyrillic: { [key: string]: string } = {
      'a': 'а', 'b': 'б', 'c': 'с', 'd': 'д', 'e': 'е',
      'f': 'ф', 'g': 'г', 'h': 'н', 'i': 'и', 'j': 'ж',
      'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
      'p': 'р', 'q': 'к', 'r': 'р', 's': 'с', 't': 'т',
      'u': 'у', 'v': 'в', 'w': 'в', 'x': 'х', 'y': 'у',
      'z': 'з'
    };
    
    for (const [latin, cyrillic] of Object.entries(latinToCyrillic)) {
      normalized = normalized.replace(new RegExp(latin, 'g'), cyrillic);
    }
    
    return normalized;
  }

  // Проверка на наличие матерных слов
  private static findBadWords(text: string): string[] {
    const lowerText = text.toLowerCase();
    const normalizedText = this.normalizeText(text);
    const found: Set<string> = new Set();
    
    // Проверяем отдельные слова
    for (const word of this.badWords) {
      const normalizedWord = this.normalizeText(word);
      if (normalizedText.includes(normalizedWord) || lowerText.includes(word)) {
        found.add(word);
      }
    }
    
    // Проверяем фразы (только если есть матерный контекст)
    for (const phrase of this.badPhrases) {
      const normalizedPhrase = this.normalizeText(phrase);
      if (normalizedText.includes(normalizedPhrase) || lowerText.includes(phrase)) {
        found.add(phrase);
      }
    }
    
    // Дополнительная проверка: если есть матерные слова и "мать" или "вашу"
    const hasBadWords = found.size > 0;
    if (!hasBadWords) {
      const hasMatContext = this.badWords.some(word => 
        normalizedText.includes(this.normalizeText(word))
      );
      
      if (hasMatContext) {
        // Проверяем комбинации мата с обычными словами
        if (lowerText.includes('мать') || lowerText.includes('вашу') || lowerText.includes('твою')) {
          found.add('матерное выражение');
        }
      }
    }
    
    return Array.from(found);
  }

  // Проверка на наличие запрещенных слов в темах
  private static findTopicWords(text: string, topicWords: string[]): string[] {
    const lowerText = text.toLowerCase();
    const found: string[] = [];
    
    for (const word of topicWords) {
      if (lowerText.includes(word)) {
        found.push(word);
      }
    }
    
    return found;
  }

  // Основной метод проверки контента
  static checkContent(text: string, title: string): { 
    isAllowed: boolean; 
    violations: string[];
    category: string;
  } {
    const fullText = `${title} ${text}`;
    const violations: string[] = [];
    let category = '';

    // Проверка мата
    const badWordsFound = this.findBadWords(fullText);
    if (badWordsFound.length > 0) {
      violations.push(...badWordsFound);
      category = 'Нецензурная лексика';
      
      // Если нашли мат, сразу возвращаем результат
      return {
        isAllowed: false,
        violations: [...new Set(violations)],
        category
      };
    }

    // Проверка политических тем
    const politicalWordsFound = this.findTopicWords(fullText, this.politicalWords);
    if (politicalWordsFound.length > 0) {
      violations.push(...politicalWordsFound);
      category = category || 'Политическая тематика';
    }

    // Проверка религиозных тем
    const religiousWordsFound = this.findTopicWords(fullText, this.religiousWords);
    if (religiousWordsFound.length > 0) {
      violations.push(...religiousWordsFound);
      category = category || 'Религиозная тематика';
    }

    // Проверка острых социальных тем
    const sensitiveWordsFound = this.findTopicWords(fullText, this.sensitiveTopics);
    if (sensitiveWordsFound.length > 0) {
      violations.push(...sensitiveWordsFound);
      category = category || 'Запрещенная тематика';
    }

    return {
      isAllowed: violations.length === 0,
      violations: [...new Set(violations)],
      category
    };
  }

  // Цензурирование текста (замена звездочками)
  static censorText(text: string): string {
    let censored = text;
    
    for (const word of this.badWords) {
      const regex = new RegExp(word, 'gi');
      censored = censored.replace(regex, match => '*'.repeat(match.length));
    }
    
    return censored;
  }
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  onSuccess,
  onCancel,
  open = false,
  onClose
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [type, setType] = useState('service');
  const [rating, setRating] = useState<number | null>(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [contentWarning, setContentWarning] = useState<string | null>(null);

  // Проверка контента в реальном времени
  const checkContentInRealTime = useCallback((textValue: string, titleValue: string) => {
    if (textValue.length > 2 || titleValue.length > 2) {
      const { isAllowed, violations, category } = ContentFilter.checkContent(textValue, titleValue);
      if (!isAllowed) {
        setContentWarning(`⚠️ Обнаружена запрещенная тематика: ${category}. Пожалуйста, измените текст.`);
        console.log('Найденные нарушения:', violations);
      } else {
        setContentWarning(null);
      }
    } else {
      setContentWarning(null);
    }
  }, []);

  // Обработчики изменений с проверкой
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    checkContentInRealTime(text, newTitle);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    checkContentInRealTime(newText, title);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Базовая валидация
    if (!rating) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Пожалуйста, поставьте оценку');
      setSnackbarOpen(true);
      return;
    }
    
    if (!text.trim()) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Пожалуйста, напишите отзыв');
      setSnackbarOpen(true);
      return;
    }
    
    if (text.trim().length < 10) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Отзыв должен содержать не менее 10 символов');
      setSnackbarOpen(true);
      return;
    }

    if (text.trim().length > 2000) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Отзыв не должен превышать 2000 символов');
      setSnackbarOpen(true);
      return;
    }

    // Строгая проверка контента перед отправкой
    const { isAllowed, category } = ContentFilter.checkContent(text, title);
    
    if (!isAllowed) {
      setSnackbarSeverity('error');
      setSnackbarMessage(`❌ Ваш отзыв содержит ${category.toLowerCase()}. Пожалуйста, отредактируйте текст и уберите запрещенную тематику.`);
      setSnackbarOpen(true);
      setError(`Обнаружена запрещенная тематика: ${category}`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setContentWarning(null);

      // Двойная цензура на всякий случай
      const censoredText = ContentFilter.censorText(text.trim());
      const censoredTitle = ContentFilter.censorText(title.trim());
      
      const reviewData = {
        type,
        rating: rating,
        title: censoredTitle || undefined,
        text: censoredText,
        tags: selectedTags
      };
      
      const result = await reviewsApi.createReview(reviewData);
      
      setSuccess(true);
      setSnackbarSeverity('success');
      setSnackbarMessage('Спасибо за ваш отзыв! Он поможет нам стать лучше.');
      setSnackbarOpen(true);
      
      setTimeout(() => {
        resetForm();
        if (onSuccess) {
          onSuccess();
        }
        if (onClose) {
          onClose();
        }
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating review:', err);
      const errorMessage = err.message || 'Ошибка при отправке отзыва';
      setError(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClose = () => {
    if ((text.trim() || title.trim() || selectedTags.length > 0) && !success) {
      if (window.confirm('Вы уверены, что хотите закрыть форму? Введенные данные будут потеряны.')) {
        resetForm();
        if (onClose) onClose();
        if (onCancel) onCancel();
      }
    } else {
      resetForm();
      if (onClose) onClose();
      if (onCancel) onCancel();
    }
  };

  const resetForm = () => {
    setType('service');
    setRating(5);
    setTitle('');
    setText('');
    setSelectedTags([]);
    setError(null);
    setSuccess(false);
    setShowTagSelector(false);
    setContentWarning(null);
  };

  const getRatingLabel = (value: number | null) => {
    if (!value) return 'Оцените';
    switch (value) {
      case 1: return 'Ужасно';
      case 2: return 'Плохо';
      case 3: return 'Нормально';
      case 4: return 'Хорошо';
      case 5: return 'Отлично!';
      default: return '';
    }
  };

  const getRatingDescription = (value: number | null) => {
    if (!value) return '';
    switch (value) {
      case 1: return 'Сервис не соответствует ожиданиям';
      case 2: return 'Есть много недостатков';
      case 3: return 'Нормально, но есть куда расти';
      case 4: return 'Хороший сервис, рекомендую';
      case 5: return 'Превосходно! Очень доволен';
      default: return '';
    }
  };

  // Компонент предупреждения о контенте
  const ContentWarningAlert = () => (
    contentWarning && (
      <Fade in={true}>
        <Alert 
          severity="warning"
          icon={<Warning />}
          sx={{ 
            mb: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            color: theme.palette.warning.light || theme.palette.warning.main
          }}
        >
          {contentWarning}
        </Alert>
      </Fade>
    )
  );

  // Мобильная версия с использованием SwipeableDrawer
  if (isMobile) {
    return (
      <>
        <Backdrop
          sx={{
            zIndex: (theme) => theme.zIndex.drawer - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          open={open}
          onClick={handleClose}
        />
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          onOpen={() => {}}
          disableSwipeToOpen={false}
          keepMounted
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '85vh',
              bgcolor: theme.palette.background.paper,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }
          }}
        >
          {/* Свайп-индикатор */}
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: theme.palette.text.disabled,
              borderRadius: 2,
              mx: 'auto',
              mt: 1.5,
              mb: 1,
              cursor: 'pointer',
            }}
          />
          
          {/* Заголовок */}
          <Box sx={{ 
            px: 2, 
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <RateReview sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Оставить отзыв
              </Typography>
            </Stack>
            <IconButton onClick={handleClose} disabled={loading} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Контент с прокруткой */}
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            p: 2,
            pb: 2
          }}>
            <form id="mobile-review-form" onSubmit={handleSubmit}>
              <ContentWarningAlert />
              
              {/* Выбор типа отзыва */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}>
                  Тип отзыва
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1
                }}>
                  {REVIEW_TYPES.map((option) => (
                    <Paper
                      key={option.value}
                      variant="outlined"
                      onClick={() => setType(option.value)}
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        bgcolor: type === option.value 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                        borderColor: type === option.value
                          ? theme.palette.primary.main
                          : theme.palette.divider,
                        borderWidth: type === option.value ? 2 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {React.cloneElement(option.icon, {
                          sx: { 
                            fontSize: 20,
                            color: type === option.value 
                              ? theme.palette.primary.main 
                              : theme.palette.text.secondary
                          }
                        })}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: type === option.value ? 600 : 400,
                            color: type === option.value 
                              ? theme.palette.primary.main 
                              : theme.palette.text.secondary,
                            fontSize: '0.7rem'
                          }}
                        >
                          {option.label}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </Box>

              {/* Оценка */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1.5, 
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}>
                  Ваша оценка
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 3
                }}>
                  <Rating
                    value={rating}
                    onChange={(_, value) => setRating(value)}
                    size="large"
                    icon={<Star sx={{ fontSize: 40, color: theme.palette.warning.main }} />}
                    emptyIcon={<Star sx={{ fontSize: 40, color: theme.palette.text.disabled }} />}
                  />
                  <Typography sx={{ 
                    color: theme.palette.warning.main,
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    {getRatingLabel(rating)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
                    {getRatingDescription(rating)}
                  </Typography>
                </Box>
              </Box>

              {/* Заголовок */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1, 
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}>
                  Заголовок (необязательно)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Кратко опишите впечатление"
                  disabled={loading}
                  inputProps={{ maxLength: 100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                      borderRadius: 2
                    }
                  }}
                />
              </Box>

              {/* Текст отзыва */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1, 
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}>
                  Ваш отзыв *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Расскажите о вашем опыте использования Posture Analyzer..."
                  error={text.trim().length > 0 && text.trim().length < 10}
                  helperText={
                    text.trim().length > 0 && text.trim().length < 10 
                      ? 'Минимум 10 символов' 
                      : text.length > 0 ? `${text.length}/2000 символов` : ''
                  }
                  disabled={loading}
                  inputProps={{ maxLength: 2000 }}
                  FormHelperTextProps={{
                    sx: { ml: 0, fontSize: '0.7rem' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                      borderRadius: 2
                    }
                  }}
                />
              </Box>

              {/* Теги */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 1.5
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Что вам понравилось?
                  </Typography>
                  <Chip
                    label={`${selectedTags.length} выбрано`}
                    size="small"
                    variant="outlined"
                    onClick={() => setShowTagSelector(!showTagSelector)}
                  />
                </Box>
                
                {!showTagSelector ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedTags.length === 0 ? (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Нажмите для выбора тегов
                      </Typography>
                    ) : (
                      selectedTags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          onDelete={() => handleTagToggle(tag)}
                          color="primary"
                          sx={{ height: 28 }}
                        />
                      ))
                    )}
                    {selectedTags.length > 0 && selectedTags.length < TAGS.length && (
                      <Chip
                        label="+ добавить"
                        size="small"
                        variant="outlined"
                        onClick={() => setShowTagSelector(true)}
                        sx={{ height: 28 }}
                      />
                    )}
                  </Box>
                ) : (
                  <Paper sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                      {TAGS.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          onClick={() => handleTagToggle(tag)}
                          color={selectedTags.includes(tag) ? 'primary' : 'default'}
                          variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                          size="small"
                          sx={{ height: 28 }}
                        />
                      ))}
                    </Box>
                    <Button 
                      size="small" 
                      fullWidth 
                      variant="outlined"
                      onClick={() => setShowTagSelector(false)}
                    >
                      Готово ({selectedTags.length})
                    </Button>
                  </Paper>
                )}
              </Box>
            </form>
          </Box>

          {/* Кнопки действий */}
          <Box sx={{ 
            p: 2,
            pt: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            flexShrink: 0
          }}>
            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !rating || !text.trim() || text.trim().length < 10 || !!contentWarning}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }}
              >
                {loading ? 'Отправка...' : 'Опубликовать отзыв'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleClose}
                disabled={loading}
                sx={{ color: theme.palette.text.secondary }}
              >
                Отмена
              </Button>
            </Stack>
          </Box>
        </SwipeableDrawer>

        {/* Snackbar для уведомлений */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbarSeverity} 
            sx={{ 
              borderRadius: 2,
              width: '100%',
              bgcolor: theme.palette.background.paper
            }}
            onClose={() => setSnackbarOpen(false)}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Десктопная версия
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          boxShadow: theme.shadows[10],
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'relative'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: theme.palette.text.primary
          }}>
            <RateReview sx={{ 
              color: theme.palette.primary.main,
              fontSize: 28
            }} />
            Оставить отзыв
          </Typography>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
            disabled={loading}
          >
            <Close />
          </IconButton>
        </Stack>
        <Typography variant="body2" sx={{ 
          color: theme.palette.text.secondary,
          mt: 1.5,
          fontWeight: 400
        }}>
          Ваше мнение помогает нам улучшать сервис
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <form id="desktop-review-form" onSubmit={handleSubmit}>
          <ContentWarningAlert />
          
          {error && (
            <Fade in={true}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  color: theme.palette.error.light
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Fade>
          )}
          
          {success && (
            <Fade in={true}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  color: theme.palette.success.light
                }}
              >
                Спасибо за ваш отзыв! Он поможет нам стать лучше.
              </Alert>
            </Fade>
          )}

          {/* Тип отзыва */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ 
              color: theme.palette.text.primary,
              mb: 1.5,
              fontWeight: 500
            }}>
              Тип отзыва *
            </Typography>
            <FormControl fullWidth>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                sx={{
                  color: theme.palette.text.primary,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.divider, 0.3),
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    borderColor: alpha(theme.palette.text.secondary, 0.5)
                  },
                  '&.Mui-focused': {
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                      mt: 1,
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: theme.palette.primary.light,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.3)
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {REVIEW_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {React.cloneElement(option.icon, {
                        sx: { color: theme.palette.primary.main }
                      })}
                      <Typography sx={{ color: 'inherit', fontWeight: 500 }}>
                        {option.label}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Оценка */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ 
              color: theme.palette.text.primary,
              mb: 2,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}>
              Ваша оценка *
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}>
              <Rating
                value={rating}
                onChange={(_, value) => setRating(value)}
                size="large"
                icon={<Star sx={{ 
                  fontSize: 48, 
                  color: theme.palette.warning.main,
                  filter: `drop-shadow(0 0 4px ${alpha(theme.palette.warning.main, 0.4)})`
                }} />}
                emptyIcon={<Star sx={{ 
                  fontSize: 48, 
                  color: theme.palette.text.disabled,
                  opacity: 0.5
                }} />}
                sx={{ 
                  '& .MuiRating-icon': { 
                    mr: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }
                }}
              />
              <Typography sx={{ 
                color: theme.palette.warning.main,
                fontSize: '1.25rem',
                fontWeight: 600,
                mt: 1,
                minHeight: 30
              }}>
                {getRatingLabel(rating)}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {getRatingDescription(rating)}
              </Typography>
            </Box>
          </Box>

          {/* Заголовок */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ 
              color: theme.palette.text.primary,
              mb: 1.5,
              fontWeight: 500
            }}>
              Заголовок отзыва
            </Typography>
            <TextField
              fullWidth
              value={title}
              onChange={handleTitleChange}
              placeholder="Кратко опишите ваше впечатление"
              variant="outlined"
              disabled={loading}
              inputProps={{ maxLength: 100 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: alpha(theme.palette.text.secondary, 0.5),
                    bgcolor: alpha(theme.palette.background.paper, 0.7)
                  },
                  '&.Mui-focused': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }
              }}
            />
          </Box>

          {/* Текст отзыва */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ 
              color: theme.palette.text.primary,
              mb: 1.5,
              fontWeight: 500
            }}>
              Ваш отзыв *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={text}
              onChange={handleTextChange}
              placeholder="Расскажите о вашем опыте использования Posture Analyzer..."
              error={text.trim().length > 0 && text.trim().length < 10}
              helperText={
                text.trim().length > 0 && text.trim().length < 10 
                  ? 'Минимум 10 символов' 
                  : text.length > 0 ? `${text.length}/2000 символов` : 'Текст отзыва обязателен'
              }
              disabled={loading}
              inputProps={{ maxLength: 2000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.7)
                  },
                  '&.Mui-focused': {
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                },
                '& .MuiFormHelperText-root': {
                  mx: 0,
                  mt: 1
                }
              }}
            />
          </Box>

          {/* Теги */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ 
              color: theme.palette.text.primary,
              mb: 2,
              fontWeight: 500
            }}>
              Что вам понравилось? (можно выбрать несколько)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => handleTagToggle(tag)}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      bgcolor: isSelected 
                        ? alpha(theme.palette.primary.main, 0.2) 
                        : 'transparent',
                      color: isSelected 
                        ? theme.palette.primary.light 
                        : theme.palette.text.secondary,
                      borderColor: isSelected 
                        ? theme.palette.primary.main 
                        : theme.palette.divider,
                      borderWidth: isSelected ? 2 : 1,
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.9rem',
                      py: 1,
                      px: 1.5,
                      height: 'auto',
                      '&:hover': {
                        bgcolor: isSelected 
                          ? alpha(theme.palette.primary.main, 0.3) 
                          : alpha(theme.palette.primary.main, 0.1),
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s'
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button
          onClick={handleClose}
          sx={{
            color: theme.palette.text.secondary,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 500,
            '&:hover': {
              color: theme.palette.text.primary,
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            },
            transition: 'all 0.2s'
          }}
          disabled={loading}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !rating || !text.trim() || text.trim().length < 10 || !!contentWarning}
          startIcon={loading ? 
            <CircularProgress size={20} sx={{ color: theme.palette.primary.contrastText }} /> : 
            <Send />
          }
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            fontSize: '1rem',
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`
            },
            '&:disabled': {
              background: theme.palette.action.disabledBackground,
              color: theme.palette.text.disabled,
              boxShadow: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Отправка...' : 'Опубликовать отзыв'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewForm;