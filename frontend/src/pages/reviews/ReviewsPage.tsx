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
  DialogContentText,
  Drawer,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
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
  Close,
  FilterAlt,
  Close as CloseIcon,
  KeyboardArrowUp
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
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Отслеживание скролла для кнопки "наверх"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      
      setError(null);
      setTimeout(() => {
        console.log('Отзыв успешно удален');
      }, 100);
      
      closeDeleteDialog();
      await loadReviews();
      
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
    if (isMobile) {
      setFilterDrawerOpen(false);
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (diff < 7) return `${diff} дн. назад`;
      if (diff < 30) return `${Math.floor(diff / 7)} нед. назад`;
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
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
      'general': 'Общее'
    };
    return types[type] || type;
  };

  // Компонент фильтров для мобильного drawer
  const FilterDrawerContent = () => (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Фильтры
        </Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Сортировка
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <Select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          sx={{ borderRadius: 2 }}
        >
          <MenuItem value="-createdAt">Сначала новые</MenuItem>
          <MenuItem value="createdAt">Сначала старые</MenuItem>
          <MenuItem value="-rating">Высокая оценка</MenuItem>
          <MenuItem value="rating">Низкая оценка</MenuItem>
          <MenuItem value="-helpful">Самые полезные</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Тип отзыва
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <Select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          displayEmpty
          sx={{ borderRadius: 2 }}
        >
          <MenuItem value="">Все типы</MenuItem>
          <MenuItem value="service">О сервисе</MenuItem>
          <MenuItem value="product">О продукте</MenuItem>
          <MenuItem value="feature">О функции</MenuItem>
          <MenuItem value="general">Общее</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Ответы
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <Select
          value={filters.hasReply}
          onChange={(e) => handleFilterChange('hasReply', e.target.value)}
          displayEmpty
          sx={{ borderRadius: 2 }}
        >
          <MenuItem value="">Все ответы</MenuItem>
          <MenuItem value="true">С ответами</MenuItem>
          <MenuItem value="false">Без ответов</MenuItem>
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          setFilters({
            sort: '-createdAt',
            minRating: 0,
            maxRating: 5,
            type: '',
            hasReply: '',
            tags: [],
            search: searchInput
          });
          setActiveFilter('all');
          setFilterDrawerOpen(false);
        }}
        sx={{ borderRadius: 2 }}
      >
        Сбросить фильтры
      </Button>
    </Box>
  );

  if (loading && !reviews.length) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        p: 2
      }}>
        <Stack alignItems="center" spacing={3}>
          <Box sx={{ position: 'relative' }}>
            <CircularProgress 
              size={isMobile ? 60 : 80} 
              thickness={2}
              sx={{ color: theme.palette.primary.main }}
            />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <Star sx={{ fontSize: isMobile ? 24 : 32, color: alpha(theme.palette.common.white, 0.7) }} />
            </Box>
          </Box>
          <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
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
      pt: { xs: 1, md: 4 },
      pb: { xs: 8, md: 8 },
      position: 'relative'
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Заголовок */}
        <Grow in={true} timeout={800}>
          <Box sx={{ mb: { xs: 3, md: 6 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h1" sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 900,
                  fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  mb: 1
                }}>
                  Отзывы сообщества
                </Typography>
                {!isMobile && (
                  <Typography sx={{ 
                    color: theme.palette.text.secondary,
                    maxWidth: 600,
                    fontSize: '1rem'
                  }}>
                    Реальные впечатления пользователей о трансформации осанки и качестве жизни
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<LocalFireDepartment sx={{ fontSize: { xs: 16, md: 18 } }} />}
                  label={`${stats?.totalReviews || 0} отзывов`}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.light,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    fontWeight: 600
                  }}
                />
                <Tooltip title="Обновить данные">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    size={isMobile ? "small" : "medium"}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <Refresh sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            {isMobile && (
              <Typography sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                mt: 1
              }}>
                Реальные впечатления пользователей
              </Typography>
            )}
          </Box>
        </Grow>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Левая колонка - на десктопе видна всегда, на мобильных скрыта */}
          {!isMobile ? (
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Карточка статистики */}
                <Slide in={true} direction="right" timeout={500}>
                  <Paper sx={{ 
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
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
                          fontWeight: 900,
                          fontSize: '4rem',
                          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {stats?.averageRating?.toFixed(1) || '0.0'}
                        </Typography>
                        <Rating value={stats?.averageRating || 0} readOnly precision={0.1} sx={{ '& .MuiRating-icon': { fontSize: '1.8rem' } }} />
                        <Typography sx={{ color: theme.palette.text.secondary, mt: 2, fontSize: '0.9rem' }}>
                          Средняя оценка на основе {stats?.totalReviews || 0} отзывов
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ mt: 4 }}>
                      {getRatingDistribution().map((item, index) => (
                        <Fade in={true} timeout={600 + index * 100} key={item.stars}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 80 }}>
                              <Typography sx={{ color: theme.palette.warning.main, fontSize: 14, fontWeight: 600 }}>
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
                                overflow: 'hidden'
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
                            <Typography sx={{ color: theme.palette.text.secondary, fontSize: 14, fontWeight: 600, width: 40, textAlign: 'right' }}>
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
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    p: 3
                  }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Whatshot sx={{ color: theme.palette.warning.main }} /> Быстрые фильтры
                    </Typography>

                    <Stack spacing={1.5}>
                      {[
                        { id: 'all', label: 'Все отзывы', icon: <Forum />, count: stats?.totalReviews },
                        { id: 'best', label: 'Только лучшие', icon: <EmojiEvents />, count: stats?.distribution ? (stats.distribution[5] || 0) + (stats.distribution[4] || 0) : 0 },
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
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                            } : {
                              color: theme.palette.text.secondary
                            })
                          }}
                        >
                          <Box sx={{ flex: 1, textAlign: 'left' }}>{filter.label}</Box>
                          {filter.count && filter.count > 0 && (
                            <Chip label={filter.count} size="small" sx={{ bgcolor: alpha(theme.palette.common.white, 0.1), height: 20 }} />
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
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Поделиться опытом
                    </Button>
                  </Fade>
                )}
              </Stack>
            </Grid>
          ) : null}

          {/* Правая колонка */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={{ xs: 2, md: 4 }}>
              {/* Поиск и фильтры - мобильная версия */}
              <Grow in={true} timeout={900}>
                <Paper sx={{ 
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: { xs: 3, md: 4 },
                  p: { xs: 2, md: 3 }
                }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <TextField
                        fullWidth
                        size={isMobile ? "small" : "medium"}
                        placeholder="Поиск по отзывам..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                            borderRadius: { xs: 2, md: 3 }
                          }
                        }}
                        InputProps={{
                          startAdornment: <Search sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 20 }} />,
                          endAdornment: searchInput && (
                            <IconButton size="small" onClick={() => handleSearchChange('')}>
                              <Clear fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    </Box>
                    
                    {!isMobile ? (
                      <Stack direction="row" spacing={2}>
                        <FormControl sx={{ minWidth: 150 }} size="small">
                          <Select
                            value={filters.sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
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
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<FilterAlt />}
                        onClick={() => setFilterDrawerOpen(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        Фильтры
                        {(filters.type || filters.hasReply || filters.sort !== '-createdAt') && (
                          <Badge variant="dot" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Button>
                    )}
                  </Stack>

                  {/* Дополнительные фильтры для десктопа */}
                  {!isMobile && (
                    <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">Все типы</MenuItem>
                          <MenuItem value="service">О сервисе</MenuItem>
                          <MenuItem value="product">О продукте</MenuItem>
                          <MenuItem value="feature">О функции</MenuItem>
                          <MenuItem value="general">Общее</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={filters.hasReply}
                          onChange={(e) => handleFilterChange('hasReply', e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">Все ответы</MenuItem>
                          <MenuItem value="true">С ответами</MenuItem>
                          <MenuItem value="false">Без ответов</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  )}
                </Paper>
              </Grow>

              {/* Список отзывов */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 2, md: 3 } }}>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Все отзывы
                    <Chip label={stats?.totalReviews || 0} size="small" sx={{ fontWeight: 600 }} />
                  </Typography>
                </Stack>

                {error && (
                  <Fade in={true}>
                    <Alert 
                      severity="error" 
                      sx={{ mb: 3, borderRadius: 3 }}
                      action={
                        <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<Refresh />}>
                          Повторить
                        </Button>
                      }
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {loading ? (
                  <Stack spacing={2.5}>
                    {[...Array(isMobile ? 2 : 3)].map((_, index) => (
                      <Card key={index} sx={{ borderRadius: 4, p: { xs: 2, md: 3.5 } }}>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Skeleton variant="circular" width={40} height={40} />
                              <Box>
                                <Skeleton variant="text" width={120} height={20} />
                                <Skeleton variant="text" width={80} height={16} />
                              </Box>
                            </Stack>
                            <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 2 }} />
                          </Stack>
                          <Skeleton variant="text" height={24} />
                          <Skeleton variant="text" height={60} />
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ) : reviews.length === 0 ? (
                  <Fade in={true}>
                    <Paper sx={{ 
                      p: { xs: 4, md: 6 }, 
                      textAlign: 'center',
                      borderRadius: 4
                    }}>
                      <Box sx={{
                        width: { xs: 60, md: 80 },
                        height: { xs: 60, md: 80 },
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                      }}>
                        <Star sx={{ fontSize: { xs: 30, md: 40 }, color: theme.palette.primary.main }} />
                      </Box>
                      <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600, mb: 1 }}>
                        {filters.search || filters.type || filters.hasReply ? 'Отзывы не найдены' : 'Здесь пока тихо'}
                      </Typography>
                      <Typography sx={{ color: theme.palette.text.secondary, mb: 3, fontSize: { xs: '0.875rem', md: '1rem' } }}>
                        {filters.search || filters.type || filters.hasReply 
                          ? 'Попробуйте изменить параметры поиска'
                          : 'Будьте первым, кто поделится своим опытом'}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<RateReview />}
                        onClick={() => setShowReviewForm(true)}
                        size={isMobile ? "small" : "medium"}
                      >
                        Поделиться опытом
                      </Button>
                    </Paper>
                  </Fade>
                ) : (
                  <>
                    <Stack spacing={2.5}>
                      {reviews.map((review, index) => (
                        <Zoom in={true} timeout={500 + index * 100} key={review._id}>
                          <Card sx={{ 
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: { xs: 3, md: 4 },
                            transition: 'all 0.3s',
                            '&:hover': isMobile ? {} : {
                              transform: 'translateY(-4px)',
                              borderColor: alpha(theme.palette.primary.main, 0.5)
                            }
                          }}>
                            <CardContent sx={{ p: { xs: 2, md: 3.5 } }}>
                              {/* Шапка отзыва */}
                              <Stack 
                                direction={{ xs: 'column', sm: 'row' }} 
                                justifyContent="space-between" 
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                spacing={2}
                                sx={{ mb: 2 }}
                              >
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Avatar sx={{ 
                                    width: { xs: 40, md: 48 },
                                    height: { xs: 40, md: 48 },
                                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    color: theme.palette.primary.light,
                                    fontWeight: 600
                                  }}>
                                    {review.user?.firstName?.[0] || 'U'}
                                  </Avatar>
                                  <Box>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                                        {review.user?.fullName || 'Анонимный пользователь'}
                                      </Typography>
                                      {review.isVerified && (
                                        <Verified sx={{ fontSize: { xs: 14, md: 18 }, color: theme.palette.success.main }} />
                                      )}
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTime sx={{ fontSize: 12 }} />
                                        {formatDate(review.createdAt)}
                                      </Typography>
                                      <Chip
                                        icon={getTypeIcon(review.type)}
                                        label={getTypeLabel(review.type)}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    </Stack>
                                  </Box>
                                </Stack>
                                
                                <Box sx={{ 
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  borderRadius: 2,
                                  px: { xs: 1.5, md: 2 },
                                  py: 0.5,
                                  minWidth: 50,
                                  textAlign: 'center'
                                }}>
                                  <Typography sx={{ color: theme.palette.warning.main, fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                                    {review.rating}
                                  </Typography>
                                </Box>
                              </Stack>

                              {/* Заголовок и текст */}
                              {review.title && (
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                                  {review.title}
                                </Typography>
                              )}

                              <Typography sx={{ 
                                color: theme.palette.text.primary,
                                mb: 2,
                                lineHeight: 1.6,
                                fontSize: { xs: '0.875rem', md: '1rem' },
                                whiteSpace: 'pre-line'
                              }}>
                                {review.text.length > (isMobile ? 150 : 300) ? `${review.text.slice(0, isMobile ? 150 : 300)}...` : review.text}
                              </Typography>

                              {/* Теги */}
                              {review.tags?.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                  {review.tags.slice(0, isMobile ? 3 : 5).map(tag => (
                                    <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.7rem', height: 24 }} />
                                  ))}
                                  {isMobile && review.tags.length > 3 && (
                                    <Chip label={`+${review.tags.length - 3}`} size="small" variant="outlined" />
                                  )}
                                </Stack>
                              )}

                              {/* Действия */}
                              <Stack 
                                direction="row" 
                                justifyContent="space-between" 
                                alignItems="center"
                                sx={{ pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}
                              >
                                <Button
                                  size="small"
                                  startIcon={<ThumbUp sx={{ fontSize: { xs: 16, md: 20 } }} />}
                                  onClick={() => handleHelpfulClick(review._id)}
                                  disabled={!user}
                                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                                >
                                  {review.helpful || 0}
                                </Button>
                                
                                <Stack direction="row" spacing={0.5}>
                                  {user?.role === 'admin' && !review.reply && (
                                    <Button
                                      size="small"
                                      startIcon={<Reply sx={{ fontSize: { xs: 16, md: 20 } }} />}
                                      onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                                      sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                                    >
                                      Ответить
                                    </Button>
                                  )}
                                  
                                  {(user?._id === review.userId || user?.role === 'admin') && (
                                    <IconButton
                                      size="small"
                                      sx={{ color: theme.palette.error.main }}
                                      onClick={() => openDeleteDialog(
                                        review._id, 
                                        review.title || '', 
                                        review.user?.fullName || 'Анонимный пользователь',
                                        review.rating
                                      )}
                                    >
                                      <Delete sx={{ fontSize: { xs: 18, md: 20 } }} />
                                    </IconButton>
                                  )}
                                </Stack>
                              </Stack>

                              {/* Форма ответа */}
                              {replyingTo === review._id && (
                                <Fade in={true}>
                                  <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.8), borderRadius: 2 }}>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={3}
                                      size="small"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Напишите ответ..."
                                    />
                                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
                                      <Button size="small" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                                        Отмена
                                      </Button>
                                      <Button size="small" variant="contained" onClick={() => handleReply(review._id)} disabled={!replyText.trim()}>
                                        Ответить
                                      </Button>
                                    </Stack>
                                  </Box>
                                </Fade>
                              )}

                              {/* Ответ администратора */}
                              {review.reply && (
                                <Fade in={true}>
                                  <Box sx={{ 
                                    mt: 2,
                                    p: 2,
                                    bgcolor: alpha(theme.palette.success.dark, 0.1),
                                    borderRadius: 2,
                                    borderLeft: `3px solid ${theme.palette.success.main}`
                                  }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                                      <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }}>
                                        {review.replier?.firstName?.[0] || 'A'}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.success.light }}>
                                          {review.replier?.fullName || 'Администратор'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                          • {formatDate(review.reply.repliedAt)}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
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
                            size={isMobile ? "small" : "medium"}
                            siblingCount={isMobile ? 0 : 1}
                            sx={{
                              '& .MuiPaginationItem-root': {
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
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
      </Container>

      {/* Мобильный drawer для фильтров */}
      <SwipeableDrawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onOpen={() => {}}
        swipeAreaWidth={56}
        disableSwipeToOpen={false}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90vh',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <FilterDrawerContent />
      </SwipeableDrawer>

      {/* Мобильная FAB кнопка для написания отзыва - ИСПРАВЛЕНО: теперь только для открытия формы */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={(e) => {
            e.stopPropagation(); // Останавливаем всплытие события
            setShowReviewForm(true);
          }}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.5)}`
            },
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
        >
          <RateReview />
        </Fab>
      )}

      {/* Кнопка прокрутки наверх */}
      <Fade in={showScrollTop}>
        <Fab
          size={isMobile ? "small" : "medium"}
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 80 : 16,
            right: 16,
            bgcolor: alpha(theme.palette.primary.main, 0.9),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: theme.palette.primary.main
            },
            zIndex: 1000
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Fade>

      {/* Диалог подтверждения удаления */}
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
            borderRadius: { xs: 3, md: 4 },
            m: { xs: 2, md: 0 }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: { xs: 40, md: 48 },
            height: { xs: 40, md: 48 },
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.error.main, 0.2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <WarningAmber sx={{ fontSize: { xs: 24, md: 28 }, color: theme.palette.error.main }} />
          </Box>
          <Box>
            <Typography variant={isMobile ? "subtitle1" : "h5"} sx={{ fontWeight: 700 }}>
              Подтверждение удаления
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Это действие нельзя будет отменить
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: { xs: 2, md: 3 } }}>
          <Paper sx={{ 
            p: { xs: 2, md: 2.5 },
            mb: 2,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            borderRadius: 2
          }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <ErrorOutline sx={{ color: theme.palette.error.main, fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="body2" sx={{ color: theme.palette.error.light }}>
                Вы собираетесь удалить отзыв. Это действие необратимо.
              </Typography>
            </Stack>
          </Paper>

          <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: alpha(theme.palette.background.paper, 0.6), borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
              Удаляемый отзыв
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, mt: 0.5 }}>
              "{deleteDialog.reviewTitle}"
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                  {deleteDialog.reviewAuthor[0]}
                </Avatar>
                <Typography variant="caption">{deleteDialog.reviewAuthor}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Star sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{deleteDialog.reviewRating}</Typography>
              </Stack>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: { xs: 2, md: 3 }, pt: 0, gap: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={closeDeleteDialog}
            disabled={deleteDialog.deleting}
            size={isMobile ? "small" : "medium"}
            sx={{ borderRadius: 2 }}
          >
            Отмена
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleDeleteReview}
            disabled={deleteDialog.deleting}
            size={isMobile ? "small" : "medium"}
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
              }
            }}
          >
            {deleteDialog.deleting ? <CircularProgress size={20} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Форма отзыва */}
      <ReviewForm
        open={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSuccess={() => {
          loadReviews();
          setShowReviewForm(false);
        }}
      />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default ReviewsPage;