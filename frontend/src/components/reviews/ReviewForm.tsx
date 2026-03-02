import React, { useState } from 'react';
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
  InputLabel,
  Select,
  MenuItem,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close,
  Star,
  Tag,
  Send,
  RateReview,
  Dashboard,
  Psychology,
  Lightbulb,
  Spa
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
  { value: 'service', label: 'О сервисе', icon: <Dashboard sx={{ fontSize: 20 }} /> },
  { value: 'product', label: 'О продукте', icon: <Psychology sx={{ fontSize: 20 }} /> },
  { value: 'feature', label: 'О функции', icon: <Lightbulb sx={{ fontSize: 20 }} /> },
  { value: 'general', label: 'Общее впечатление', icon: <Spa sx={{ fontSize: 20 }} /> }
];

const ReviewForm: React.FC<ReviewFormProps> = ({
  onSuccess,
  onCancel,
  open = false,
  onClose
}) => {
  const theme = useTheme();
  
  const [type, setType] = useState('service');
  const [rating, setRating] = useState<number | null>(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }
    
    if (!text.trim()) {
      setError('Пожалуйста, напишите отзыв');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const reviewData = {
        type,
        rating: rating,
        title: title.trim() || undefined,
        text: text.trim(),
        tags: selectedTags
      };
      
      const result = await reviewsApi.createReview(reviewData);
      
      setSuccess(true);
      
      // Сброс формы
      setTimeout(() => {
        setType('service');
        setRating(5);
        setTitle('');
        setText('');
        setSelectedTags([]);
        setSuccess(false);
        
        if (onSuccess) {
          onSuccess();
        }
        
        if (onClose) {
          onClose();
        }
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating review:', err);
      setError(err.message || 'Ошибка при отправке отзыва');
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
    // Сброс формы при закрытии
    setType('service');
    setRating(5);
    setTitle('');
    setText('');
    setSelectedTags([]);
    setError(null);
    setSuccess(false);
    
    if (onClose) {
      onClose();
    }
    if (onCancel) {
      onCancel();
    }
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

  const getTypeIcon = (typeValue: string) => {
    const type = REVIEW_TYPES.find(t => t.value === typeValue);
    return type?.icon || <Dashboard sx={{ fontSize: 20 }} />;
  };

  const getTypeLabel = (typeValue: string) => {
    const type = REVIEW_TYPES.find(t => t.value === typeValue);
    return type?.label || 'О сервисе';
  };

  const formContent = (
    <form onSubmit={handleSubmit}>
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
              },
              '& .MuiSelect-icon': {
                color: theme.palette.text.secondary
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
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Кратко опишите ваше впечатление"
          variant="outlined"
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              color: theme.palette.text.primary,
              borderRadius: 2,
              borderColor: alpha(theme.palette.divider, 0.3),
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
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1
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
          onChange={(e) => setText(e.target.value)}
          placeholder="Расскажите о вашем опыте использования Posture Analyzer..."
          error={text.trim().length === 0}
          helperText={text.trim().length === 0 ? 'Текст отзыва обязателен' : ''}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              color: theme.palette.text.primary,
              borderRadius: 2,
              borderColor: text.trim().length === 0 
                ? alpha(theme.palette.error.main, 0.5) 
                : alpha(theme.palette.divider, 0.3),
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: text.trim().length === 0 
                  ? alpha(theme.palette.error.main, 0.7) 
                  : alpha(theme.palette.text.secondary, 0.5),
                bgcolor: alpha(theme.palette.background.paper, 0.7)
              },
              '&.Mui-focused': {
                borderColor: text.trim().length === 0 
                  ? theme.palette.error.main 
                  : theme.palette.primary.main,
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                boxShadow: text.trim().length === 0 
                  ? `0 0 0 3px ${alpha(theme.palette.error.main, 0.1)}` 
                  : `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
              }
            },
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1
              }
            },
            '& .MuiFormHelperText-root': {
              color: text.trim().length === 0 
                ? theme.palette.error.light 
                : theme.palette.text.secondary,
              mx: 0,
              mt: 1
            }
          }}
        />
      </Box>

      {/* Теги */}
      <Box sx={{ mb: 4 }}>
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
                    transform: 'translateY(-1px)',
                    boxShadow: isSelected 
                      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` 
                      : theme.shadows[4]
                  },
                  transition: 'all 0.2s',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            );
          })}
        </Stack>
      </Box>
    </form>
  );

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
        {formContent}
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
          disabled={loading || !rating || !text.trim()}
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
              boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
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