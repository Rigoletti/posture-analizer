import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Rating,
  Avatar,
  Card,
  CardContent,
  IconButton,
  alpha,
  Pagination,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  Slide,
  Zoom,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Star,
  FilterList,
  ThumbUp,
  Message,
  Reply,
  Delete,
  Add,
  Search,
  Verified,
  TrendingUp,
  Sort,
  Whatshot,
  Forum,
  EmojiEvents,
  Psychology,
  Dashboard,
  Spa,
  Lightbulb,
  ArrowForward,
  CheckCircle,
  AccessTime,
  LocalFireDepartment,
  Edit,
  RateReview,
  Clear,
  Refresh,
  WarningAmber,
  ErrorOutline,
  Dangerous,
  Close
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import ReviewCarousel from '../../components/reviews/ReviewCarousel';
import ReviewForm from '../../components/reviews/ReviewForm';
import { reviewsApi, type Review } from '../../api/reviews';

// Компонент анимации для диалога
const Transition = React.forwardRef(function Transition(props: any, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ReviewsPage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  const [filters, setFilters] = useState({
    sort: '-createdAt',
    minRating: 0,
    maxRating: 5,
    type: '',
    hasReply: '',
    tags: [] as string[],
    search: ''
  });
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showWriteButton, setShowWriteButton] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Состояния для диалога удаления
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    reviewId: null as string | null,
    reviewTitle: '',
    reviewAuthor: '',
    reviewRating: 0,
    deleting: false
  });

  // Дебаунс для поиска
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort,
        minRating: filters.minRating,
        maxRating: filters.maxRating
      };
      
      if (filters.type) params.type = filters.type;
      if (filters.hasReply) params.hasReply = filters.hasReply;
      if (filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (filters.search) params.search = filters.search;
      
      const response = await reviewsApi.getReviews(params);
      
      if (response.success === false) {
        setError(response.error || 'Не удалось загрузить отзывы');
        setReviews([]);
        setStats(null);
        return;
      }
      
      setReviews(response.reviews || []);
      setStats(response.stats);
      setPagination(response.pagination || pagination);
      
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError('Ошибка соединения с сервером. Попробуйте обновить страницу.');
      setReviews([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Основной useEffect для загрузки отзывов
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await loadReviews();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [loadReviews]);

  // Дебаунс для поиска
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput }));
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput, filters.search]);

  // Функция открытия диалога удаления
  const openDeleteDialog = (reviewId: string, reviewTitle: string, reviewAuthor: string, reviewRating: number) => {
    setDeleteDialog({
      open: true,
      reviewId,
      reviewTitle: reviewTitle || 'Отзыв без заголовка',
      reviewAuthor: reviewAuthor || 'Анонимный пользователь',
      reviewRating: reviewRating || 0,
      deleting: false
    });
  };

  // Функция закрытия диалога
  const closeDeleteDialog = () => {
    setDeleteDialog(prev => ({ ...prev, open: false, reviewId: null }));
  };

  // Обновленная функция удаления
  const handleDeleteReview = async () => {
    if (!deleteDialog.reviewId) return;
    
    try {
      setDeleteDialog(prev => ({ ...prev, deleting: true }));
      
      await reviewsApi.deleteReview(deleteDialog.reviewId);
      
      // Показываем успешное уведомление через Alert
      setError(null); // Сбрасываем предыдущие ошибки
      setTimeout(() => {
        // Можно добавить Snackbar для уведомлений
        console.log('Отзыв успешно удален');
      }, 100);
      
      closeDeleteDialog();
      await loadReviews(); // Перезагружаем список отзывов
      
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Не удалось удалить отзыв. Попробуйте позже.');
    } finally {
      setDeleteDialog(prev => ({ ...prev, deleting: false }));
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    switch (filter) {
      case 'best':
        handleFilterChange('minRating', 4);
        handleFilterChange('sort', '-rating');
        break;
      case 'helpful':
        handleFilterChange('sort', '-helpful');
        break;
      case 'discussed':
        handleFilterChange('hasReply', 'true');
        break;
      default:
        setFilters({
          sort: '-createdAt',
          minRating: 0,
          maxRating: 5,
          type: '',
          hasReply: '',
          tags: [],
          search: searchInput
        });
    }
  };

  const handlePageChange = (_: any, page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    try {
      await reviewsApi.replyToReview(reviewId, replyText);
      setReplyText('');
      setReplyingTo(null);
      loadReviews();
    } catch (err) {
      console.error('Error replying to review:', err);
    }
  };

  const handleHelpfulClick = async (reviewId: string) => {
    if (!user) return;
    
    try {
      await reviewsApi.markHelpful(reviewId);
      loadReviews();
    } catch (err) {
      console.error('Error marking helpful:', err);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    reviewsApi.clearCache();
    loadReviews();
  };

  const getRatingDistribution = () => {
    if (!stats?.distribution) return [];
    return Array.from({ length: 5 }, (_, i) => ({
      stars: 5 - i,
      count: stats.distribution[5 - i] || 0,
      percentage: stats.totalReviews > 0 
        ? ((stats.distribution[5 - i] || 0) / stats.totalReviews * 100).toFixed(0)
        : '0'
    }));
  };

  const formatDate = (dateString: string) => {
    try {
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
    } catch {
      return 'Дата не указана';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'service': <Dashboard sx={{ fontSize: 16 }} />,
      'product': <Psychology sx={{ fontSize: 16 }} />,
      'feature': <Lightbulb sx={{ fontSize: 16 }} />,
      'general': <Spa sx={{ fontSize: 16 }} />,
      'health': <CheckCircle sx={{ fontSize: 16 }} />
    };
    return icons[type] || <Star sx={{ fontSize: 16 }} />;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'service': 'О сервисе',
      'product': 'О продукте',
      'feature': 'О функции',
      'general': 'Общее впечатление'
    };
    return types[type] || type;
  };

  if (loading && !reviews.length) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}>
        <Stack alignItems="center" spacing={3}>
          <Box sx={{ position: 'relative' }}>
            <CircularProgress 
              size={80} 
              thickness={2}
              sx={{ 
                color: theme.palette.primary.main,
                animationDuration: '2s'
              }}
            />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <Star sx={{ 
                fontSize: 32, 
                color: alpha(theme.palette.common.white, 0.7),
                animation: 'pulse 2s infinite'
              }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 500
          }}>
            Загрузка отзывов...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      background: theme.palette.mode === 'light'
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      pt: { xs: 2, md: 4 },
      pb: 8,
      position: 'relative'
    }}>
      {/* Стили для анимаций */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(10deg); }
            75% { transform: rotate(-10deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.5;
            }
            50% { 
              transform: scale(1.2);
              opacity: 1;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <Container maxWidth="xl">
        {/* Анимированный фон */}
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <Box position="relative" zIndex={1}>
          {/* Заголовок с анимацией */}
          <Grow in={true} timeout={800}>
            <Box sx={{ mb: { xs: 4, md: 6 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'flex-end' }} spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h1" sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1
                }}>
                  Отзывы сообщества
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    icon={<LocalFireDepartment />}
                    label={`${stats?.totalReviews || 0} отзывов`}
                    sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.light,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      height: 36,
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  />
                  <Tooltip title="Обновить данные">
                    <IconButton
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      <Refresh sx={{
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                      }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              <Typography sx={{ 
                color: theme.palette.text.secondary,
                maxWidth: 600,
                fontSize: '1.1rem',
                lineHeight: 1.6
              }}>
                Реальные впечатления пользователей о трансформации осанки и качестве жизни
              </Typography>
            </Box>
          </Grow>

          <Grid container spacing={3}>
            {/* Левая колонка */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Карточка статистики */}
                <Slide in={true} direction="right" timeout={500}>
                  <Paper sx={{ 
                    bgcolor: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.7)
                      : alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    }
                  }}>
                    <Stack alignItems="center" spacing={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h2" sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 900,
                          lineHeight: 1,
                          fontSize: { xs: '3.5rem', md: '4rem' },
                          mb: 1,
                          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {stats?.averageRating?.toFixed(1) || '0.0'}
                        </Typography>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                          <Rating
                            value={stats?.averageRating || 0}
                            readOnly
                            precision={0.1}
                            sx={{
                              '& .MuiRating-iconFilled': {
                                color: theme.palette.warning.main
                              },
                              '& .MuiRating-icon': {
                                fontSize: '1.8rem'
                              }
                            }}
                          />
                        </Stack>
                        <Typography sx={{ 
                          color: theme.palette.text.secondary,
                          mt: 2,
                          fontSize: '0.9rem'
                        }}>
                          Средняя оценка на основе {stats?.totalReviews || 0} отзывов
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Распределение рейтингов */}
                    <Box sx={{ mt: 4 }}>
                      {getRatingDistribution().map((item, index) => (
                        <Fade in={true} timeout={600 + index * 100} key={item.stars}>
                          <Stack 
                            direction="row" 
                            alignItems="center" 
                            spacing={2}
                            sx={{ mb: 2.5 }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 80 }}>
                              <Typography sx={{ 
                                color: theme.palette.warning.main,
                                fontSize: 14,
                                fontWeight: 600 
                              }}>
                                {item.stars}
                              </Typography>
                              <Star sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                            </Stack>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ 
                                height: 8,
                                width: '100%',
                                bgcolor: alpha(theme.palette.divider, 0.5),
                                borderRadius: 4,
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <Box sx={{ 
                                  width: `${item.percentage}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                                  borderRadius: 4,
                                  transition: 'width 1s ease-out'
                                }} />
                              </Box>
                            </Box>
                            <Typography sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: 14,
                              fontWeight: 600,
                              width: 40,
                              textAlign: 'right'
                            }}>
                              {item.count}
                            </Typography>
                          </Stack>
                        </Fade>
                      ))}
                    </Box>
                  </Paper>
                </Slide>

                {/* Быстрые фильтры */}
                <Slide in={true} direction="right" timeout={700}>
                  <Paper sx={{ 
                    bgcolor: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.7)
                      : alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    p: 3
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.text.primary,
                      mb: 3,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <Whatshot sx={{ color: theme.palette.warning.main }} /> Быстрые фильтры
                    </Typography>

                    <Stack spacing={1.5}>
                      {[
                        { id: 'all', label: 'Все отзывы', icon: <Forum />, count: stats?.totalReviews },
                        { id: 'best', label: 'Только лучшие', icon: <EmojiEvents />, count: stats?.distribution ? 
                          (stats.distribution[5] || 0) + (stats.distribution[4] || 0) : 0 },
                        { id: 'helpful', label: 'Самые полезные', icon: <TrendingUp /> },
                        { id: 'discussed', label: 'С обсуждением', icon: <Message /> }
                      ].map((filter) => (
                        <Button
                          key={filter.id}
                          fullWidth
                          variant={activeFilter === filter.id ? 'contained' : 'text'}
                          startIcon={filter.icon}
                          onClick={() => handleQuickFilter(filter.id)}
                          sx={{
                            justifyContent: 'flex-start',
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            ...(activeFilter === filter.id ? {
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              color: theme.palette.primary.light,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.3)
                              }
                            } : {
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                color: theme.palette.text.primary,
                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                              }
                            })
                          }}
                        >
                          <Box sx={{ flex: 1, textAlign: 'left' }}>{filter.label}</Box>
                          {filter.count > 0 && (
                            <Chip
                              label={filter.count}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.common.white, 0.1),
                                color: theme.palette.text.primary,
                                fontSize: '0.75rem',
                                height: 20
                              }}
                            />
                          )}
                        </Button>
                      ))}
                    </Stack>
                  </Paper>
                </Slide>

                {/* Кнопка оставить отзыв */}
                {showWriteButton && (
                  <Fade in={true} timeout={1000}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<RateReview />}
                      onClick={() => setShowReviewForm(true)}
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Поделиться опытом
                    </Button>
                  </Fade>
                )}
              </Stack>
            </Grid>

            {/* Правая колонка */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={4}>
                {/* Поиск и сортировка */}
                <Grow in={true} timeout={900}>
                  <Paper sx={{ 
                    bgcolor: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.7)
                      : alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    p: 3
                  }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                      <Box sx={{ flex: 1, position: 'relative' }}>
                        <TextField
                          fullWidth
                          placeholder="Найти по ключевым словам..."
                          value={searchInput}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: theme.palette.mode === 'light'
                                ? alpha(theme.palette.background.paper, 0.8)
                                : alpha(theme.palette.background.paper, 0.5),
                              color: theme.palette.text.primary,
                              borderRadius: 3,
                              transition: 'all 0.3s',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'light'
                                  ? theme.palette.background.paper
                                  : alpha(theme.palette.background.paper, 0.7)
                              },
                              '&.Mui-focused': {
                                bgcolor: theme.palette.mode === 'light'
                                  ? theme.palette.background.paper
                                  : alpha(theme.palette.background.paper, 0.8),
                                borderColor: theme.palette.primary.main
                              }
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <Search sx={{ 
                                color: theme.palette.text.secondary,
                                mr: 1 
                              }} />
                            ),
                            endAdornment: searchInput && (
                              <IconButton
                                size="small"
                                onClick={() => handleSearchChange('')}
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                <Clear />
                              </IconButton>
                            )
                          }}
                        />
                      </Box>
                      
                      <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <FormControl sx={{ minWidth: 150 }}>
                          <Select
                            value={filters.sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            sx={{
                              color: theme.palette.text.primary,
                              bgcolor: theme.palette.mode === 'light'
                                ? alpha(theme.palette.background.paper, 0.8)
                                : alpha(theme.palette.background.paper, 0.5),
                              borderRadius: 3,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.divider
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.text.secondary
                              }
                            }}
                            startAdornment={<Sort sx={{ color: theme.palette.text.secondary, mr: 1 }} />}
                          >
                            <MenuItem value="-createdAt">Сначала новые</MenuItem>
                            <MenuItem value="createdAt">Сначала старые</MenuItem>
                            <MenuItem value="-rating">Высокая оценка</MenuItem>
                            <MenuItem value="rating">Низкая оценка</MenuItem>
                            <MenuItem value="-helpful">Самые полезные</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Stack>

                    {/* Дополнительные фильтры */}
                    <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                      <FormControl sx={{ minWidth: 120 }}>
                        <Select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          displayEmpty
                          size="small"
                          sx={{
                            color: theme.palette.text.primary,
                            bgcolor: theme.palette.mode === 'light'
                              ? alpha(theme.palette.background.paper, 0.8)
                              : alpha(theme.palette.background.paper, 0.5),
                            borderRadius: 2,
                            '& .MuiSelect-select': {
                              py: 1
                            }
                          }}
                        >
                          <MenuItem value="">Все типы</MenuItem>
                          <MenuItem value="service">О сервисе</MenuItem>
                          <MenuItem value="product">О продукте</MenuItem>
                          <MenuItem value="feature">О функции</MenuItem>
                          <MenuItem value="general">Общее</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl sx={{ minWidth: 120 }}>
                        <Select
                          value={filters.hasReply}
                          onChange={(e) => handleFilterChange('hasReply', e.target.value)}
                          displayEmpty
                          size="small"
                          sx={{
                            color: theme.palette.text.primary,
                            bgcolor: theme.palette.mode === 'light'
                              ? alpha(theme.palette.background.paper, 0.8)
                              : alpha(theme.palette.background.paper, 0.5),
                            borderRadius: 2,
                            '& .MuiSelect-select': {
                              py: 1
                            }
                          }}
                        >
                          <MenuItem value="">Все ответы</MenuItem>
                          <MenuItem value="true">С ответами</MenuItem>
                          <MenuItem value="false">Без ответов</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Paper>
                </Grow>

                {/* Список отзывов */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ 
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      Все отзывы
                      <Chip
                        label={stats?.totalReviews || 0}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: theme.palette.primary.light,
                          fontWeight: 600
                        }}
                      />
                    </Typography>
                    
                    {/* Кнопка Поделиться опытом для мобильных */}
                    {isMobile && (
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setShowReviewForm(true)}
                        size="small"
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          borderRadius: 2,
                          fontWeight: 600
                        }}
                      >
                        Написать
                      </Button>
                    )}
                  </Stack>

                  {error && (
                    <Fade in={true}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.light,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                          '& .MuiAlert-action': {
                            alignItems: 'center'
                          }
                        }}
                        action={
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleRefresh}
                            startIcon={<Refresh />}
                          >
                            Повторить
                          </Button>
                        }
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  {loading ? (
                    // Скелетоны при загрузке
                    <Stack spacing={2.5}>
                      {[...Array(3)].map((_, index) => (
                        <Card key={index} sx={{ 
                          bgcolor: theme.palette.mode === 'light'
                            ? alpha(theme.palette.background.paper, 0.7)
                            : alpha(theme.palette.background.paper, 0.4),
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                          p: 3.5
                        }}>
                          <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Skeleton variant="circular" width={48} height={48} />
                                <Box>
                                  <Skeleton variant="text" width={150} height={24} />
                                  <Skeleton variant="text" width={100} height={16} />
                                </Box>
                              </Stack>
                              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
                            </Stack>
                            <Skeleton variant="text" height={28} />
                            <Skeleton variant="text" height={80} />
                            <Stack direction="row" spacing={1}>
                              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  ) : reviews.length === 0 ? (
                    <Fade in={true}>
                      <Paper sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha(theme.palette.background.paper, 0.7)
                          : alpha(theme.palette.background.paper, 0.4),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 4
                      }}>
                        <Box sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3
                        }}>
                          <Star sx={{ 
                            fontSize: 40, 
                            color: theme.palette.primary.main
                          }} />
                        </Box>
                        <Typography variant="h6" sx={{ 
                          color: theme.palette.text.primary,
                          mb: 1,
                          fontWeight: 600
                        }}>
                          {filters.search || filters.type || filters.hasReply 
                            ? 'Отзывы не найдены' 
                            : 'Здесь пока тихо'}
                        </Typography>
                        <Typography sx={{ 
                          color: theme.palette.text.secondary,
                          mb: 3,
                          maxWidth: 400,
                          mx: 'auto'
                        }}>
                          {filters.search || filters.type || filters.hasReply 
                            ? 'Попробуйте изменить параметры поиска'
                            : 'Будьте первым, кто поделится своим опытом использования Posture Analyzer'}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<RateReview />}
                          onClick={() => setShowReviewForm(true)}
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            fontWeight: 600,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`
                            }
                          }}
                        >
                          Поделиться опытом
                        </Button>
                      </Paper>
                    </Fade>
                  ) : (
                    <>
                      <Stack spacing={2.5}>
                        {reviews.map((review, index) => (
                          <Zoom 
                            in={true} 
                            timeout={500 + index * 100} 
                            key={review._id}
                            style={{ transitionDelay: `${index * 50}ms` }}
                          >
                            <Card 
                              sx={{ 
                                bgcolor: theme.palette.mode === 'light'
                                  ? alpha(theme.palette.background.paper, 0.7)
                                  : alpha(theme.palette.background.paper, 0.4),
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 4,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  borderColor: alpha(theme.palette.primary.main, 0.5),
                                  boxShadow: theme.shadows[10],
                                  '& .review-actions': {
                                    opacity: 1
                                  }
                                },
                                '&:before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '1px',
                                  background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                                  opacity: 0,
                                  transition: 'opacity 0.3s'
                                },
                                '&:hover:before': {
                                  opacity: 1
                                }
                              }}
                            >
                              <CardContent sx={{ p: 3.5 }}>
                                {/* Шапка отзыва */}
                                <Stack 
                                  direction={{ xs: 'column', sm: 'row' }} 
                                  justifyContent="space-between" 
                                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                                  spacing={2}
                                  sx={{ mb: 3 }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar 
                                      sx={{ 
                                        width: 48,
                                        height: 48,
                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                        color: theme.palette.primary.light,
                                        fontWeight: 600,
                                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
                                      }}
                                    >
                                      {review.user?.firstName?.[0] || 'U'}
                                    </Avatar>
                                    <Box>
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography sx={{ 
                                          color: theme.palette.text.primary,
                                          fontWeight: 600,
                                          fontSize: '1.1rem'
                                        }}>
                                          {review.user?.fullName || 'Анонимный пользователь'}
                                        </Typography>
                                        {review.isVerified && (
                                          <Tooltip title="Проверенный отзыв">
                                            <Verified sx={{ 
                                              fontSize: 18, 
                                              color: theme.palette.success.main
                                            }} />
                                          </Tooltip>
                                        )}
                                      </Stack>
                                      <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="body2" sx={{ 
                                          color: theme.palette.text.secondary,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}>
                                          <AccessTime sx={{ fontSize: 14 }} />
                                          {formatDate(review.createdAt)}
                                        </Typography>
                                        <Chip
                                          icon={getTypeIcon(review.type)}
                                          label={getTypeLabel(review.type)}
                                          size="small"
                                          sx={{
                                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                            color: theme.palette.secondary.light,
                                            fontSize: '0.75rem'
                                          }}
                                        />
                                      </Stack>
                                    </Box>
                                  </Stack>
                                  
                                  <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}>
                                    <Box sx={{
                                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                                      borderRadius: 3,
                                      px: 2,
                                      py: 1,
                                      minWidth: 60,
                                      textAlign: 'center'
                                    }}>
                                      <Typography sx={{ 
                                        color: theme.palette.warning.main,
                                        fontWeight: 700,
                                        fontSize: '1.5rem'
                                      }}>
                                        {review.rating}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Stack>

                                {/* Заголовок и текст */}
                                {review.title && (
                                  <Typography variant="h6" sx={{ 
                                    color: theme.palette.text.primary,
                                    mb: 2,
                                    fontWeight: 600,
                                    fontSize: '1.25rem'
                                  }}>
                                    {review.title}
                                  </Typography>
                                )}

                                <Typography sx={{ 
                                  color: theme.palette.text.primary,
                                  mb: 3,
                                  lineHeight: 1.7,
                                  fontSize: '1rem',
                                  whiteSpace: 'pre-line'
                                }}>
                                  {review.text}
                                </Typography>

                                {/* Теги */}
                                {review.tags?.length > 0 && (
                                  <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                                    {review.tags.map(tag => (
                                      <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        sx={{
                                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                                          color: theme.palette.primary.light,
                                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                          fontSize: '0.75rem',
                                          '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                                          }
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                )}

                                {/* Действия */}
                                <Stack 
                                  className="review-actions"
                                  direction="row" 
                                  justifyContent="space-between" 
                                  alignItems="center"
                                  sx={{
                                    opacity: 0.8,
                                    transition: 'opacity 0.3s',
                                    pt: 2,
                                    borderTop: `1px solid ${theme.palette.divider}`
                                  }}
                                >
                                  <Button
                                    size="small"
                                    startIcon={<ThumbUp />}
                                    onClick={() => handleHelpfulClick(review._id)}
                                    disabled={!user}
                                    sx={{
                                      color: review.helpfulUsers?.includes(user?._id || '') ? theme.palette.primary.main : theme.palette.text.secondary,
                                      fontWeight: 500,
                                      '&:hover': {
                                        color: theme.palette.primary.main,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                      }
                                    }}
                                  >
                                    Полезно ({review.helpful || 0})
                                  </Button>
                                  
                                  <Stack direction="row" spacing={1}>
                                    {user?.role === 'admin' && !review.reply && (
                                      <Button
                                        size="small"
                                        startIcon={<Reply />}
                                        onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                                        sx={{
                                          color: theme.palette.success.main,
                                          '&:hover': {
                                            bgcolor: alpha(theme.palette.success.main, 0.1)
                                          }
                                        }}
                                      >
                                        Ответить
                                      </Button>
                                    )}
                                    
                                    {(user?._id === review.userId || user?.role === 'admin') && (
                                      <IconButton
                                        size="small"
                                        sx={{ 
                                          color: theme.palette.error.main,
                                          '&:hover': {
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            transform: 'scale(1.1)'
                                          },
                                          transition: 'all 0.2s'
                                        }}
                                        onClick={() => openDeleteDialog(
                                          review._id, 
                                          review.title || '', 
                                          review.user?.fullName || 'Анонимный пользователь',
                                          review.rating
                                        )}
                                      >
                                        <Delete />
                                      </IconButton>
                                    )}
                                  </Stack>
                                </Stack>

                                {/* Форма ответа */}
                                {replyingTo === review._id && (
                                  <Fade in={true}>
                                    <Box sx={{ 
                                      mt: 3,
                                      p: 2.5,
                                      bgcolor: theme.palette.mode === 'light'
                                        ? alpha(theme.palette.background.paper, 0.8)
                                        : alpha(theme.palette.background.paper, 0.5),
                                      borderRadius: 3,
                                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                                    }}>
                                      <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Напишите профессиональный и вежливый ответ..."
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            bgcolor: theme.palette.mode === 'light'
                                              ? alpha(theme.palette.background.paper, 0.9)
                                              : alpha(theme.palette.background.paper, 0.6),
                                            color: theme.palette.text.primary
                                          }
                                        }}
                                      />
                                      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                                        <Button
                                          size="small"
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyText('');
                                          }}
                                          sx={{ 
                                            color: theme.palette.text.secondary,
                                            '&:hover': {
                                              color: theme.palette.text.primary
                                            }
                                          }}
                                        >
                                          Отмена
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() => handleReply(review._id)}
                                          disabled={!replyText.trim()}
                                          sx={{
                                            bgcolor: theme.palette.success.main,
                                            fontWeight: 600,
                                            '&:hover': { 
                                              bgcolor: theme.palette.success.dark
                                            }
                                          }}
                                        >
                                          Отправить ответ
                                        </Button>
                                      </Stack>
                                    </Box>
                                  </Fade>
                                )}

                                {/* Ответ администратора */}
                                {review.reply && (
                                  <Fade in={true}>
                                    <Box sx={{ 
                                      mt: 3,
                                      p: 3,
                                      bgcolor: alpha(theme.palette.success.dark, 0.1),
                                      borderRadius: 3,
                                      borderLeft: `3px solid ${theme.palette.success.main}`,
                                      position: 'relative'
                                    }}>
                                      <Box sx={{
                                        position: 'absolute',
                                        top: -10,
                                        right: -10,
                                        bgcolor: theme.palette.success.main,
                                        borderRadius: '50%',
                                        width: 24,
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        <CheckCircle sx={{ 
                                          fontSize: 16, 
                                          color: theme.palette.success.contrastText
                                        }} />
                                      </Box>
                                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                                        <Avatar sx={{ 
                                          width: 32, 
                                          height: 32,
                                          bgcolor: alpha(theme.palette.success.main, 0.2),
                                          color: theme.palette.success.main
                                        }}>
                                          {review.replier?.firstName?.[0] || 'A'}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="body2" sx={{ 
                                            color: theme.palette.success.light,
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                          }}>
                                            {review.replier?.fullName || 'Администратор Posture Analyzer'}
                                            <Verified sx={{ fontSize: 16 }} />
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Ответил {formatDate(review.reply.repliedAt)}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                      <Typography sx={{ 
                                        color: theme.palette.text.primary,
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-line'
                                      }}>
                                        {review.reply.text}
                                      </Typography>
                                    </Box>
                                  </Fade>
                                )}
                              </CardContent>
                            </Card>
                          </Zoom>
                        ))}
                      </Stack>

                      {/* Пагинация */}
                      {pagination.pages > 1 && (
                        <Fade in={true}>
                          <Stack alignItems="center" sx={{ mt: 4 }}>
                            <Pagination
                              count={pagination.pages}
                              page={pagination.page}
                              onChange={handlePageChange}
                              shape="rounded"
                              sx={{
                                '& .MuiPaginationItem-root': {
                                  color: theme.palette.text.secondary,
                                  borderColor: theme.palette.divider,
                                  fontSize: '0.95rem',
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderColor: theme.palette.primary.main
                                  }
                                },
                                '& .Mui-selected': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  color: theme.palette.primary.light,
                                  borderColor: theme.palette.primary.main,
                                  fontWeight: 600,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.3)
                                  }
                                }
                              }}
                            />
                          </Stack>
                        </Fade>
                      )}
                    </>
                  )}
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Красивый диалог подтверждения удаления */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        TransitionComponent={Transition}
        keepMounted
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 4,
            boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.5)}, 0 0 0 1px ${alpha(theme.palette.error.main, 0.2)}`,
            overflow: 'hidden',
            position: 'relative',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`
            }
          }
        }}
      >
        {/* Анимированный фон */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 50%, ${alpha(theme.palette.error.main, 0.15)} 0%, transparent 50%),
                      radial-gradient(circle at 70% 50%, ${alpha(theme.palette.warning.main, 0.15)} 0%, transparent 50%)`,
          pointerEvents: 'none'
        }} />

        <DialogTitle sx={{ 
          pb: 1, 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.error.main, 0.2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            <WarningAmber sx={{ 
              fontSize: 28, 
              color: theme.palette.error.main,
              animation: 'shake 0.5s ease-in-out infinite'
            }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              Подтверждение удаления
            </Typography>
            <Typography sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.9rem',
              mt: 0.5
            }}>
              Это действие нельзя будет отменить
            </Typography>
          </Box>
          <IconButton
            onClick={closeDeleteDialog}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.common.white, 0.1)
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ position: 'relative', py: 3 }}>
          <Fade in={true} timeout={500}>
            <Box>
              {/* Предупреждение */}
              <Paper sx={{ 
                p: 2.5,
                mb: 3,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                borderRadius: 3
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <ErrorOutline sx={{ 
                    color: theme.palette.error.main,
                    fontSize: 24,
                    flexShrink: 0
                  }} />
                  <Box>
                    <Typography sx={{ 
                      color: theme.palette.error.light,
                      fontWeight: 600,
                      mb: 0.5
                    }}>
                      Внимание!
                    </Typography>
                    <Typography sx={{ 
                      color: theme.palette.error.light,
                      fontSize: '0.95rem'
                    }}>
                      Вы собираетесь удалить отзыв. Это действие необратимо, и все связанные данные (лайки, ответы) будут безвозвратно потеряны.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Информация об отзыве */}
              <Box sx={{ 
                p: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Typography sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Удаляемый отзыв
                </Typography>
                
                <Typography sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  mb: 1,
                  wordBreak: 'break-word'
                }}>
                  "{deleteDialog.reviewTitle}"
                </Typography>
                
                <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24,
                      fontSize: '0.8rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.light
                    }}>
                      {deleteDialog.reviewAuthor[0]}
                    </Avatar>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem' }}>
                      {deleteDialog.reviewAuthor}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Star sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                    <Typography sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                      {deleteDialog.reviewRating}
                    </Typography>
                  </Stack>
                </Stack>
                
                <Typography sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Dangerous sx={{ fontSize: 16, color: theme.palette.error.main }} />
                  После удаления восстановить отзыв будет невозможно
                </Typography>
              </Box>

              {/* Анимация предупреждения */}
              <Box sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Zoom in={true} timeout={1000}>
                  <Box sx={{
                    display: 'flex',
                    gap: 1
                  }}>
                    {[...Array(3)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.error.main, 0.5 - i * 0.1),
                          animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                        }}
                      />
                    ))}
                  </Box>
                </Zoom>
              </Box>
            </Box>
          </Fade>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 0,
          gap: 2,
          position: 'relative'
        }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={closeDeleteDialog}
            disabled={deleteDialog.deleting}
            sx={{
              py: 1.5,
              borderRadius: 3,
              borderColor: alpha(theme.palette.text.secondary, 0.5),
              color: theme.palette.text.secondary,
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': {
                borderColor: theme.palette.text.primary,
                bgcolor: alpha(theme.palette.common.white, 0.05)
              }
            }}
          >
            Отмена
          </Button>
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleDeleteReview}
            disabled={deleteDialog.deleting}
            sx={{
              py: 1.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              color: theme.palette.error.contrastText,
              fontWeight: 700,
              fontSize: '1rem',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                transform: 'scale(1.02)'
              },
              '&:active': {
                transform: 'scale(0.98)'
              },
              '&.Mui-disabled': {
                background: alpha(theme.palette.error.main, 0.3)
              }
            }}
          >
            {deleteDialog.deleting ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={20} sx={{ color: theme.palette.error.contrastText }} />
                <Typography>Удаление...</Typography>
              </Stack>
            ) : (
              'Удалить навсегда'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Форма отзыва в модальном окне */}
      <ReviewForm
        open={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSuccess={() => {
          loadReviews();
          setShowReviewForm(false);
        }}
      />
    </Box>
  );
};

export default ReviewsPage;