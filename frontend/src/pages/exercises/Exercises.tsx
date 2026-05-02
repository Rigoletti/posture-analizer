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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    // Инициализация из кэша при монтировании
    const cached = cache.get(CACHE_KEY);
    return cached || [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = cache.get(CACHE_KEY);
    return !cached; // Если есть кэш, не показываем загрузку
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Ref для предотвращения двойной загрузки
  const isMounted = useRef(false);
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Доступные типы упражнений
  const exerciseTypes = useMemo(() => [
    { value: 'all', label: 'Все типы', icon: <FitnessCenter />, color: theme.palette.primary.main, count: exercises.length },
    { value: 'stretching', label: 'Растяжка', icon: <Spa />, color: theme.palette.primary.main, count: exercises.filter(e => e.type === 'stretching').length },
    { value: 'cardio', label: 'Кардио', icon: <Whatshot />, color: theme.palette.error.main, count: exercises.filter(e => e.type === 'cardio').length },
    { value: 'strength', label: 'Силовые', icon: <FitnessCenter />, color: theme.palette.info.main, count: exercises.filter(e => e.type === 'strength').length },
    { value: 'posture', label: 'Осанка', icon: <TrendingUp />, color: theme.palette.success.main, count: exercises.filter(e => e.type === 'posture').length },
    { value: 'flexibility', label: 'Гибкость', icon: <Spa />, color: theme.palette.primary.main, count: exercises.filter(e => e.type === 'flexibility').length },
    { value: 'warmup', label: 'Разминка', icon: <Bolt />, color: theme.palette.warning.main, count: exercises.filter(e => e.type === 'warmup').length },
    { value: 'cooldown', label: 'Заминка', icon: <Restore />, color: theme.palette.grey[500], count: exercises.filter(e => e.type === 'cooldown').length }
  ], [exercises, theme]);

  const difficulties = useMemo(() => [
    { value: 'all', label: 'Любой уровень', color: theme.palette.primary.main },
    { value: 'beginner', label: 'Начальный', color: theme.palette.success.main },
    { value: 'intermediate', label: 'Средний', color: theme.palette.warning.main },
    { value: 'advanced', label: 'Продвинутый', color: theme.palette.error.main }
  ], [theme]);

  const sortOptions = [
    { value: 'popular', label: 'Популярные', icon: <TrendingUp sx={{ fontSize: 16 }} /> },
    { value: 'newest', label: 'Новые', icon: <Timer sx={{ fontSize: 16 }} /> },
    { value: 'duration', label: 'По длительности', icon: <AccessTime sx={{ fontSize: 16 }} /> },
  ];

  // Функция для генерации ключа кэша
  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY}_${selectedType}_${selectedDifficulty}_${show3dOnly}_${sortBy}_${page}_${searchTerm}`;
  }, [selectedType, selectedDifficulty, show3dOnly, sortBy, page, searchTerm]);

  // Основная функция загрузки
  const fetchExercises = useCallback(async (skipCache = false) => {
    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const cacheKey = getCacheKey();
    
    // Проверяем кэш
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
        limit: 20,
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
      
      // Сохраняем в кэш
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
  }, [selectedType, selectedDifficulty, show3dOnly, searchTerm, page, sortBy, favorites, getCacheKey]);

  // Загрузка при монтировании - только один раз
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
  }, []); // Пустой массив - только при монтировании

  // Обновление при изменении фильтров
  useEffect(() => {
    if (initialLoadDone.current) {
      // Сбрасываем страницу если изменились фильтры
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

  // Обновление при изменении страницы
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
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={600}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
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
              
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                  fontWeight: 800,
                  mb: 2,
                  lineHeight: 1.1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Система упражнений
              </Typography>
              
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

              {/* Быстрые фильтры */}
              <Stack 
                direction="row" 
                spacing={1} 
                justifyContent="center" 
                sx={{ 
                  flexWrap: 'wrap', 
                  gap: 1,
                  mb: 4 
                }}
              >
                {exerciseTypes.slice(0, 5).map((type) => (
                  <Chip
                    key={type.value}
                    icon={type.icon}
                    label={`${type.label} ${type.count > 0 ? `(${type.count})` : ''}`}
                    onClick={() => setSelectedType(type.value === selectedType ? 'all' : type.value)}
                    variant={selectedType === type.value ? 'filled' : 'outlined'}
                    sx={{
                      bgcolor: selectedType === type.value ? alpha(type.color, 0.15) : 'transparent',
                      borderColor: alpha(type.color, 0.3),
                      color: selectedType === type.value ? type.color : theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: alpha(type.color, 0.1),
                      },
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        </Fade>

        {/* Панель поиска и фильтров */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              bgcolor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.4),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  bgcolor: theme.palette.mode === 'light' 
                    ? theme.palette.background.paper
                    : alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <Search sx={{ color: theme.palette.primary.main, mr: 1, fontSize: '1rem' }} />
                  <InputBase
                    placeholder="Поиск упражнений..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ 
                      flex: 1,
                      color: theme.palette.text.primary,
                      fontSize: '0.9rem',
                    }}
                  />
                  {searchTerm && (
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchTerm('')}
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Stack 
                  direction="row" 
                  spacing={1.5} 
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }} 
                  alignItems="center" 
                  flexWrap="wrap"
                >
                  {/* Сортировка */}
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

                  {/* Фильтр сложности */}
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

                  <Tooltip title="Только с 3D моделью">
                    <IconButton
                      onClick={() => setShow3dOnly(!show3dOnly)}
                      sx={{
                        bgcolor: show3dOnly ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: show3dOnly ? theme.palette.primary.main : theme.palette.text.secondary,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    >
                      <ModelTraining />
                    </IconButton>
                  </Tooltip>

                  <Badge
                    badgeContent={activeFiltersCount}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 18, minWidth: 18 } }}
                  >
                    <Button
                      variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
                      startIcon={<FilterList />}
                      onClick={() => setShowFilters(!showFilters)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        ...(activeFiltersCount > 0 && { bgcolor: theme.palette.primary.main })
                      }}
                    >
                      Фильтры
                    </Button>
                  </Badge>

                  {activeFiltersCount > 0 && (
                    <Tooltip title="Сбросить все">
                      <IconButton
                        onClick={clearFilters}
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
              </Grid>
            </Grid>

            {/* Панель расширенных фильтров */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
                          Типы упражнений
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {exerciseTypes.map((type) => (
                            <Chip
                              key={type.value}
                              icon={type.icon}
                              label={`${type.label} (${type.count})`}
                              onClick={() => setSelectedType(type.value === selectedType ? 'all' : type.value)}
                              variant={selectedType === type.value ? 'filled' : 'outlined'}
                              sx={{
                                bgcolor: selectedType === type.value ? alpha(type.color, 0.15) : 'transparent',
                                borderColor: alpha(type.color, 0.3),
                                color: selectedType === type.value ? type.color : theme.palette.text.secondary,
                              }}
                            />
                          ))}
                        </Stack>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
                          Уровень сложности
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {difficulties.map((diff) => (
                            <Chip
                              key={diff.value}
                              label={diff.label}
                              onClick={() => setSelectedDifficulty(diff.value === selectedDifficulty ? 'all' : diff.value)}
                              variant={selectedDifficulty === diff.value ? 'filled' : 'outlined'}
                              sx={{
                                bgcolor: selectedDifficulty === diff.value ? alpha(diff.color, 0.15) : 'transparent',
                                borderColor: alpha(diff.color, 0.3),
                                color: selectedDifficulty === diff.value ? diff.color : theme.palette.text.secondary,
                              }}
                            />
                          ))}
                        </Stack>
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={show3dOnly}
                              onChange={(e) => setShow3dOnly(e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: theme.palette.primary.main,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                                },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ModelTraining sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                              <Typography sx={{ color: theme.palette.text.primary }}>
                                Только с 3D моделью
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>

        {/* Список упражнений */}
        {loading && exercises.length === 0 ? (
          <Grid container spacing={2}>
            {[...Array(12)].map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
                <Skeleton 
                  variant="rectangular" 
                  height={280} 
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
                  p: 8,
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <FilterList sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="h5" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
                  Упражнения не найдены
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                  Попробуйте изменить параметры фильтрации
                </Typography>
                <Button
                  variant="contained"
                  onClick={clearFilters}
                  startIcon={<Restore />}
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
                  gap: 2.5,
                  mb: 4
                }}>
                  {exercises.map((exercise) => (
                    <motion.div
                      key={exercise._id}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
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
                          borderRadius: 3,
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: getTypeColor(exercise.type),
                            boxShadow: `0 12px 24px ${alpha(getTypeColor(exercise.type), 0.15)}`,
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        <Box sx={{ 
                          position: 'relative', 
                          height: 140,
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
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              bgcolor: alpha(getTypeColor(exercise.type), 0.15),
                              border: `1px solid ${alpha(getTypeColor(exercise.type), 0.3)}`,
                              backdropFilter: 'blur(10px)'
                            }}>
                              {React.cloneElement(getTypeIcon(exercise.type), {
                                sx: { fontSize: 28, color: getTypeColor(exercise.type) }
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
                              top: 8,
                              right: 8,
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              backdropFilter: 'blur(4px)',
                              width: 28,
                              height: 28,
                              '&:hover': { bgcolor: theme.palette.error.light }
                            }}
                          >
                            {exercise.isFavorite ? (
                              <Favorite sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                            ) : (
                              <FavoriteBorder sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>

                          <Chip
                            label={exercise.level.charAt(0)}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: exercise.difficulty === 'beginner' ? theme.palette.success.main :
                                      exercise.difficulty === 'intermediate' ? theme.palette.warning.main : theme.palette.error.main,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              minWidth: 24,
                              height: 24
                            }}
                          />

                          {exercise.has3dModel && (
                            <Chip
                              icon={<ModelTraining sx={{ fontSize: 12 }} />}
                              label="3D"
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                bgcolor: alpha(theme.palette.primary.main, 0.95),
                                color: '#fff',
                                fontSize: '0.65rem',
                                height: 22,
                                backdropFilter: 'blur(4px)',
                                '& .MuiChip-icon': { ml: 0.5, fontSize: 12 }
                              }}
                            />
                          )}
                        </Box>

                        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 700, 
                              mb: 1,
                              lineHeight: 1.3,
                              fontSize: '0.95rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {exercise.title}
                          </Typography>

                          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                            <Tooltip title="Длительность">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: 14, color: theme.palette.info.main }} />
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  {exercise.duration} мин
                                </Typography>
                              </Box>
                            </Tooltip>
                            
                            <Tooltip title="Сжигаемые калории">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocalFireDepartment sx={{ fontSize: 14, color: theme.palette.error.main }} />
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  {exercise.caloriesBurned || '~50'}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Stack>

                          {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
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
                            startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                            sx={{
                              mt: 'auto',
                              py: 0.8,
                              background: `linear-gradient(135deg, ${getTypeColor(exercise.type)} 0%, ${alpha(getTypeColor(exercise.type), 0.8)} 100%)`,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              textTransform: 'none',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${getTypeColor(exercise.type)} 0%, ${alpha(getTypeColor(exercise.type), 0.9)} 100%)`,
                              }
                            }}
                          >
                            Начать тренировку
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
                      size={isTablet ? 'small' : 'medium'}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 2,
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

      {/* Плавающая кнопка фильтров для мобильных */}
      <AnimatePresence>
        {isMobile && !showFilters && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Fab
              onClick={() => setShowFilters(true)}
              sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              <Badge badgeContent={activeFiltersCount} color="error">
                <FilterList />
              </Badge>
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Exercises;