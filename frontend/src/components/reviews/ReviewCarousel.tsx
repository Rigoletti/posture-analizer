import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Rating,
  Avatar,
  Stack,
  Chip,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Star,
  Verified,
  ArrowBackIos,
  ArrowForwardIos
} from '@mui/icons-material';
import { reviewsApi, type Review } from '../../api/reviews';
import useMediaQuery from '@mui/material/useMediaQuery';

interface ReviewCarouselProps {
  limit?: number;
  type?: string;
  autoPlay?: boolean;
  interval?: number;
}

const ReviewCarousel: React.FC<ReviewCarouselProps> = ({
  limit = 3,
  type = null,
  autoPlay = true,
  interval = 5000
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reviewsApi.getRecentReviews({
        limit,
        type
      });
      
      if (response.success && Array.isArray(response.reviews)) {
        setReviews(response.reviews);
      } else {
        setReviews([]);
        if (response.error) {
          setError(response.error);
        }
      }
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setReviews([]);
      setError('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }, [limit, type]);
  
  useEffect(() => {
    loadReviews();
    
    // Загружаем отзывы каждые 5 минут
    const refreshInterval = setInterval(() => {
      loadReviews();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [loadReviews]);
  
  useEffect(() => {
    if (!autoPlay || isPaused || reviews.length <= 1) return;
    
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, isPaused, reviews.length, interval]);
  
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handleMouseEnter = () => {
    setIsPaused(true);
  };
  
  const handleMouseLeave = () => {
    setIsPaused(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Вчера';
    if (diff < 7) return `${diff} дня назад`;
    if (diff < 30) return `${Math.floor(diff / 7)} недели назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 200,
        bgcolor: theme.palette.mode === 'light' 
          ? alpha(theme.palette.primary.main, 0.02)
          : alpha(theme.palette.primary.main, 0.05),
        borderRadius: 3,
        p: 3
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && reviews.length === 0) {
    return (
      <Box sx={{ 
        p: 3, 
        bgcolor: theme.palette.mode === 'light'
          ? alpha(theme.palette.error.main, 0.02)
          : alpha(theme.palette.error.main, 0.05),
        borderRadius: 3,
        textAlign: 'center'
      }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Попробуйте обновить страницу
        </Typography>
      </Box>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <Box sx={{ 
        p: 6, 
        textAlign: 'center',
        bgcolor: theme.palette.mode === 'light'
          ? alpha(theme.palette.grey[500], 0.05)
          : alpha(theme.palette.grey[500], 0.1),
        borderRadius: 3
      }}>
        <Star sx={{ 
          fontSize: 48, 
          color: theme.palette.mode === 'light' ? theme.palette.grey[400] : theme.palette.grey[600],
          mb: 2 
        }} />
        <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
          Отзывов пока нет
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Будьте первым, кто оставит отзыв!
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 3
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Контейнер для карусели */}
      <Box 
        sx={{ 
          display: 'flex',
          transition: 'transform 0.5s ease',
          transform: `translateX(-${currentIndex * 100}%)`
        }}
      >
        {reviews.map((review) => (
          <Box
            key={review._id}
            sx={{
              minWidth: '100%',
              p: 1
            }}
          >
            <Card sx={{ 
              bgcolor: theme.palette.mode === 'light'
                ? '#FFFFFF'
                : alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${theme.palette.mode === 'light'
                ? alpha(theme.palette.grey[300], 0.5)
                : alpha(theme.palette.grey[700], 0.3)}`,
              borderRadius: 3,
              height: '100%',
              boxShadow: theme.palette.mode === 'light'
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: theme.palette.mode === 'light'
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                {/* Заголовок отзыва */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      fontWeight: 600
                    }}>
                      {review.user?.firstName?.[0]?.toUpperCase() || 
                       review.user?.fullName?.[0]?.toUpperCase() || 
                       'U'}
                    </Avatar>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ 
                          color: 'text.primary', 
                          fontWeight: 600,
                          fontSize: '0.95rem'
                        }}>
                          {review.user?.fullName || 'Анонимный пользователь'}
                        </Typography>
                        {review.isVerified && (
                          <Verified sx={{ 
                            fontSize: 16, 
                            color: theme.palette.mode === 'light' 
                              ? theme.palette.success.main 
                              : theme.palette.success.light
                          }} />
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(review.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Box>
                    <Rating
                      value={review.rating}
                      readOnly
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: theme.palette.warning.main
                        }
                      }}
                    />
                  </Box>
                </Stack>

                {/* Заголовок отзыва */}
                {review.title && (
                  <Typography variant="h6" sx={{ 
                    color: 'text.primary', 
                    mb: 2,
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}>
                    {review.title}
                  </Typography>
                )}

                {/* Текст отзыва (обрезанный) */}
                <Typography sx={{ 
                  color: 'text.primary',
                  mb: 3,
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: 0.9
                }}>
                  {review.text}
                </Typography>

                {/* Теги */}
                {review.tags?.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    {review.tags.slice(0, 3).map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.mode === 'light'
                            ? alpha(theme.palette.secondary.main, 0.1)
                            : alpha(theme.palette.secondary.main, 0.2),
                          color: theme.palette.mode === 'light'
                            ? theme.palette.secondary.dark
                            : theme.palette.secondary.light,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'light'
                              ? alpha(theme.palette.secondary.main, 0.15)
                              : alpha(theme.palette.secondary.main, 0.25)
                          }
                        }}
                      />
                    ))}
                  </Stack>
                )}

                {/* Полезно */}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {review.helpful} {review.helpful === 1 ? 'человеку' : 'людям'} помог этот отзыв
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Навигация */}
      {reviews.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: theme.palette.mode === 'light'
                ? alpha(theme.palette.common.black, 0.5)
                : alpha(theme.palette.common.black, 0.7),
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.mode === 'light'
                  ? alpha(theme.palette.common.black, 0.7)
                  : alpha(theme.palette.common.black, 0.9)
              },
              zIndex: 2,
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 }
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            <ArrowBackIos sx={{ fontSize: { xs: 16, sm: 20 } }} />
          </IconButton>
          
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: theme.palette.mode === 'light'
                ? alpha(theme.palette.common.black, 0.5)
                : alpha(theme.palette.common.black, 0.7),
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.mode === 'light'
                  ? alpha(theme.palette.common.black, 0.7)
                  : alpha(theme.palette.common.black, 0.9)
              },
              zIndex: 2,
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 }
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            <ArrowForwardIos sx={{ fontSize: { xs: 16, sm: 20 } }} />
          </IconButton>

          {/* Индикаторы */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 2,
            gap: 1
          }}>
            {reviews.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex 
                    ? theme.palette.primary.main
                    : theme.palette.mode === 'light'
                      ? alpha(theme.palette.grey[400], 0.5)
                      : alpha(theme.palette.grey[600], 0.5),
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: index === currentIndex 
                      ? theme.palette.primary.dark
                      : theme.palette.mode === 'light'
                        ? alpha(theme.palette.grey[500], 0.7)
                        : alpha(theme.palette.grey[500], 0.7)
                  }
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ReviewCarousel;