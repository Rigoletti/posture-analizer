import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  Skeleton,
  IconButton,
  alpha,
  Paper,
  Fab,
  InputBase,
  MenuItem,
  Select,
  FormControl,
  FormControlLabel,
  Switch,
  Badge,
  useTheme,
  useMediaQuery,
  Tooltip,
  Zoom,
  Pagination,
  Fade,
  Drawer,
  BottomNavigation,
  BottomNavigationAction,
  SwipeableDrawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  AccessTime,
  Whatshot,
  FitnessCenter,
  TrendingUp,
  Search,
  FilterList,
  Bolt,
  Spa,
  LocalFireDepartment,
  ModelTraining,
  Favorite,
  FavoriteBorder,
  Restore,
  Speed,
  Close,
  Sort,
  ClearAll,
  CheckCircle,
  EmojiEvents,
  Timer,
  Home,
  Explore,
  Person,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { exercisesApi } from '../../api/exercises';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  intensity: string;
  benefits: string[];
  type: string;
  has3dModel: boolean;
  caloriesBurned?: number;
  difficulty: string;
  muscleGroups?: string[];
  isFavorite?: boolean;
  views?: number;
  rating?: number;
}

// Кэш для данных
const cache = new Map();
const CACHE_KEY = 'exercises_cache';

