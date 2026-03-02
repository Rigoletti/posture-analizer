import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  Alert,
  LinearProgress,
  IconButton,
  Collapse,
  alpha,
  useTheme,
  Paper,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Warning,
  CheckCircle,
  Error,
  AccessTime,
  TrendingUp,
  OpenInNew,
  Whatshot,
  Timer,
  Spa,
  LocalFireDepartment,
  Description,
  Info,
  FitnessCenter,
  Star
} from '@mui/icons-material';
import { sessionsApi } from '../../api/sessions';
import { useNavigate } from 'react-router-dom';

interface SessionRecommendationsProps {
  sessionId: string;
  compact?: boolean;
}

interface Recommendation {
  _id?: string;
  problemType: string;
  problemSeverity: 'low' | 'medium' | 'high';
  problemPercentage?: number;
  exercise: {
    _id: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    duration: number;
    instructions: string[];
    benefits: string[];
    has3dModel?: boolean;
    modelType?: string;
    videoUrl?: string;
    imageUrl?: string;
    muscleGroups?: string[];
    caloriesBurned?: number;
  };
  recommendation: string;
  priority: number;
}

const SessionRecommendations: React.FC<SessionRecommendationsProps> = ({ 
  sessionId, 
  compact = false 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProblems, setExpandedProblems] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalProblems: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0
  });

  useEffect(() => {
    loadRecommendations();
  }, [sessionId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionsApi.getSessionRecommendations(sessionId);
      setRecommendations(response.data.recommendations);
      
      // Calculate stats
      const stats = {
        totalProblems: response.data.problems?.length || 0,
        highSeverity: response.data.problems?.filter((p: any) => p.severity === 'high').length || 0,
        mediumSeverity: response.data.problems?.filter((p: any) => p.severity === 'medium').length || 0,
        lowSeverity: response.data.problems?.filter((p: any) => p.severity === 'low').length || 0
      };
      setStats(stats);
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError(err.message || 'Ошибка при загрузке рекомендаций');
    } finally {
      setLoading(false);
    }
  };

  const getProblemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'shoulders': 'Проблемы с плечами',
      'head': 'Проблемы с положением головы',
      'hips': 'Проблемы с положением таза',
      'general_posture': 'Общие проблемы с осанкой',
      'balance': 'Нарушение баланса',
      'flexibility': 'Недостаточная гибкость'
    };
    return labels[type] || type;
  };

  const getProblemTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'shoulders': '👥',
      'head': '🧠',
      'hips': '🦵',
      'general_posture': '🚶',
      'balance': '⚖️',
      'flexibility': '🤸'
    };
    return icons[type] || '💡';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <Error />;
      case 'medium': return <Warning />;
      case 'low': return <CheckCircle />;
      default: return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начальный';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return difficulty;
    }
  };

  const getExerciseTypeIcon = (type: string) => {
    switch (type) {
      case 'stretching': return '🧘';
      case 'strength': return '💪';
      case 'cardio': return '🏃';
      case 'posture': return '🚶';
      case 'flexibility': return '🤸';
      default: return '🏋️';
    }
  };

  const toggleProblemExpansion = (problemType: string) => {
    if (expandedProblems.includes(problemType)) {
      setExpandedProblems(expandedProblems.filter(p => p !== problemType));
    } else {
      setExpandedProblems([...expandedProblems, problemType]);
    }
  };

  const handleStartExercise = (exerciseId: string) => {
    navigate(`/exercises/${exerciseId}`);
  };

  const handleViewExercise = (exerciseId: string) => {
    navigate(`/exercises/${exerciseId}`);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <LinearProgress sx={{ width: '100%', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Анализируем вашу осанку...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha(theme.palette.success.main, 0.05),
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
      }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 40 }} />
            <Box>
              <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                Отличная новость!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ваша осанка в хорошем состоянии. Продолжайте заниматься профилактикой.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Группируем рекомендации по типу проблемы
  const groupedRecommendations: Record<string, Recommendation[]> = {};
  recommendations.forEach(rec => {
    if (!groupedRecommendations[rec.problemType]) {
      groupedRecommendations[rec.problemType] = [];
    }
    groupedRecommendations[rec.problemType].push(rec);
  });

  if (compact) {
    return (
      <Card sx={{ 
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            💪 Рекомендованные упражнения
          </Typography>
          <Stack spacing={2}>
            {Object.entries(groupedRecommendations).slice(0, 2).map(([problemType, recs]) => (
              <Box key={problemType}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1,
                  color: getSeverityColor(recs[0].problemSeverity),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  {getSeverityIcon(recs[0].problemSeverity)}
                  {getProblemTypeLabel(problemType)}
                </Typography>
                <Stack spacing={1}>
                  {recs.slice(0, 1).map((rec, idx) => (
                    <Paper
                      key={idx}
                      sx={{
                        p: 1.5,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        borderRadius: 1
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {rec.exercise.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${rec.exercise.duration} мин`}
                            size="small"
                            variant="outlined"
                            icon={<AccessTime />}
                            sx={{ height: 24, fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={getDifficultyLabel(rec.exercise.difficulty)}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              height: 24, 
                              fontSize: '0.7rem',
                              color: getDifficultyColor(rec.exercise.difficulty),
                              borderColor: alpha(getDifficultyColor(rec.exercise.difficulty), 0.3)
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate(`/sessions/${sessionId}`)}
            sx={{ mt: 2 }}
            startIcon={<OpenInNew />}
          >
            Все рекомендации
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Статистика проблем */}
      <Card sx={{ mb: 3, bgcolor: theme.palette.background.paper }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            📊 Обнаруженные проблемы
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                <Typography variant="h4" sx={{ color: theme.palette.info.main, fontWeight: 800 }}>
                  {stats.totalProblems}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Всего проблем
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.05),
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
              }}>
                <Typography variant="h4" sx={{ color: theme.palette.error.main, fontWeight: 800 }}>
                  {stats.highSeverity}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Высокая важность
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
              }}>
                <Typography variant="h4" sx={{ color: theme.palette.warning.main, fontWeight: 800 }}>
                  {stats.mediumSeverity}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Средняя важность
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
              }}>
                <Typography variant="h4" sx={{ color: theme.palette.success.main, fontWeight: 800 }}>
                  {stats.lowSeverity}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Низкая важность
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ 
        fontWeight: 700,
        mb: 3,
        color: theme.palette.text.primary
      }}>
        🎯 Персональные рекомендации
      </Typography>
      
      <Stack spacing={3}>
        {Object.entries(groupedRecommendations).map(([problemType, recs]) => {
          const isExpanded = expandedProblems.includes(problemType);
          const severity = recs[0].problemSeverity;
          const severityColor = getSeverityColor(severity);
          const severityIcon = getSeverityIcon(severity);
          const problemIcon = getProblemTypeIcon(problemType);
          
          return (
            <Card key={problemType} sx={{ 
              border: `1px solid ${alpha(severityColor, 0.2)}`,
              bgcolor: alpha(severityColor, 0.03),
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 0 }}>
                {/* Заголовок проблемы */}
                <Box 
                  sx={{ 
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(severityColor, 0.05)
                    }
                  }}
                  onClick={() => toggleProblemExpansion(problemType)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ 
                        bgcolor: alpha(severityColor, 0.1),
                        color: severityColor,
                        width: 44,
                        height: 44
                      }}>
                        <Typography variant="h5">
                          {problemIcon}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: severityColor,
                          fontWeight: 600
                        }}>
                          {getProblemTypeLabel(problemType)}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            icon={severityIcon}
                            label={severity === 'high' ? 'Высокая важность' : 
                                   severity === 'medium' ? 'Средняя важность' : 'Низкая важность'}
                            size="small"
                            sx={{
                              bgcolor: alpha(severityColor, 0.2),
                              color: severityColor,
                              fontWeight: 500,
                              height: 24
                            }}
                          />
                          {recs[0].problemPercentage && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {recs[0].problemPercentage.toFixed(1)}% времени сеанса
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                    
                    <IconButton size="small" sx={{ color: severityColor }}>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Stack>
                </Box>

                {/* Описание проблемы */}
                <Collapse in={isExpanded}>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Paper sx={{ 
                      p: 2, 
                      mb: 2,
                      bgcolor: alpha(severityColor, 0.02),
                      border: `1px solid ${alpha(severityColor, 0.1)}`
                    }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Info sx={{ color: severityColor, mt: 0.5, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">
                          {problemType === 'shoulders' && 'Сгорбленные или поднятые плечи могут вызывать напряжение в шее и спине, что приводит к головным болям и хроническим болям.'}
                          {problemType === 'head' && 'Наклон головы вперед увеличивает нагрузку на шейный отдел позвоночника в 4-5 раз, что может привести к раннему износу позвонков.'}
                          {problemType === 'hips' && 'Неправильное положение таза может привести к болям в пояснице, нарушению кровообращения и проблемам с осанкой.'}
                          {problemType === 'general_posture' && 'Общие проблемы с осанкой требуют регулярных корректирующих упражнений для укрепления мышц кора и спины.'}
                          {problemType === 'balance' && 'Нарушение баланса может указывать на слабость мышц кора и проблемы с координацией.'}
                          {problemType === 'flexibility' && 'Недостаточная гибкость ограничивает диапазон движений и может привести к травмам.'}
                        </Typography>
                      </Stack>
                    </Paper>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Упражнения */}
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                      Рекомендованные упражнения ({recs.length}):
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {recs.map((rec, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper sx={{ 
                            p: 2,
                            height: '100%',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s ease'
                            }
                          }}>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                  {rec.exercise.title}
                                </Typography>
                                {rec.priority >= 8 && (
                                  <Tooltip title="Высокий приоритет">
                                    <Star sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                                  </Tooltip>
                                )}
                              </Stack>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {rec.exercise.description}
                              </Typography>
                              
                              <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                <Chip
                                  icon={<AccessTime />}
                                  label={`${rec.exercise.duration} мин`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                                <Chip
                                  label={getDifficultyLabel(rec.exercise.difficulty)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    height: 24,
                                    color: getDifficultyColor(rec.exercise.difficulty),
                                    borderColor: alpha(getDifficultyColor(rec.exercise.difficulty), 0.3)
                                  }}
                                />
                                <Chip
                                  label={rec.exercise.type === 'stretching' ? 'Растяжка' :
                                         rec.exercise.type === 'strength' ? 'Силовое' :
                                         rec.exercise.type === 'cardio' ? 'Кардио' : rec.exercise.type}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                                {rec.exercise.caloriesBurned && rec.exercise.caloriesBurned > 0 && (
                                  <Chip
                                    icon={<LocalFireDepartment />}
                                    label={`${rec.exercise.caloriesBurned} ккал`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 24 }}
                                  />
                                )}
                              </Stack>
                              
                              {/* Преимущества */}
                              {rec.exercise.benefits && rec.exercise.benefits.length > 0 && (
                                <Box>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontWeight: 600,
                                    display: 'block',
                                    mb: 0.5
                                  }}>
                                    Преимущества:
                                  </Typography>
                                  <Stack spacing={0.5}>
                                    {rec.exercise.benefits.slice(0, 2).map((benefit, i) => (
                                      <Typography key={i} variant="caption" sx={{ 
                                        color: theme.palette.text.secondary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                      }}>
                                        <CheckCircle sx={{ fontSize: 12, color: theme.palette.success.main }} />
                                        {benefit}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                              
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Button
                                  startIcon={<PlayArrow />}
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleStartExercise(rec.exercise._id)}
                                  sx={{ flexGrow: 1 }}
                                >
                                  Начать упражнение
                                </Button>
                                <Button
                                  startIcon={<OpenInNew />}
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleViewExercise(rec.exercise._id)}
                                >
                                  Подробнее
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
      
      {/* Общие советы */}
      <Card sx={{ mt: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ 
            color: theme.palette.info.main,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <TrendingUp sx={{ color: theme.palette.info.main }} />
            💡 Общие рекомендации
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2,
                height: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Timer sx={{ color: theme.palette.info.main, mt: 0.5, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Регулярность занятий
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Выполняйте упражнения минимум 3 раза в неделю по 15-20 минут для достижения устойчивых результатов.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2,
                height: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <AccessTime sx={{ color: theme.palette.info.main, mt: 0.5, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Перерывы в работе
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Делайте перерывы каждые 30-40 минут при сидячей работе. Вставайте, потягивайтесь и меняйте положение тела.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2,
                height: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Spa sx={{ color: theme.palette.info.main, mt: 0.5, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Правильная осанка
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Следите за положением спины, плеч и головы в течение дня. Используйте эргономичную мебель.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2,
                height: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Whatshot sx={{ color: theme.palette.info.main, mt: 0.5, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Питание и гидратация
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Пейте достаточное количество воды и питайтесь сбалансированно для поддержания здоровья мышц и суставов.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SessionRecommendations;