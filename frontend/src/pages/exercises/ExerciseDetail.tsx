import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Pause,
  RestartAlt,
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
  Sports,
  HealthAndSafety,
  FormatListNumbered,
  Speed,
  Favorite,
  Bolt,
  Replay,
  Share,
  Bookmark,
  BookmarkBorder,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Info,
  TrendingFlat,
  Science,
  Psychology,
  Spa,
  Thermostat,
  FlashOn,
  DirectionsRun
} from '@mui/icons-material';
import { motion } from 'framer-motion';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchExercise(id);
    }
  }, [id]);

  const fetchExercise = async (exerciseId: string) => {
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
        steps: Array.isArray(exerciseData.instructions) ? exerciseData.instructions.map((instruction: string, index: number) => ({
          instruction: instruction || `Шаг ${index + 1}`,
          duration: 5000,
          tip: (exerciseData.warnings && exerciseData.warnings[index]) 
            ? exerciseData.warnings[index] 
            : 'Выполняйте упражнение плавно и без резких движений'
        })) : [
          {
            instruction: 'Начните выполнение упражнения',
            duration: 5000,
            tip: 'Выполняйте упражнение плавно и без резких движений'
          }
        ],
        benefits: exerciseData.benefits || [],
        warnings: exerciseData.warnings || [],
        has3dModel: exerciseData.has3dModel || false,
        caloriesBurned: exerciseData.caloriesBurned || 0,
        muscleGroups: exerciseData.muscleGroups || [],
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
  };

  useEffect(() => {
    if (!isPlaying || !exercise) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          const nextStep = (currentStep + 1) % exercise.steps.length;
          setCurrentStep(nextStep);
          const newTime = exercise.steps[nextStep].duration;
          setProgress(((nextStep + 1) / exercise.steps.length) * 100);
          return newTime;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, exercise]);

  const handleStepClick = (stepIndex: number) => {
    if (!exercise) return;
    
    setCurrentStep(stepIndex);
    setIsPlaying(false);
    setTimeRemaining(exercise.steps[stepIndex].duration);
    setProgress(((stepIndex + 1) / exercise.steps.length) * 100);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return seconds.toString().padStart(2, '0');
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetExercise = () => {
    if (!exercise) return;
    
    setIsPlaying(false);
    setCurrentStep(0);
    setTimeRemaining(exercise.steps[0].duration);
    setProgress(0);
  };

  const nextStep = () => {
    if (!exercise) return;
    
    const next = (currentStep + 1) % exercise.steps.length;
    handleStepClick(next);
  };

  const prevStep = () => {
    if (!exercise) return;
    
    const prev = currentStep > 0 ? currentStep - 1 : exercise.steps.length - 1;
    handleStepClick(prev);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'начальный': return theme.palette.success.main;
      case 'средний': return theme.palette.warning.main;
      case 'продвинутый': return theme.palette.error.main;
      default: return theme.palette.primary.main;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stretching': return theme.palette.secondary.main;
      case 'strength': return theme.palette.primary.main;
      case 'cardio': return theme.palette.error.main;
      case 'core': return theme.palette.success.main;
      case 'yoga': return theme.palette.secondary.main;
      default: return theme.palette.primary.main;
    }
  };

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
          <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" color={theme.palette.text.secondary}>
            Загрузка упражнения...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!exercise) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'light' 
                  ? alpha(theme.palette.background.paper, 0.7)
                  : alpha(theme.palette.background.paper, 0.4),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Warning sx={{ fontSize: 64, color: theme.palette.error.main, mb: 3 }} />
              <Typography variant="h3" sx={{ 
                fontWeight: 800,
                mb: 2,
                color: theme.palette.text.primary
              }}>
                Упражнение не найдено
              </Typography>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                Возможно, упражнение было удалено или перемещено
              </Typography>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/exercises')}
                variant="contained"
                sx={{
                  px: 6,
                  py: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  borderRadius: 3,
                  fontWeight: 700,
                  color: '#ffffff',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Вернуться к упражнениям
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  const currentStepData = exercise.steps[currentStep];
  const stepProgress = ((currentStepData.duration - timeRemaining) / currentStepData.duration) * 100;
  const exerciseTypeColor = getTypeColor(exercise.type);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 6 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/exercises')}
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }
                }}
              >
                Назад
              </Button>

              <Stack direction="row" spacing={2}>
                <Tooltip title="Добавить в избранное">
                  <IconButton
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    sx={{ 
                      bgcolor: theme.palette.mode === 'light' 
                        ? theme.palette.background.paper
                        : alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.1)
                      }
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
                    sx={{ 
                      bgcolor: theme.palette.mode === 'light' 
                        ? theme.palette.background.paper
                        : alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <Share sx={{ color: theme.palette.text.secondary }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Chip
                  label={exercise.difficulty}
                  sx={{ 
                    bgcolor: getDifficultyColor(exercise.difficulty),
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderRadius: '6px'
                  }}
                />
                
                {exercise.has3dModel && (
                  <Chip
                    icon={<ModelTraining />}
                    label="3D ГИД"
                    sx={{ 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
                    }}
                  />
                )}
                
                <Chip
                  icon={<LocalFireDepartment />}
                  label={`${exercise.caloriesBurned} ккал`}
                  sx={{ 
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                  }}
                />
                
                <Chip
                  icon={<Timer />}
                  label={exercise.duration}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                />
              </Stack>

              <Typography variant="h1" sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 800,
                mb: 2,
                lineHeight: 1.1,
                color: theme.palette.text.primary
              }}>
                {exercise.title}
              </Typography>
              
              <Typography variant="h6" sx={{ 
                color: theme.palette.text.secondary,
                maxWidth: 800,
                lineHeight: 1.6,
                fontWeight: 400
              }}>
                {exercise.description}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {[
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
              ].map((stat, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Paper sx={{ 
                      p: 3,
                      bgcolor: theme.palette.mode === 'light' 
                        ? alpha(theme.palette.background.paper, 0.7)
                        : alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: stat.color,
                        transform: 'translateY(-4px)'
                      }
                    }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
                          color: 'white'
                        }}>
                          {stat.icon}
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                            display: 'block'
                          }}>
                            {stat.label}
                          </Typography>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 800,
                            color: theme.palette.text.primary
                          }}>
                            {stat.value}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Left Column - Player */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={4}>
              {/* 3D Player */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Paper sx={{ 
                  bgcolor: theme.palette.mode === 'light' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : alpha(theme.palette.background.paper, 0.4),
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  position: 'relative'
                }}>
                  {/* Player Header */}
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
                      <Tooltip title={isMuted ? "Включить звук" : "Выключить звук"}>
                        <IconButton
                          onClick={() => setIsMuted(!isMuted)}
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
                          {isMuted ? <VolumeOff /> : <VolumeUp />}
                        </IconButton>
                      </Tooltip>
                      
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

                  {/* 3D Viewer */}
                  <Box sx={{ 
                    height: 500,
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
                          fontSize: 80, 
                          mb: 3, 
                          color: alpha(theme.palette.text.disabled, 0.5)
                        }} />
                        <Typography variant="h5" sx={{ 
                          color: theme.palette.text.disabled,
                          mb: 2,
                          fontWeight: 700
                        }}>
                          3D модель не настроена
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.disabled,
                          textAlign: 'center'
                        }}>
                          Используйте видеогид для правильного выполнения упражнения
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Timer Overlay */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Paper sx={{ 
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        bgcolor: theme.palette.mode === 'light' 
                          ? alpha(theme.palette.background.paper, 0.95)
                          : alpha(theme.palette.background.paper, 0.9),
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        p: 3,
                        minWidth: 140,
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          letterSpacing: 1
                        }}>
                          ТАЙМЕР
                        </Typography>
                        <Typography variant="h1" sx={{ 
                          fontWeight: 900,
                          fontSize: '3.5rem',
                          lineHeight: 1,
                          mb: 1,
                          color: exerciseTypeColor
                        }}>
                          {formatTime(timeRemaining)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 600
                        }}>
                          Шаг {currentStep + 1} из {exercise.steps.length}
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Box>
                </Paper>
              </motion.div>

              {/* Current Step Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
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
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      mb: 4 
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 800,
                          mb: 2,
                          color: theme.palette.text.primary
                        }}>
                          <Box component="span" sx={{ color: exerciseTypeColor }}>
                            Шаг {currentStep + 1}.
                          </Box> {currentStepData.instruction}
                        </Typography>
                        
                        <Paper sx={{ 
                          p: 3,
                          mb: 3,
                          bgcolor: alpha(exerciseTypeColor, 0.1),
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Info sx={{ color: exerciseTypeColor }} />
                            <Typography variant="body2" sx={{ 
                              color: theme.palette.text.primary,
                              fontStyle: 'italic'
                            }}>
                              💡 {currentStepData.tip}
                            </Typography>
                          </Box>
                        </Paper>
                      </Box>
                      
                      <Badge
                        badgeContent={formatTime(currentStepData.duration)}
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: exerciseTypeColor,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            minWidth: 60,
                            height: 32,
                            borderRadius: '6px'
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          bgcolor: alpha(exerciseTypeColor, 0.1),
                          border: `2px solid ${alpha(exerciseTypeColor, 0.3)}`,
                          ml: 2
                        }}>
                          <Timer sx={{ color: exerciseTypeColor, fontSize: 32 }} />
                        </Box>
                      </Badge>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 2 
                      }}>
                        <Typography variant="body1" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 600
                        }}>
                          Прогресс шага
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          color: exerciseTypeColor,
                          fontWeight: 700
                        }}>
                          {Math.round(stepProgress)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stepProgress}
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

                    {/* Control Buttons */}
                    <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
                      <Tooltip title="Предыдущий шаг">
                        <IconButton
                          onClick={prevStep}
                          sx={{ 
                            width: 64,
                            height: 64,
                            bgcolor: theme.palette.mode === 'light' 
                              ? theme.palette.background.paper
                              : alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            '&:hover': { 
                              bgcolor: alpha(exerciseTypeColor, 0.1),
                              borderColor: exerciseTypeColor,
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <SkipPrevious sx={{ fontSize: 32 }} />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={isPlaying ? "Пауза" : "Старт"}>
                        <IconButton
                          onClick={togglePlay}
                          sx={{ 
                            width: 80,
                            height: 80,
                            background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.8)} 100%)`,
                            color: '#ffffff',
                            '&:hover': { 
                              background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.9)} 100%)`,
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.3s ease',
                            boxShadow: `0 8px 32px ${alpha(exerciseTypeColor, 0.4)}`
                          }}
                        >
                          {isPlaying ? (
                            <Pause sx={{ fontSize: 40 }} />
                          ) : (
                            <PlayArrow sx={{ fontSize: 40 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Следующий шаг">
                        <IconButton
                          onClick={nextStep}
                          sx={{ 
                            width: 64,
                            height: 64,
                            bgcolor: theme.palette.mode === 'light' 
                              ? theme.palette.background.paper
                              : alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            '&:hover': { 
                              bgcolor: alpha(exerciseTypeColor, 0.1),
                              borderColor: exerciseTypeColor,
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <SkipNext sx={{ fontSize: 32 }} />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Сбросить">
                        <IconButton
                          onClick={resetExercise}
                          sx={{ 
                            width: 64,
                            height: 64,
                            bgcolor: theme.palette.mode === 'light' 
                              ? theme.palette.background.paper
                              : alpha(theme.palette.background.paper, 0.6),
                            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                            color: theme.palette.error.main,
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Replay sx={{ fontSize: 32 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Paper>
              </motion.div>

              {/* All Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
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
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
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
                                overflow: 'hidden',
                                '&:hover': {
                                  borderColor: exerciseTypeColor,
                                  bgcolor: alpha(exerciseTypeColor, 0.1),
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 12px 24px ${alpha(exerciseTypeColor, 0.2)}`
                                }
                              }}
                            >
                              {/* Step Status Indicator */}
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
                                  
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2 
                                  }}>
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
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Paper>
              </motion.div>
            </Stack>
          </Grid>

          {/* Right Column - Info Panel */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={4}>
              {/* Muscle Groups */}
              {exercise.muscleGroups.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
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
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Chip
                              label={muscle}
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                py: 1.5,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                borderRadius: '6px',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.2)
                                }
                              }}
                            />
                          </motion.div>
                        ))}
                      </Stack>
                    </CardContent>
                  </Paper>
                </motion.div>
              )}

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
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
              </motion.div>

              {/* Warnings */}
              {exercise.warnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
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
                </motion.div>
              )}

              {/* Progress Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
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
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          mb: 2 
                        }}>
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
                          '&:hover': {
                            background: `linear-gradient(135deg, ${exerciseTypeColor} 0%, ${alpha(exerciseTypeColor, 0.9)} 100%)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 24px ${alpha(exerciseTypeColor, 0.3)}`
                          },
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
              </motion.div>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Buttons */}
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
    </Box>
  );
};

export default ExerciseDetail;