const Exercises: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const cached = cache.get(CACHE_KEY);
    return cached || [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = cache.get(CACHE_KEY);
    return !cached;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Фильтры
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [show3dOnly, setShow3dOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'duration'>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  
  const isMounted = useRef(false);
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Доступные типы упражнений
  const exerciseTypes = useMemo(() => [
    { value: 'all', label: 'Все', icon: <FitnessCenter />, color: theme.palette.primary.main, shortLabel: 'Все' },
    { value: 'stretching', label: 'Растяжка', icon: <Spa />, color: theme.palette.primary.main, shortLabel: 'Растяжка' },
    { value: 'cardio', label: 'Кардио', icon: <Whatshot />, color: theme.palette.error.main, shortLabel: 'Кардио' },
    { value: 'strength', label: 'Силовые', icon: <FitnessCenter />, color: theme.palette.info.main, shortLabel: 'Силовые' },
    { value: 'posture', label: 'Осанка', icon: <TrendingUp />, color: theme.palette.success.main, shortLabel: 'Осанка' },
    { value: 'flexibility', label: 'Гибкость', icon: <Spa />, color: theme.palette.primary.main, shortLabel: 'Гибкость' },
    { value: 'warmup', label: 'Разминка', icon: <Bolt />, color: theme.palette.warning.main, shortLabel: 'Разминка' },
    { value: 'cooldown', label: 'Заминка', icon: <Restore />, color: theme.palette.grey[500], shortLabel: 'Заминка' }
  ], [theme]);

  const difficulties = useMemo(() => [
    { value: 'all', label: 'Любой', color: theme.palette.primary.main, description: 'Все уровни' },
    { value: 'beginner', label: 'Начальный', color: theme.palette.success.main, description: 'Для новичков' },
    { value: 'intermediate', label: 'Средний', color: theme.palette.warning.main, description: 'С опытом' },
    { value: 'advanced', label: 'Продвинутый', color: theme.palette.error.main, description: 'Для профи' }
  ], [theme]);

  const sortOptions = [
    { value: 'popular', label: 'Популярные', icon: <TrendingUp sx={{ fontSize: 16 }} />, description: 'Самые популярные' },
    { value: 'newest', label: 'Сначала новые', icon: <Timer sx={{ fontSize: 16 }} />, description: 'Недавно добавленные' },
    { value: 'duration', label: 'По длительности', icon: <AccessTime sx={{ fontSize: 16 }} />, description: 'От коротких к длинным' },
  ];

  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY}_${selectedType}_${selectedDifficulty}_${show3dOnly}_${sortBy}_${page}_${searchTerm}`;
  }, [selectedType, selectedDifficulty, show3dOnly, sortBy, page, searchTerm]);

  const fetchExercises = useCallback(async (skipCache = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const cacheKey = getCacheKey();
    
    if (!skipCache && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      setExercises(cachedData.exercises);
      setTotalPages(cachedData.totalPages);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const params: any = {
        page,
        limit: isMobile ? 12 : 20,
        sortBy,
      };
      
      if (selectedType && selectedType !== 'all') params.type = selectedType;
      if (selectedDifficulty && selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (show3dOnly) params.has3dModel = 'true';
      if (searchTerm) params.search = searchTerm;
      
      const response = await exercisesApi.getExercises(params, { signal: controller.signal });
      
      const formattedExercises = response.data.exercises.map((exercise: any): Exercise => ({
        _id: exercise._id,
        title: exercise.title,
        description: exercise.description,
        duration: exercise.duration,
        level: exercise.difficulty === 'beginner' ? 'Начальный' : 
               exercise.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый',
        intensity: exercise.difficulty === 'beginner' ? 'Низкая' : 
                   exercise.difficulty === 'intermediate' ? 'Средняя' : 'Высокая',
        benefits: exercise.benefits || [],
        type: exercise.type,
        has3dModel: exercise.has3dModel,
        caloriesBurned: exercise.caloriesBurned || 0,
        difficulty: exercise.difficulty,
        muscleGroups: exercise.muscleGroups || [],
        isFavorite: favorites.has(exercise._id),
        views: exercise.views || Math.floor(Math.random() * 10000),
        rating: exercise.rating || 4 + Math.random(),
      }));
      
      const result = {
        exercises: formattedExercises,
        totalPages: response.data.pages || 1
      };
      
      cache.set(cacheKey, result);
      
      setExercises(formattedExercises);
      setTotalPages(response.data.pages || 1);
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching exercises:', err);
        setExercises([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedType, selectedDifficulty, show3dOnly, searchTerm, page, sortBy, favorites, getCacheKey, isMobile]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchExercises();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) {
      if (page !== 1 && (selectedType !== 'all' || selectedDifficulty !== 'all' || show3dOnly || searchTerm || sortBy !== 'popular')) {
        setPage(1);
      } else {
        const timer = setTimeout(() => {
          fetchExercises();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedType, selectedDifficulty, show3dOnly, searchTerm, sortBy]);

  useEffect(() => {
    if (initialLoadDone.current && page !== 1) {
      fetchExercises();
    }
  }, [page]);

  const clearFilters = useCallback(() => {
    setSelectedType('all');
    setSelectedDifficulty('all');
    setShow3dOnly(false);
    setSearchTerm('');
    setPage(1);
    setShowFilters(false);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
    
    setExercises(prev => prev.map(ex => 
      ex._id === id ? { ...ex, isFavorite: !ex.isFavorite } : ex
    ));
  }, []);

  const getTypeColor = useCallback((type: string) => {
    return exerciseTypes.find(t => t.value === type)?.color || theme.palette.primary.main;
  }, [exerciseTypes, theme]);

  const getTypeIcon = useCallback((type: string) => {
    return exerciseTypes.find(t => t.value === type)?.icon || <FitnessCenter />;
  }, [exerciseTypes]);

  const handleExerciseClick = useCallback((exerciseId: string) => {
    navigate(`/exercises/${exerciseId}`);
  }, [navigate]);

  const activeFiltersCount = useMemo(() => 
    (selectedType !== 'all' ? 1 : 0) +
    (selectedDifficulty !== 'all' ? 1 : 0) +
    (show3dOnly ? 1 : 0) +
    (searchTerm ? 1 : 0)
  , [selectedType, selectedDifficulty, show3dOnly, searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  // Мобильный компонент фильтров
  const FiltersDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onOpen={() => setShowFilters(true)}
      disableSwipeToOpen
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85vh',
          background: theme.palette.background.paper,
        }
      }}
    >
      <Box sx={{ p: 2, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Фильтры
          </Typography>
          <IconButton onClick={() => setShowFilters(false)} size="small">
            <Close />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>
            Тип упражнений
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
            {exerciseTypes.map((type) => (
              <Chip
                key={type.value}
                icon={type.icon}
                label={type.shortLabel}
                onClick={() => setSelectedType(type.value === selectedType ? 'all' : type.value)}
                variant={selectedType === type.value ? 'filled' : 'outlined'}
                size="small"
                sx={{
                  bgcolor: selectedType === type.value ? alpha(type.color, 0.15) : 'transparent',
                  borderColor: alpha(type.color, 0.3),
                  color: selectedType === type.value ? type.color : theme.palette.text.secondary,
                }}
              />
            ))}
          </Stack>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>
            Уровень сложности
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {difficulties.map((diff) => (
              <Chip
                key={diff.value}
                label={diff.label}
                onClick={() => setSelectedDifficulty(diff.value === selectedDifficulty ? 'all' : diff.value)}
                variant={selectedDifficulty === diff.value ? 'filled' : 'outlined'}
                size="small"
                sx={{
                  bgcolor: selectedDifficulty === diff.value ? alpha(diff.color, 0.15) : 'transparent',
                  borderColor: alpha(diff.color, 0.3),
                  color: selectedDifficulty === diff.value ? diff.color : theme.palette.text.secondary,
                }}
              />
            ))}
          </Stack>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={show3dOnly}
                onChange={(e) => setShow3dOnly(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ModelTraining sx={{ fontSize: 18 }} />
                <Typography variant="body2">Только с 3D моделью</Typography>
              </Box>
            }
          />
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
            startIcon={<ClearAll />}
            size="medium"
          >
            Сбросить
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setShowFilters(false)}
            size="medium"
          >
            Применить
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );

  // Мобильный диалог сортировки
  const SortDialog = () => (
    <Dialog
      open={showSortDialog}
      onClose={() => setShowSortDialog(false)}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: '100%',
          maxWidth: 320,
          m: 2
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        Сортировка
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              fullWidth
              variant={sortBy === option.value ? 'contained' : 'outlined'}
              onClick={() => {
                setSortBy(option.value as any);
                setShowSortDialog(false);
              }}
              startIcon={option.icon}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                py: 1.5,
                borderRadius: 2
              }}
            >
              <Box sx={{ textAlign: 'left', width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {option.description}
                </Typography>
              </Box>
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      pb: isMobile ? 8 : 3,
      pt: { xs: 1, sm: 3 }
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Fade in timeout={600}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 6 } }}>
              {!isMobile && (
                <Chip
                  label="⚡ ТРЕНИРОВКИ С 3D ГИДОМ"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mb: 3,
                    fontWeight: 700,
                    px: 2,
                    py: 1,
                    fontSize: '0.7rem',
                    letterSpacing: 0.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: '6px'
                  }}
                />
              )}
              
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                  fontWeight: 800,
                  mb: 1.5,
                  lineHeight: 1.2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {isMobile ? 'Упражнения' : 'Система упражнений'}
              </Typography>
              
              {!isMobile && (
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    maxWidth: 600,
                    mx: 'auto',
                    mb: 4,
                    lineHeight: 1.6,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontWeight: 400
                  }}
                >
                  Профессионально подобранные упражнения с 3D демонстрациями
                </Typography>
              )}

              {/* Быстрые фильтры - горизонтальная прокрутка на мобильных */}
              <Box sx={{ 
                overflowX: 'auto', 
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
                pb: 1,
                mb: 2,
                '&::-webkit-scrollbar': {
                  height: 4,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(theme.palette.divider, 0.3),
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.5),
                  borderRadius: 4,
                },
              }}>
                <Stack 
                  direction="row" 
                  spacing={1} 
                  sx={{ 
                    display: 'inline-flex',
                    px: 0.5 
                  }}
                >
                  {exerciseTypes.slice(0, isMobile ? 6 : 8).map((type) => (
                    <Chip
                      key={type.value}
                      icon={type.icon}
                      label={isMobile ? type.shortLabel : `${type.label}`}
                      onClick={() => setSelectedType(type.value === selectedType ? 'all' : type.value)}
                      variant={selectedType === type.value ? 'filled' : 'outlined'}
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        bgcolor: selectedType === type.value ? alpha(type.color, 0.15) : 'transparent',
                        borderColor: alpha(type.color, 0.3),
                        color: selectedType === type.value ? type.color : theme.palette.text.secondary,
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        '& .MuiChip-icon': {
                          marginLeft: isMobile ? '4px' : '8px',
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Панель поиска и фильтров - адаптивная */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: { xs: 2, md: 4 },
              bgcolor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.background.paper, 0.9)
                : alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Stack spacing={2}>
              {/* Поисковая строка */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                bgcolor: theme.palette.mode === 'light' 
                  ? theme.palette.background.paper
                  : alpha(theme.palette.background.paper, 0.8),
                borderRadius: 2,
                px: { xs: 1.5, sm: 2 },
                py: 0.5,
                border: `1px solid ${searchFocused ? theme.palette.primary.main : theme.palette.divider}`,
                transition: 'border-color 0.2s'
              }}>
                <Search sx={{ color: theme.palette.primary.main, fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                <InputBase
                  placeholder={isMobile ? "Поиск..." : "Поиск упражнений..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  sx={{ 
                    flex: 1,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    py: { xs: 1, sm: 1.2 }
                  }}
                  autoComplete="off"
                />
                {searchTerm && (
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <Close sx={{ fontSize: { xs: 14, sm: 16 } }} />
                  </IconButton>
                )}
              </Box>

              {/* Кнопки управления */}
              <Stack 
                direction="row" 
                spacing={1} 
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1}>
                  {/* Кнопка сортировки для мобильных */}
                  {isMobile ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setShowSortDialog(true)}
                      startIcon={<Sort />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      {sortOptions.find(s => s.value === sortBy)?.label || 'Сортировка'}
                    </Button>
                  ) : (
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        startAdornment={<Sort sx={{ mr: 1, fontSize: 16, color: theme.palette.primary.main }} />}
                        sx={{
                          bgcolor: theme.palette.mode === 'light' 
                            ? theme.palette.background.paper
                            : alpha(theme.palette.background.paper, 0.6),
                          borderRadius: 2,
                          fontSize: '0.85rem',
                        }}
                      >
                        {sortOptions.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {opt.icon}
                              <Typography>{opt.label}</Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Фильтр сложности для десктопа */}
                  {!isMobile && (
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected || selected === 'all') return 'Любой уровень';
                          return difficulties.find(d => d.value === selected)?.label;
                        }}
                        sx={{
                          bgcolor: theme.palette.mode === 'light' 
                            ? theme.palette.background.paper
                            : alpha(theme.palette.background.paper, 0.6),
                          borderRadius: 2,
                          fontSize: '0.85rem',
                        }}
                      >
                        {difficulties.map(diff => (
                          <MenuItem key={diff.value} value={diff.value}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: diff.color }} />
                              <Typography>{diff.label}</Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Кнопка 3D */}
                  <Tooltip title="Только с 3D моделью">
                    <IconButton
                      onClick={() => setShow3dOnly(!show3dOnly)}
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        bgcolor: show3dOnly ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: show3dOnly ? theme.palette.primary.main : theme.palette.text.secondary,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <ModelTraining sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Кнопка фильтров */}
                <Badge
                  badgeContent={activeFiltersCount}
                  color="primary"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: { xs: '0.55rem', sm: '0.6rem' }, 
                      height: { xs: 16, sm: 18 }, 
                      minWidth: { xs: 16, sm: 18 },
                      top: { xs: -4, sm: -6 },
                      right: { xs: -4, sm: -6 }
                    } 
                  }}
                >
                  <Button
                    variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(true)}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      ...(activeFiltersCount > 0 && { bgcolor: theme.palette.primary.main })
                    }}
                  >
                    {isMobile ? 'Фильтры' : 'Фильтры'}
                  </Button>
                </Badge>

                {activeFiltersCount > 0 && !isMobile && (
                  <Tooltip title="Сбросить все">
                    <IconButton
                      onClick={clearFilters}
                      size="small"
                      sx={{
                        color: theme.palette.error.main,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      }}
                    >
                      <ClearAll />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>

              {/* Отображение активных фильтров на мобильных */}
              {isMobile && activeFiltersCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">Активные фильтры:</Typography>
                  {selectedType !== 'all' && (
                    <Chip
                      label={exerciseTypes.find(t => t.value === selectedType)?.shortLabel}
                      size="small"
                      onDelete={() => setSelectedType('all')}
                      deleteIcon={<Close sx={{ fontSize: 14 }} />}
                      sx={{ height: 24 }}
                    />
                  )}
                  {selectedDifficulty !== 'all' && (
                    <Chip
                      label={difficulties.find(d => d.value === selectedDifficulty)?.label}
                      size="small"
                      onDelete={() => setSelectedDifficulty('all')}
                      deleteIcon={<Close sx={{ fontSize: 14 }} />}
                      sx={{ height: 24 }}
                    />
                  )}
                  {show3dOnly && (
                    <Chip
                      label="3D модели"
                      size="small"
                      onDelete={() => setShow3dOnly(false)}
                      deleteIcon={<Close sx={{ fontSize: 14 }} />}
                      sx={{ height: 24 }}
                    />
                  )}
                  {searchTerm && (
                    <Chip
                      label={`Поиск: ${searchTerm}`}
                      size="small"
                      onDelete={() => setSearchTerm('')}
                      deleteIcon={<Close sx={{ fontSize: 14 }} />}
                      sx={{ height: 24 }}
                    />
                  )}
                  <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
                    Сбросить все
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>
        </motion.div>

        {/* Список упражнений */}
        {loading && exercises.length === 0 ? (
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {[...Array(isMobile ? 6 : 12)].map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
                <Skeleton 
                  variant="rectangular" 
                  height={isMobile ? 240 : 280} 
                  sx={{ 
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.primary.main, 0.05)
                      : alpha(theme.palette.background.paper, 0.2),
                  }} 
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={exercises.length}
          >
            {exercises.length === 0 ? (
              <Paper
                sx={{
                  p: { xs: 4, md: 8 },
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <FilterList sx={{ fontSize: { xs: 48, md: 64 }, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
                  Упражнения не найдены
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                  Попробуйте изменить параметры фильтрации
                </Typography>
                <Button
                  variant="contained"
                  onClick={clearFilters}
                  startIcon={<Restore />}
                  size={isMobile ? "small" : "medium"}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Сбросить фильтры
                </Button>
              </Paper>
            ) : (
              <>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(4, 1fr)',
                    lg: 'repeat(5, 1fr)'
                  },
                  gap: { xs: 1.5, sm: 2, md: 2.5 },
                  mb: 4
                }}>
                  {exercises.map((exercise) => (
                    <motion.div
                      key={exercise._id}
                      variants={itemVariants}
                      whileHover={!isMobile ? { y: -4 } : {}}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Card 
                        onClick={() => handleExerciseClick(exercise._id)}
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: { xs: 2, sm: 3 },
                          overflow: 'hidden',
                          '&:active': isMobile ? {
                            transform: 'scale(0.98)',
                            transition: 'transform 0.1s'
                          } : {},
                          '&:hover': !isMobile ? {
                            borderColor: getTypeColor(exercise.type),
                            boxShadow: `0 12px 24px ${alpha(getTypeColor(exercise.type), 0.15)}`,
                            transform: 'translateY(-4px)'
                          } : {}
                        }}
                      >
                        <Box sx={{ 
                          position: 'relative', 
                          height: { xs: 110, sm: 140 },
                          bgcolor: alpha(getTypeColor(exercise.type), 0.08),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Zoom in timeout={300}>
                            <Box sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: { xs: 48, sm: 60 },
                              height: { xs: 48, sm: 60 },
                              borderRadius: '50%',
                              bgcolor: alpha(getTypeColor(exercise.type), 0.15),
                              border: `1px solid ${alpha(getTypeColor(exercise.type), 0.3)}`,
                              backdropFilter: 'blur(10px)'
                            }}>
                              {React.cloneElement(getTypeIcon(exercise.type), {
                                sx: { fontSize: { xs: 22, sm: 28 }, color: getTypeColor(exercise.type) }
                              })}
                            </Box>
                          </Zoom>

                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(exercise._id);
                            }}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: { xs: 6, sm: 8 },
                              right: { xs: 6, sm: 8 },
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              backdropFilter: 'blur(4px)',
                              width: { xs: 24, sm: 28 },
                              height: { xs: 24, sm: 28 },
                              '&:hover': { bgcolor: theme.palette.error.light }
                            }}
                          >
                            {exercise.isFavorite ? (
                              <Favorite sx={{ color: theme.palette.error.main, fontSize: { xs: 14, sm: 16 } }} />
                            ) : (
                              <FavoriteBorder sx={{ fontSize: { xs: 14, sm: 16 } }} />
                            )}
                          </IconButton>

                          <Chip
                            label={exercise.difficulty === 'beginner' ? 'Н' : exercise.difficulty === 'intermediate' ? 'С' : 'П'}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: { xs: 6, sm: 8 },
                              left: { xs: 6, sm: 8 },
                              bgcolor: exercise.difficulty === 'beginner' ? theme.palette.success.main :
                                      exercise.difficulty === 'intermediate' ? theme.palette.warning.main : theme.palette.error.main,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              minWidth: { xs: 20, sm: 24 },
                              height: { xs: 20, sm: 24 },
                              '& .MuiChip-label': { px: 0.5 }
                            }}
                          />

                          {exercise.has3dModel && (
                            <Chip
                              icon={<ModelTraining sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                              label="3D"
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: { xs: 6, sm: 8 },
                                right: { xs: 6, sm: 8 },
                                bgcolor: alpha(theme.palette.primary.main, 0.95),
                                color: '#fff',
                                fontSize: { xs: '0.55rem', sm: '0.65rem' },
                                height: { xs: 18, sm: 22 },
                                backdropFilter: 'blur(4px)',
                                '& .MuiChip-icon': { ml: 0.5, fontSize: { xs: 10, sm: 12 } },
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          )}
                        </Box>

                        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 700, 
                              mb: 0.5,
                              lineHeight: 1.3,
                              fontSize: { xs: '0.85rem', sm: '0.95rem' },
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: { xs: '2.2rem', sm: '2.5rem' }
                            }}
                          >
                            {exercise.title}
                          </Typography>

                          <Stack direction="row" spacing={1.5} sx={{ mb: 1 }}>
                            <Tooltip title="Длительность">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: { xs: 12, sm: 14 }, color: theme.palette.info.main }} />
                                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                                  {exercise.duration} мин
                                </Typography>
                              </Box>
                            </Tooltip>
                            
                            <Tooltip title="Сжигаемые калории">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocalFireDepartment sx={{ fontSize: { xs: 12, sm: 14 }, color: theme.palette.error.main }} />
                                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                                  {exercise.caloriesBurned || '~50'}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Stack>

                          {exercise.muscleGroups && exercise.muscleGroups.length > 0 && !isMobile && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontSize: '0.7rem',
                                mb: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              🎯 {exercise.muscleGroups.slice(0, 2).join(' • ')}
                            </Typography>
                          )}

                          <Button
                            fullWidth
                            size="small"
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExerciseClick(exercise._id);
                            }}
                            startIcon={<PlayArrow sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                            sx={{
                              mt: 'auto',
                              py: { xs: 0.6, sm: 0.8 },
                              background: `linear-gradient(135deg, ${getTypeColor(exercise.type)} 0%, ${alpha(getTypeColor(exercise.type), 0.8)} 100%)`,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.8rem' },
                              textTransform: 'none',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${getTypeColor(exercise.type)} 0%, ${alpha(getTypeColor(exercise.type), 0.9)} 100%)`,
                              }
                            }}
                          >
                            {isMobile ? 'Начать' : 'Начать тренировку'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Box>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                      size={isMobile ? 'small' : 'medium'}
                      siblingCount={isMobile ? 0 : 1}
                      boundaryCount={isMobile ? 1 : 2}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 2,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          minWidth: { xs: 32, sm: 40 },
                          height: { xs: 32, sm: 40 }
                        }
                      }}
                    />
                  </Stack>
                )}
              </>
            )}
          </motion.div>
        )}
      </Container>

      {/* Мобильные компоненты */}
      {isMobile && (
        <>
          <FiltersDrawer />
          <SortDialog />
          
          {/* Плавающая кнопка фильтров */}
          <AnimatePresence>
            {!showFilters && activeFiltersCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Fab
                  onClick={() => setShowFilters(true)}
                  size="small"
                  sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    width: 48,
                    height: 48
                  }}
                >
                  <Badge badgeContent={activeFiltersCount} color="error">
                    <FilterList />
                  </Badge>
                </Fab>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </Box>
  );
};

export default Exercises;