import React, { useState, useEffect } from 'react';
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
  useMediaQuery
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
  Close
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
}

const Exercises: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Фильтры
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [show3dOnly, setShow3dOnly] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);

  // Доступные типы упражнений
  const exerciseTypes = [
    { value: 'all', label: 'Все типы', icon: <FitnessCenter />, color: theme.palette.primary.main },
    { value: 'stretching', label: 'Растяжка', icon: <Spa />, color: theme.palette.primary.main },
    { value: 'cardio', label: 'Кардио', icon: <Whatshot />, color: theme.palette.error.main },
    { value: 'strength', label: 'Силовые', icon: <FitnessCenter />, color: theme.palette.info.main },
    { value: 'posture', label: 'Осанка', icon: <TrendingUp />, color: theme.palette.success.main },
    { value: 'flexibility', label: 'Гибкость', icon: <Spa />, color: theme.palette.primary.main },
    { value: 'warmup', label: 'Разминка', icon: <Bolt />, color: theme.palette.warning.main },
    { value: 'cooldown', label: 'Заминка', icon: <Restore />, color: theme.palette.grey[500] }
  ];

  const difficulties = [
    { value: 'all', label: 'Любой уровень', color: theme.palette.primary.main },
    { value: 'beginner', label: 'Начальный', color: theme.palette.success.main },
    { value: 'intermediate', label: 'Средний', color: theme.palette.warning.main },
    { value: 'advanced', label: 'Продвинутый', color: theme.palette.error.main }
  ];

  useEffect(() => {
    fetchExercises();
  }, [selectedType, selectedDifficulty, show3dOnly]);

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      
      // Формируем параметры запроса
      const params: any = {};
      
      // Фильтр по типу
      if (selectedType && selectedType !== 'all') {
        params.type = selectedType;
      }
      
      // Фильтр по сложности
      if (selectedDifficulty && selectedDifficulty !== 'all') {
        params.difficulty = selectedDifficulty;
      }
      
      // Фильтр по 3D моделям
      if (show3dOnly) {
        params.has3dModel = 'true';
      }
      
      // Поиск
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      console.log('Fetching exercises with params:', params);
      
      const response = await exercisesApi.getExercises(params);
      
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
        isFavorite: Math.random() > 0.5
      }));
      
      setExercises(formattedExercises);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedDifficulty('all');
    setShow3dOnly(false);
    setSearchTerm('');
  };

  const getTypeColor = (type: string) => {
    const found = exerciseTypes.find(t => t.value === type);
    return found?.color || theme.palette.primary.main;
  };

  const getTypeIcon = (type: string) => {
    const found = exerciseTypes.find(t => t.value === type);
    return found?.icon || <FitnessCenter />;
  };

  const getTypeLabel = (type: string) => {
    const found = exerciseTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const handleExerciseClick = (exerciseId: string) => {
    navigate(`/exercises/${exerciseId}`);
  };

  const toggleFavorite = (id: string) => {
    setExercises(exercises.map(ex => 
      ex._id === id ? { ...ex, isFavorite: !ex.isFavorite } : ex
    ));
  };

  // Считаем активные фильтры
  const activeFiltersCount = 
    (selectedType !== 'all' ? 1 : 0) +
    (selectedDifficulty !== 'all' ? 1 : 0) +
    (show3dOnly ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="ТРЕНИРОВКИ С 3D ГИДОМ"
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
                color: theme.palette.text.primary,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
                fontSize: '1rem',
                fontWeight: 400
              }}
            >
              Профессионально подобранные упражнения с 3D демонстрациями
            </Typography>
          </Box>
        </motion.div>

        {/* Панель поиска и фильтров */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.background.paper, 0.7)
                : alpha(theme.palette.background.paper, 0.4),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
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
                      fontSize: '0.85rem',
                      '& input::placeholder': { 
                        color: theme.palette.text.secondary, 
                        fontSize: '0.85rem' 
                      }
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
              
              <Grid item xs={12} md={7}>
                <Stack 
                  direction="row" 
                  spacing={1} 
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }} 
                  alignItems="center" 
                  flexWrap="wrap"
                >
                  {/* Фильтр по типу */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected || selected === 'all') {
                          return <em>Все типы</em>;
                        }
                        const type = exerciseTypes.find(t => t.value === selected);
                        return type?.label || selected;
                      }}
                      sx={{
                        bgcolor: theme.palette.mode === 'light' 
                          ? theme.palette.background.paper
                          : alpha(theme.palette.background.paper, 0.6),
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        fontSize: '0.8rem',
                        '& .MuiSelect-select': { py: 1 },
                        '& .MuiSelect-icon': { color: theme.palette.primary.main }
                      }}
                    >
                      {exerciseTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {React.cloneElement(type.icon, { 
                              sx: { fontSize: 16, color: type.color } 
                            })}
                            <Typography sx={{ 
                              color: type.value === 'all' ? theme.palette.text.secondary : 'inherit' 
                            }}>
                              {type.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Фильтр по сложности */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected || selected === 'all') {
                          return <em>Любой уровень</em>;
                        }
                        const diff = difficulties.find(d => d.value === selected);
                        return diff?.label || selected;
                      }}
                      sx={{
                        bgcolor: theme.palette.mode === 'light' 
                          ? theme.palette.background.paper
                          : alpha(theme.palette.background.paper, 0.6),
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        fontSize: '0.8rem',
                        '& .MuiSelect-select': { py: 1 },
                        '& .MuiSelect-icon': { color: theme.palette.primary.main }
                      }}
                    >
                      {difficulties.map(diff => (
                        <MenuItem key={diff.value} value={diff.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: diff.color 
                            }} />
                            <Typography sx={{ 
                              color: diff.value === 'all' ? theme.palette.text.secondary : 'inherit' 
                            }}>
                              {diff.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Badge
                    badgeContent={activeFiltersCount}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        fontSize: '0.6rem',
                        height: 16,
                        minWidth: 16
                      }
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<FilterList />}
                      onClick={() => setShowFilters(!showFilters)}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      Фильтры
                    </Button>
                  </Badge>
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
                    <Grid container spacing={3} alignItems="center">
                      {/* 3D модели */}
                      <Grid item xs={12} md={6}>
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
                              <Typography sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>
                                Только с 3D моделью
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>

                      {/* Кнопка сброса */}
                      <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          startIcon={<Restore />}
                          onClick={clearFilters}
                          disabled={activeFiltersCount === 0}
                          sx={{
                            color: activeFiltersCount > 0 ? theme.palette.primary.main : theme.palette.text.secondary,
                            '&:hover': { color: theme.palette.text.primary }
                          }}
                        >
                          Сбросить все фильтры
                        </Button>
                      </Grid>

                      {/* Активные фильтры */}
                      {activeFiltersCount > 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Активные фильтры:
                            </Typography>
                            
                            {selectedType !== 'all' && (
                              <Chip
                                icon={React.cloneElement(getTypeIcon(selectedType), { sx: { fontSize: 14 } })}
                                label={getTypeLabel(selectedType)}
                                onDelete={() => setSelectedType('all')}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getTypeColor(selectedType), 0.1),
                                  color: getTypeColor(selectedType),
                                  border: `1px solid ${alpha(getTypeColor(selectedType), 0.3)}`,
                                  '& .MuiChip-deleteIcon': {
                                    color: getTypeColor(selectedType),
                                    fontSize: 14
                                  }
                                }}
                              />
                            )}
                            
                            {selectedDifficulty !== 'all' && (
                              <Chip
                                label={difficulties.find(d => d.value === selectedDifficulty)?.label}
                                onDelete={() => setSelectedDifficulty('all')}
                                size="small"
                                sx={{
                                  bgcolor: alpha(difficulties.find(d => d.value === selectedDifficulty)?.color || theme.palette.primary.main, 0.1),
                                  color: difficulties.find(d => d.value === selectedDifficulty)?.color || theme.palette.primary.main,
                                  border: `1px solid ${alpha(difficulties.find(d => d.value === selectedDifficulty)?.color || theme.palette.primary.main, 0.3)}`,
                                  '& .MuiChip-deleteIcon': {
                                    color: difficulties.find(d => d.value === selectedDifficulty)?.color || theme.palette.primary.main,
                                    fontSize: 14
                                  }
                                }}
                              />
                            )}
                            
                            {show3dOnly && (
                              <Chip
                                icon={<ModelTraining sx={{ fontSize: 14 }} />}
                                label="С 3D моделью"
                                onDelete={() => setShow3dOnly(false)}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                  '& .MuiChip-deleteIcon': {
                                    color: theme.palette.primary.main,
                                    fontSize: 14
                                  }
                                }}
                              />
                            )}
                            
                            {searchTerm && (
                              <Chip
                                icon={<Search sx={{ fontSize: 14 }} />}
                                label={`Поиск: ${searchTerm}`}
                                onDelete={() => setSearchTerm('')}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                  '& .MuiChip-deleteIcon': {
                                    color: theme.palette.primary.main,
                                    fontSize: 14
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>

        {/* Список упражнений */}
        {loading ? (
          <Grid container spacing={2}>
            {[...Array(12)].map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                <Box sx={{ width: '100%' }}>
                  <Skeleton 
                    variant="rectangular" 
                    height={240} 
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'light' 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.background.paper, 0.4),
                      width: '100%'
                    }} 
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3 
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                fontSize: '1.25rem',
                color: theme.palette.text.primary
              }}>
                Упражнения
                <Typography component="span" sx={{ 
                  ml: 1,
                  color: theme.palette.primary.main,
                  fontWeight: 400,
                  fontSize: '0.9rem'
                }}>
                  ({exercises.length})
                </Typography>
              </Typography>
            </Box>

            {exercises.length === 0 ? (
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <FilterList sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1 }}>
                  Упражнения не найдены
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                  Попробуйте изменить параметры фильтрации
                </Typography>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  Сбросить фильтры
                </Button>
              </Paper>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(4, 1fr)',
                  md: 'repeat(6, 1fr)'
                },
                gap: 2
              }}>
                {exercises.map((exercise, index) => (
                  <Box key={exercise._id}>
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      style={{ width: '100%' }}
                    >
                      <Card 
                        onClick={() => handleExerciseClick(exercise._id)}
                        sx={{ 
                          width: '100%',
                          aspectRatio: '3/4',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          bgcolor: theme.palette.mode === 'light' 
                            ? theme.palette.background.paper
                            : alpha(theme.palette.background.paper, 0.6),
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backdropFilter: 'blur(10px)',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: getTypeColor(exercise.type),
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 24px ${alpha(getTypeColor(exercise.type), 0.15)}`
                          }
                        }}
                      >
                        <Box sx={{ 
                          position: 'relative', 
                          overflow: 'hidden', 
                          height: '40%',
                          flexShrink: 0,
                          bgcolor: alpha(getTypeColor(exercise.type), 0.1)
                        }}>
                          <Box sx={{ 
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 50,
                              height: 50,
                              borderRadius: '50%',
                              bgcolor: alpha(getTypeColor(exercise.type), 0.2),
                              border: `1px solid ${alpha(getTypeColor(exercise.type), 0.3)}`,
                              backdropFilter: 'blur(10px)'
                            }}>
                              {React.cloneElement(getTypeIcon(exercise.type), {
                                sx: { 
                                  fontSize: 24,
                                  color: getTypeColor(exercise.type)
                                }
                              })}
                            </Box>
                          </Box>

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
                              bgcolor: theme.palette.mode === 'light' 
                                ? theme.palette.background.paper
                                : alpha(theme.palette.background.paper, 0.8),
                              border: `1px solid ${theme.palette.divider}`,
                              width: 24,
                              height: 24,
                              '&:hover': {
                                bgcolor: getTypeColor(exercise.type)
                              }
                            }}
                          >
                            {exercise.isFavorite ? (
                              <Favorite sx={{ color: theme.palette.error.main, fontSize: 14 }} />
                            ) : (
                              <FavoriteBorder sx={{ color: theme.palette.text.secondary, fontSize: 14 }} />
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
                              color: theme.palette.getContrastText(
                                exercise.difficulty === 'beginner' ? theme.palette.success.main :
                                exercise.difficulty === 'intermediate' ? theme.palette.warning.main : theme.palette.error.main
                              ),
                              fontWeight: 700,
                              fontSize: '0.6rem',
                              borderRadius: '4px',
                              minWidth: 20,
                              height: 20
                            }}
                          />

                          {exercise.has3dModel && (
                            <Chip
                              icon={<ModelTraining sx={{ fontSize: 10 }} />}
                              label="3D"
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                bgcolor: alpha(theme.palette.primary.main, 0.9),
                                color: theme.palette.primary.contrastText,
                                fontSize: '0.6rem',
                                height: 20,
                                '& .MuiChip-icon': { ml: 0.5 }
                              }}
                            />
                          )}
                        </Box>

                        <CardContent sx={{ 
                          flexGrow: 1,
                          flexShrink: 1,
                          p: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          height: '60%',
                          overflow: 'hidden',
                          '&:last-child': { pb: 1.5 }
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 700, 
                              mb: 0.5,
                              lineHeight: 1.2,
                              color: theme.palette.text.primary,
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word'
                            }}
                          >
                            {exercise.title}
                          </Typography>

                          <Stack 
                            direction="row" 
                            spacing={1} 
                            sx={{ 
                              mb: 0.5,
                              flexShrink: 0
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: 12, color: theme.palette.info.main }} />
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.7rem' }}>
                                {exercise.duration} мин
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocalFireDepartment sx={{ fontSize: 12, color: theme.palette.error.main }} />
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.7rem' }}>
                                {exercise.caloriesBurned || '0'}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box sx={{ 
                            mb: 0.5,
                            flexShrink: 0
                          }}>
                            <Chip
                              label={getTypeLabel(exercise.type)}
                              size="small"
                              sx={{
                                bgcolor: alpha(getTypeColor(exercise.type), 0.1),
                                color: getTypeColor(exercise.type),
                                fontSize: '0.65rem',
                                height: 20,
                                border: `1px solid ${alpha(getTypeColor(exercise.type), 0.3)}`,
                                maxWidth: '100%',
                                '& .MuiChip-label': {
                                  px: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }}
                            />
                          </Box>

                          {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontSize: '0.65rem',
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              {exercise.muscleGroups.slice(0, 2).join(' • ')}
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
                            sx={{
                              mt: 'auto',
                              py: 0.5,
                              flexShrink: 0,
                              background: `linear-gradient(135deg, ${getTypeColor(exercise.type)} 0%, ${alpha(getTypeColor(exercise.type), 0.8)} 100%)`,
                              borderRadius: 1.5,
                              fontWeight: 700,
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${getTypeColor(exercise.type)} 0%, ${alpha(getTypeColor(exercise.type), 0.9)} 100%)`,
                                transform: 'translateY(-1px)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Начать
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Box>
                ))}
              </Box>
            )}
          </motion.div>
        )}
      </Container>

      {/* Плавающая кнопка фильтров для мобильных */}
      <Fab
        size="small"
        onClick={() => setShowFilters(!showFilters)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          width: 40,
          height: 40,
          display: { xs: 'flex', md: 'none' },
          '&:hover': {
            bgcolor: theme.palette.primary.dark
          }
        }}
      >
        <Badge
          badgeContent={activeFiltersCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              fontSize: '0.6rem',
              height: 16,
              minWidth: 16,
              right: -4,
              top: -4
            }
          }}
        >
          <FilterList sx={{ fontSize: 20 }} />
        </Badge>
      </Fab>
    </Box>
  );
};

export default Exercises;