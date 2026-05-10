import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  alpha,
  Paper,
  Avatar,
  Fab,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  SwipeableDrawer,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Pause,
  AccessTime,
  FitnessCenter,
  LocalFireDepartment,
  Warning,
  CheckCircle,
  Timer,
  TrendingUp,
  ModelTraining,
  SkipNext,
  SkipPrevious,
  FormatListNumbered,
  Replay,
  Share,
  Bookmark,
  BookmarkBorder,
  Fullscreen,
  Info,
  Science,
  Psychology,
  Thermostat,
  FlashOn,
  DirectionsRun,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { exercisesApi } from '../../api/exercises';
import Simple3DViewer from '../../components/exercises/ThreeDModelViewer';

interface ExerciseStep {
  instruction: string;
  duration: number;
  tip: string;
  image?: string;
}

interface Exercise {
  id: string;
  title: string;
  type: string;
  modelType: string;
  modelUrl: string | null;
  description: string;
  duration: string;
  difficulty: string;
  steps: ExerciseStep[];
  benefits: string[];
  warnings: string[];
  has3dModel: boolean;
  caloriesBurned: number;
  muscleGroups: string[];
  videoUrl: string;
  imageUrl: string;
  intensity: string;
  equipment: string[];
  isFavorite: boolean;
}

const ExerciseDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Все хуки useState
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMobileSteps, setShowMobileSteps] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  
  // Все useRef хуки
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Cleanup функция для таймеров
  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Функция загрузки упражнения
  const fetchExercise = useCallback(async (exerciseId: string) => {
    try {
      setLoading(true);
      const response = await exercisesApi.getExerciseById(exerciseId);
      const exerciseData = response.data.exercise;
      
      let modelUrl = null;
      if (exerciseData.modelFile && exerciseData.modelFile.url) {
        modelUrl = exerciseData.modelFile.url;
      } else if (exerciseData.modelFile && exerciseData.modelFile.filename) {
        modelUrl = `http://localhost:5000/uploads/exercises/${exerciseData.modelFile.filename}`;
      }
      
      const formattedExercise: Exercise = {
        id: exerciseData._id,
        title: exerciseData.title || 'Без названия',
        type: exerciseData.type || 'stretching',
        modelType: exerciseData.modelType || 'custom',
        modelUrl: modelUrl,
        description: exerciseData.description || 'Описание отсутствует',
        duration: `${exerciseData.duration || 10} минут`,
        difficulty: exerciseData.difficulty === 'beginner' ? 'Начальный' : 
                   exerciseData.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый',
        steps: Array.isArray(exerciseData.instructions) && exerciseData.instructions.length > 0 
          ? exerciseData.instructions.map((instruction: string, index: number) => ({
              instruction: instruction || `Шаг ${index + 1}`,
              duration: 5000,
              tip: (exerciseData.warnings && exerciseData.warnings[index]) 
                ? exerciseData.warnings[index] 
                : 'Выполняйте упражнение плавно и без резких движений'
            }))
          : [{
              instruction: 'Начните выполнение упражнения',
              duration: 5000,
              tip: 'Выполняйте упражнение плавно и без резких движений'
            }],
        benefits: exerciseData.benefits || ['Улучшение гибкости', 'Укрепление мышц', 'Повышение выносливости'],
        warnings: exerciseData.warnings || ['Перед началом выполните разминку', 'При болях прекратите выполнение'],
        has3dModel: exerciseData.has3dModel || false,
        caloriesBurned: exerciseData.caloriesBurned || 50,
        muscleGroups: exerciseData.muscleGroups || ['Все тело'],
        videoUrl: exerciseData.videoUrl || '',
        imageUrl: exerciseData.imageUrl || '',
        intensity: exerciseData.intensity || 'Средняя',
        equipment: exerciseData.equipment || [],
        isFavorite: Math.random() > 0.5
      };
      
      setExercise(formattedExercise);
      
      if (formattedExercise.steps.length > 0) {
        setTimeRemaining(formattedExercise.steps[0].duration);
        setProgress(100 / formattedExercise.steps.length);
      }
    } catch (err) {
      console.error('Error fetching exercise:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect для загрузки данных
  useEffect(() => {
    if (id) {
      fetchExercise(id);
    }
    return cleanupTimers;
  }, [id, fetchExercise, cleanupTimers]);

  // Оптимизированный таймер
  useEffect(() => {
    if (!isPlaying || !exercise) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let lastUpdate = Date.now();
    
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdate;
      lastUpdate = now;
      
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          const nextStep = (currentStep + 1) % exercise.steps.length;
          setCurrentStep(nextStep);
          const newTime = exercise.steps[nextStep].duration;
          setProgress(((nextStep + 1) / exercise.steps.length) * 100);
          return newTime;
        }
        return prev - delta;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, currentStep, exercise]);

  // Мемоизированные обработчики
  const handleStepClick = useCallback((stepIndex: number) => {
    if (!exercise) return;
    
    setCurrentStep(stepIndex);
    setIsPlaying(false);
    setTimeRemaining(exercise.steps[stepIndex].duration);
    setProgress(((stepIndex + 1) / exercise.steps.length) * 100);
    if (isMobile) setShowMobileSteps(false);
  }, [exercise, isMobile]);

  const formatTime = useCallback((milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return seconds.toString().padStart(2, '0');
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const resetExercise = useCallback(() => {
    if (!exercise) return;
    
    setIsPlaying(false);
    setCurrentStep(0);
    setTimeRemaining(exercise.steps[0].duration);
    setProgress(0);
  }, [exercise]);

  const nextStep = useCallback(() => {
    if (!exercise) return;
    const next = (currentStep + 1) % exercise.steps.length;
    handleStepClick(next);
  }, [exercise, currentStep, handleStepClick]);

  const prevStep = useCallback(() => {
    if (!exercise) return;
    const prev = currentStep > 0 ? currentStep - 1 : exercise.steps.length - 1;
    handleStepClick(prev);
  }, [exercise, currentStep, handleStepClick]);

  // Мемоизированные вычисления
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'начальный': return theme.palette.success.main;
      case 'средний': return theme.palette.warning.main;
      case 'продвинутый': return theme.palette.error.main;
      default: return theme.palette.primary.main;
    }
  }, [theme]);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'stretching': return theme.palette.secondary.main;
      case 'strength': return theme.palette.primary.main;
      case 'cardio': return theme.palette.error.main;
      case 'core': return theme.palette.success.main;
      case 'yoga': return theme.palette.secondary.main;
      default: return theme.palette.primary.main;
    }
  }, [theme]);

  const currentStepData = useMemo(() => 
    exercise?.steps[currentStep], 
    [exercise, currentStep]
  );

  const stepProgress = useMemo(() => {
    if (!currentStepData) return 0;
    return ((currentStepData.duration - timeRemaining) / currentStepData.duration) * 100;
  }, [currentStepData, timeRemaining]);

  const exerciseTypeColor = useMemo(() => 
    exercise ? getTypeColor(exercise.type) : theme.palette.primary.main,
    [exercise, getTypeColor, theme]
  );

  const stats = useMemo(() => exercise ? [
    { 
      icon: <DirectionsRun />, 
      label: 'Интенсивность',
      value: exercise.intensity,
      color: theme.palette.error.main,
    },
    { 
      icon: <Thermostat />, 
      label: 'Сложность',
      value: exercise.difficulty,
      color: getDifficultyColor(exercise.difficulty),
    },
    { 
      icon: <FlashOn />, 
      label: 'Шагов',
      value: exercise.steps.length,
      color: theme.palette.warning.main,
    },
    { 
      icon: <Science />, 
      label: 'Тип',
      value: exercise.type.toUpperCase(),
      color: exerciseTypeColor,
    }
  ] : [], [exercise, getDifficultyColor, exerciseTypeColor, theme]);

  // Функции для рендеринга мобильных дроверов
  const renderMobileStepsDrawer = () => {
    if (!isMobile || !exercise) return null;
    
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={showMobileSteps}
        onClose={() => setShowMobileSteps(false)}
        onOpen={() => setShowMobileSteps(true)}
        disableSwipeToOpen
        key="mobile-steps-drawer"
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80vh',
            background: theme.palette.background.paper,
          }
        }}
      >
        <Box sx={{ p: 2, pb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Все шаги ({exercise.steps.length})
            </Typography>
            <IconButton onClick={() => setShowMobileSteps(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ maxHeight: 'calc(80vh - 80px)', overflowY: 'auto' }}>
            <Grid container spacing={2}>
              {exercise.steps.map((step, index) => (
                <Grid item xs={12} key={index}>
                  <Paper
                    onClick={() => handleStepClick(index)}
                    sx={{ 
                      p: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: `2px solid ${
                        index === currentStep 
                          ? exerciseTypeColor 
                          : theme.palette.divider
                      }`,
                      bgcolor: index === currentStep 
                        ? alpha(exerciseTypeColor, 0.1)
                        : theme.palette.mode === 'light' 
                          ? theme.palette.background.paper
                          : alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 4,
                        height: '100%',
                        bgcolor: index === currentStep 
                          ? exerciseTypeColor 
                          : index < currentStep
                          ? theme.palette.success.main
                          : alpha(theme.palette.text.disabled, 0.5)
                      }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 2 }}>
                        <Avatar sx={{ 
                          width: 36,
                          height: 36,
                          bgcolor: index === currentStep 
                            ? exerciseTypeColor 
                            : index < currentStep
                            ? theme.palette.success.main
                            : alpha(theme.palette.text.disabled, 0.3),
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.875rem'
                        }}>
                          {index < currentStep ? '✓' : index + 1}
                        </Avatar>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Шаг {index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                            {step.instruction}
                          </Typography>
                          <Chip
                            icon={<AccessTime sx={{ fontSize: 14 }} />}
                            label={formatTime(step.duration)}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </SwipeableDrawer>
    );
  };

  const renderMobileInfoDrawer = () => {
    if (!isMobile || !exercise) return null;
    
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={showMobileInfo}
        onClose={() => setShowMobileInfo(false)}
        onOpen={() => setShowMobileInfo(true)}
        disableSwipeToOpen
        key="mobile-info-drawer"
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
              Информация
            </Typography>
            <IconButton onClick={() => setShowMobileInfo(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ maxHeight: 'calc(85vh - 80px)', overflowY: 'auto' }}>
            {exercise.muscleGroups.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FitnessCenter sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  Группы мышц
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {exercise.muscleGroups.map((muscle, index) => (
                    <Chip
                      key={index}
                      label={muscle}
                      size="small"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ fontSize: 18, color: theme.palette.success.main }} />
                Польза
              </Typography>
              <List disablePadding>
                {exercise.benefits.map((benefit, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={benefit}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {exercise.warnings.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning sx={{ fontSize: 18, color: theme.palette.error.main }} />
                  Внимание
                </Typography>
                <List disablePadding>
                  {exercise.warnings.map((warning, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Warning sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={warning}
                        primaryTypographyProps={{ variant: 'body2', color: theme.palette.error.main }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 2, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology sx={{ fontSize: 18, color: exerciseTypeColor }} />
                Статистика
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Typography variant="caption" color="text.secondary">Шагов</Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      {currentStep + 1}/{exercise.steps.length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <Typography variant="caption" color="text.secondary">Время</Typography>
                    <Typography variant="h6" fontWeight={800} color="success.main">
                      {exercise.duration}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                    <Typography variant="caption" color="text.secondary">Калории</Typography>
                    <Typography variant="h6" fontWeight={800} color="error.main">
                      {Math.round((currentStep + 1) / exercise.steps.length * exercise.caloriesBurned)}/{exercise.caloriesBurned}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </SwipeableDrawer>
    );
  };

  // Ранние возвраты после всех хуков
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: theme.palette.background.default
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={isMobile ? 40 : 60} sx={{ color: theme.palette.primary.main }} />
          <Typography variant="body1" color={theme.palette.text.secondary}>
            Загрузка упражнения...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!exercise) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
          <Paper
            sx={{
              p: { xs: 3, md: 6 },
              textAlign: 'center',
              bgcolor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.background.paper, 0.7)
                : alpha(theme.palette.background.paper, 0.4),
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Warning sx={{ fontSize: { xs: 48, md: 64 }, color: theme.palette.error.main, mb: 3 }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '1.5rem', md: '2rem' },
              color: theme.palette.text.primary
            }}>
              Упражнение не найдено
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
              Возможно, упражнение было удалено или перемещено
            </Typography>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/exercises')}
              variant="contained"
              fullWidth={isMobile}
              sx={{
                px: { xs: 3, md: 6 },
                py: { xs: 1.5, md: 2 },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                borderRadius: 3,
                fontWeight: 700,
              }}
            >
              Вернуться к упражнениям
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Основной рендер
  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      py: { xs: 1, sm: 2, md: 4 },
      pb: { xs: 8, md: 4 }
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 6 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/exercises')}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }
              }}
            >
              {isMobile ? "Назад" : "Назад"}
            </Button>

            <Stack direction="row" spacing={isMobile ? 1 : 2}>
              <Tooltip title="Добавить в избранное">
                <IconButton
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'light' 
                      ? theme.palette.background.paper
                      : alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {isBookmarked ? (
                    <Bookmark sx={{ color: theme.palette.error.main }} />
                  ) : (
                    <BookmarkBorder sx={{ color: theme.palette.text.secondary }} />
                  )}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Поделиться">
                <IconButton
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'light' 
                      ? theme.palette.background.paper
                      : alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Share sx={{ color: theme.palette.text.secondary }} />
                </IconButton>
              </Tooltip>

              {isMobile && (
                <Tooltip title="Информация">
                  <IconButton
                    onClick={() => setShowMobileInfo(true)}
                    size="small"
                    sx={{ 
                      bgcolor: theme.palette.mode === 'light' 
                        ? theme.palette.background.paper
                        : alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Info />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Exercise Info */}
          <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={exercise.difficulty}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  bgcolor: getDifficultyColor(exercise.difficulty),
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  borderRadius: '6px'
                }}
              />
              
              {exercise.has3dModel && (
                <Chip
                  icon={<ModelTraining />}
                  label="3D ГИД"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    fontWeight: 700,
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    borderRadius: '6px',
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
                  }}
                />
              )}
              
              <Chip
                icon={<LocalFireDepartment />}
                label={`${exercise.caloriesBurned} ккал`}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                }}
              />
              
              <Chip
                icon={<Timer />}
                label={exercise.duration}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              />
            </Stack>

            <Typography variant="h1" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem', lg: '3.5rem' },
              fontWeight: 800,
              mb: { xs: 1, sm: 2 },
              lineHeight: 1.2,
              color: theme.palette.text.primary
            }}>
              {exercise.title}
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary,
              maxWidth: 800,
              lineHeight: 1.6,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              {exercise.description}
            </Typography>
          </Box>
          
          {/* Stats Grid */}
          <Grid container spacing={isMobile ? 1.5 : 3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Paper sx={{ 
                  p: { xs: 2, sm: 3 },
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: { xs: 2, sm: 3 },
                  backdropFilter: 'blur(10px)',
                  height: '100%',
                  transition: 'all 0.3s ease',
                }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                    mb: { xs: 1, sm: 2 }
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 36, sm: 48 },
                      height: { xs: 36, sm: 48 },
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
                      color: 'white'
                    }}>
                      {React.cloneElement(stat.icon, { sx: { fontSize: { xs: 20, sm: 24 } } })}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        display: 'block',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }
                      }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 800,
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        color: theme.palette.text.primary
                      }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Main Content */}
        <Grid container spacing={isMobile ? 2 : 4}>
          {/* Left Column - Player */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={isMobile ? 2 : 4}>
              {/* 3D Player */}
              <Paper sx={{ 
                bgcolor: theme.palette.mode === 'light' 
                  ? alpha(theme.palette.background.paper, 0.7)
                  : alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: { xs: 2, sm: 3 },
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}>
                {/* Player Header - для десктопа */}
                {!isMobile && (
                  <Box sx={{ 
                    p: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700,
                      color: theme.palette.text.primary
                    }}>
                      <Box component="span" sx={{ color: exerciseTypeColor }}>
                        3D
                      </Box> МОДЕЛЬ
                    </Typography>
                    
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Полный экран">
                        <IconButton
                          sx={{ 
                            bgcolor: theme.palette.mode === 'light' 
                              ? theme.palette.background.paper
                              : alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.secondary,
                            '&:hover': { 
                              color: exerciseTypeColor,
                              borderColor: exerciseTypeColor
                            }
                          }}
                        >
                          <Fullscreen />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                )}

                {/* 3D Viewer */}
                <Box sx={{ 
                  height: { xs: 300, sm: 400, md: 500 },
                  bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : '#0f172a',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {exercise.has3dModel ? (
                    <Simple3DViewer 
                      modelUrl={exercise.modelUrl || undefined}
                      modelType={exercise.modelType}
                      isPlaying={isPlaying}
                    />
                  ) : (
                    <Box sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      p: 4
                    }}>
                      <ModelTraining sx={{ 
                        fontSize: { xs: 48, sm: 80 }, 
                        mb: 2, 
                        color: alpha(theme.palette.text.disabled, 0.5)
                      }} />
                      <Typography variant={isMobile ? "body1" : "h5"} sx={{ 
                        color: theme.palette.text.disabled,
                        mb: 1,
                        fontWeight: 700,
                        textAlign: 'center'
                      }}>
                        3D модель не настроена
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.disabled,
                        textAlign: 'center'
                      }}>
                        Используйте видеогид для правильного выполнения упражнения
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Timer Overlay */}
                  <Paper sx={{ 
                    position: 'absolute',
                    top: { xs: 10, sm: 20 },
                    right: { xs: 10, sm: 20 },
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.background.paper, 0.95)
                      : alpha(theme.palette.background.paper, 0.9),
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: { xs: 2, sm: 3 },
                    p: { xs: 1.5, sm: 3 },
                    minWidth: { xs: 100, sm: 140 },
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      letterSpacing: 1,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}>
                      ТАЙМЕР
                    </Typography>
                    <Typography variant="h1" sx={{ 
                      fontWeight: 900,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                      lineHeight: 1,
                      mb: 0.5,
                      color: exerciseTypeColor
                    }}>
                      {formatTime(timeRemaining)}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}>
                      Шаг {currentStep + 1} из {exercise.steps.length}
                    </Typography>
                  </Paper>
                </Box>
              </Paper>

              {/* Current Step Info */}
              {currentStepData && (
                <Paper sx={{ 
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: { xs: 2, sm: 3 },
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      mb: { xs: 2, sm: 4 },
                      flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                      <Box sx={{ flex: 1, mb: { xs: 2, sm: 0 } }}>
                        <Typography variant={isMobile ? "h6" : "h4"} sx={{ 
                          fontWeight: 800,
                          mb: { xs: 1, sm: 2 },
                          fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2rem' },
                          color: theme.palette.text.primary
                        }}>
                          <Box component="span" sx={{ color: exerciseTypeColor }}>
                            Шаг {currentStep + 1}.
                          </Box> {currentStepData.instruction}
                        </Typography>
                        
                        <Paper sx={{ 
                          p: { xs: 2, sm: 3 },
                          bgcolor: alpha(exerciseTypeColor, 0.1),
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Info sx={{ color: exerciseTypeColor, fontSize: { xs: 18, sm: 20 }, mt: 0.5 }} />
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.primary,
                              fontStyle: 'italic',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}>
                              💡 {currentStepData.tip}
                            </Typography>
                          </Box>
                        </Paper>
                      </Box>
                      
                      <Badge
                        badgeContent={formatTime(currentStepData.duration)}
                        sx={{
                          alignSelf: { xs: 'flex-start', sm: 'center' },
                          '& .MuiBadge-badge': {
                            bgcolor: exerciseTypeColor,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            minWidth: { xs: 50, sm: 60 },
                            height: { xs: 28, sm: 32 },
                            borderRadius: '6px'
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: { xs: 60, sm: 80 },
                          height: { xs: 60, sm: 80 },
                          borderRadius: '50%',
                          bgcolor: alpha(exerciseTypeColor, 0.1),
                          border: `2px solid ${alpha(exerciseTypeColor, 0.3)}`,
                          ml: { xs: 0, sm: 2 }
                        }}>
                          <Timer sx={{ color: exerciseTypeColor, fontSize: { xs: 24, sm: 32 } }} />
                        </Box>
                      </Badge>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 1 
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          Прогресс шага
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: exerciseTypeColor,
                          fontWeight: 700,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {Math.round(stepProgress)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stepProgress}
                        sx={{ 
                          height: { xs: 6, sm: 10 },
                          borderRadius: 5,
                          bgcolor: alpha(exerciseTypeColor, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: exerciseTypeColor,
                            borderRadius: 5,
                            background: `linear-gradient(90deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.8)} 100%)`
                          }
                        }}
                      />
                    </Box>

                    {/* Control Buttons */}
                    <Stack direction="row" spacing={isMobile ? 1.5 : 3} justifyContent="center" alignItems="center">
                      <Tooltip title="Предыдущий шаг">
                        <IconButton
                          onClick={prevStep}
                          size={isMobile ? "medium" : "large"}
                          sx={{ 
                            width: { xs: 48, sm: 64 },
                            height: { xs: 48, sm: 64 },
                            bgcolor: theme.palette.mode === 'light' 
                              ? theme.palette.background.paper
                              : alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <SkipPrevious sx={{ fontSize: { xs: 24, sm: 32 } }} />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={isPlaying ? "Пауза" : "Старт"}>
                        <IconButton
                          onClick={togglePlay}
                          size={isMobile ? "large" : "large"}
                          sx={{ 
                            width: { xs: 64, sm: 80 },
                            height: { xs: 64, sm: 80 },
                            background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.8)} 100%)`,
                            color: '#ffffff',
                            transition: 'all 0.3s ease',
                            boxShadow: `0 8px 32px ${alpha(exerciseTypeColor, 0.4)}`
                          }}
                        >
                          {isPlaying ? (
                            <Pause sx={{ fontSize: { xs: 32, sm: 40 } }} />
                          ) : (
                            <PlayArrow sx={{ fontSize: { xs: 32, sm: 40 } }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Следующий шаг">
                        <IconButton
                          onClick={nextStep}
                          size={isMobile ? "medium" : "large"}
                          sx={{ 
                            width: { xs: 48, sm: 64 },
                            height: { xs: 48, sm: 64 },
                            bgcolor: theme.palette.mode === 'light' 
                              ? theme.palette.background.paper
                              : alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <SkipNext sx={{ fontSize: { xs: 24, sm: 32 } }} />
                        </IconButton>
                      </Tooltip>
                      
                      {!isMobile && (
                        <Tooltip title="Сбросить">
                          <IconButton
                            onClick={resetExercise}
                            size="large"
                            sx={{ 
                              width: 64,
                              height: 64,
                              bgcolor: theme.palette.mode === 'light' 
                                ? theme.palette.background.paper
                                : alpha(theme.palette.background.paper, 0.6),
                              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                              color: theme.palette.error.main,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <Replay sx={{ fontSize: 32 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>

                    {isMobile && (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setShowMobileSteps(true)}
                        startIcon={<FormatListNumbered />}
                        sx={{ mt: 3, borderRadius: 2 }}
                      >
                        Все шаги ({exercise.steps.length})
                      </Button>
                    )}
                  </CardContent>
                </Paper>
              )}

              {/* All Steps Desktop */}
              {!isMobile && (
                <Paper sx={{ 
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      mb: 4,
                      color: theme.palette.text.primary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <FormatListNumbered sx={{ color: exerciseTypeColor }} />
                      Все шаги ({exercise.steps.length})
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {exercise.steps.map((step, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Paper
                            onClick={() => handleStepClick(index)}
                            sx={{ 
                              p: 3,
                              borderRadius: 3,
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: `2px solid ${
                                index === currentStep 
                                  ? exerciseTypeColor 
                                  : theme.palette.divider
                              }`,
                              bgcolor: index === currentStep 
                                ? alpha(exerciseTypeColor, 0.1)
                                : theme.palette.mode === 'light' 
                                  ? theme.palette.background.paper
                                  : alpha(theme.palette.background.paper, 0.6),
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <Box sx={{ 
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: 6,
                              height: '100%',
                              bgcolor: index === currentStep 
                                ? exerciseTypeColor 
                                : index < currentStep
                                ? theme.palette.success.main
                                : alpha(theme.palette.text.disabled, 0.5)
                            }} />
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: 3,
                              pl: 2
                            }}>
                              <Avatar sx={{ 
                                width: 40,
                                height: 40,
                                bgcolor: index === currentStep 
                                  ? exerciseTypeColor 
                                  : index < currentStep
                                  ? theme.palette.success.main
                                  : alpha(theme.palette.text.disabled, 0.3),
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '1rem'
                              }}>
                                {index < currentStep ? '✓' : index + 1}
                              </Avatar>
                              
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 700,
                                  color: theme.palette.text.primary,
                                  mb: 1
                                }}>
                                  Шаг {index + 1}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: theme.palette.text.secondary,
                                  mb: 2,
                                  lineHeight: 1.5
                                }}>
                                  {step.instruction}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Chip
                                    icon={<AccessTime />}
                                    label={formatTime(step.duration)}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      color: theme.palette.primary.main,
                                      fontSize: '0.7rem',
                                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                      borderRadius: '6px'
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Paper>
              )}
            </Stack>
          </Grid>

          {/* Right Column Desktop */}
          {!isMobile && (
            <Grid item xs={12} lg={4}>
              <Stack spacing={4}>
                {/* Muscle Groups */}
                {exercise.muscleGroups.length > 0 && (
                  <Paper sx={{ 
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.background.paper, 0.7)
                      : alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        mb: 3
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                        }}>
                          <FitnessCenter />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ 
                            fontWeight: 700,
                            color: theme.palette.text.primary
                          }}>
                            Группы мышц
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 600
                          }}>
                            Активные во время упражнения
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Stack direction="row" flexWrap="wrap" gap={1.5}>
                        {exercise.muscleGroups.map((muscle, index) => (
                          <Chip
                            key={index}
                            label={muscle}
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              py: 1.5,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              borderRadius: '6px'
                            }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Paper>
                )}

                {/* Benefits */}
                <Paper sx={{ 
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mb: 3
                    }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                      }}>
                        <TrendingUp />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          color: theme.palette.text.primary
                        }}>
                          Польза
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 600
                        }}>
                          Преимущества упражнения
                        </Typography>
                      </Box>
                    </Box>
                    
                    <List disablePadding>
                      {exercise.benefits.map((benefit, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 2 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircle sx={{ 
                              color: theme.palette.success.main,
                              fontSize: 24
                            }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={benefit}
                            primaryTypographyProps={{ 
                              variant: 'body1',
                              color: theme.palette.text.primary,
                              fontWeight: 500
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Paper>

                {/* Warnings */}
                {exercise.warnings.length > 0 && (
                  <Paper sx={{ 
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.background.paper, 0.7)
                      : alpha(theme.palette.background.paper, 0.4),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0)} 100%)`
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        mb: 3
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: theme.palette.error.main,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                        }}>
                          <Warning />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ 
                            fontWeight: 700,
                            color: theme.palette.text.primary
                          }}>
                            Внимание
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.error.main,
                            fontWeight: 600
                          }}>
                            Важные предупреждения
                          </Typography>
                        </Box>
                      </Box>
                      
                      <List disablePadding>
                        {exercise.warnings.map((warning, index) => (
                          <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Warning sx={{ 
                                color: theme.palette.error.main,
                                fontSize: 20
                              }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={warning}
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: theme.palette.error.main,
                                fontWeight: 500
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Paper>
                )}

                {/* Progress Stats */}
                <Paper sx={{ 
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      mb: 4,
                      color: theme.palette.text.primary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Psychology sx={{ color: exerciseTypeColor }} />
                      Статистика
                    </Typography>
                    
                    <Stack spacing={3}>
                      {/* Overall Progress */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1" sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 600
                          }}>
                            Общий прогресс
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: exerciseTypeColor,
                            fontWeight: 700
                          }}>
                            {Math.round(progress)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress}
                          sx={{ 
                            height: 10,
                            borderRadius: 5,
                            bgcolor: alpha(exerciseTypeColor, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: exerciseTypeColor,
                              borderRadius: 5,
                              background: `linear-gradient(90deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.8)} 100%)`
                            }
                          }}
                        />
                      </Box>

                      {/* Stats Grid */}
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper sx={{ 
                            p: 2.5,
                            textAlign: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            borderRadius: 2
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                              display: 'block',
                              mb: 1
                            }}>
                              Шагов
                            </Typography>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800,
                              color: theme.palette.primary.main
                            }}>
                              {currentStep + 1}/{exercise.steps.length}
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Paper sx={{ 
                            p: 2.5,
                            textAlign: 'center',
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            borderRadius: 2
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                              display: 'block',
                              mb: 1
                            }}>
                              Время
                            </Typography>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800,
                              color: theme.palette.success.main
                            }}>
                              {exercise.duration}
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Paper sx={{ 
                            p: 2.5,
                            textAlign: 'center',
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            borderRadius: 2
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                              display: 'block',
                              mb: 1
                            }}>
                              Сожжено калорий
                            </Typography>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800,
                              color: theme.palette.error.main
                            }}>
                              {Math.round((currentStep + 1) / exercise.steps.length * exercise.caloriesBurned)}/{exercise.caloriesBurned}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Action Button */}
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => {
                          if (!isPlaying) {
                            togglePlay();
                          }
                        }}
                        disabled={isPlaying}
                        sx={{
                          py: 2,
                          mt: 2,
                          background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.8)} 100%)`,
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#ffffff',
                          '&:disabled': {
                            bgcolor: alpha(theme.palette.text.disabled, 0.5)
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isPlaying ? 'Тренировка идет...' : 'Продолжить тренировку'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Paper>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Mobile Drawers - вызываем функции рендеринга */}
      {renderMobileStepsDrawer()}
      {renderMobileInfoDrawer()}

      {/* Floating Action Button for Desktop */}
      {!isMobile && (
        <Fab
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.8)} 100%)`,
            color: '#ffffff',
            '&:hover': {
              background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.9)} 100%)`
            }
          }}
          onClick={togglePlay}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </Fab>
      )}
    </Box>
  );
};

export default ExerciseDetail;