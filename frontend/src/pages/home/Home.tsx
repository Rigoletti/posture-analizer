import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  Divider,
  alpha,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  FiberManualRecord as RecordIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  NotificationsActive as NotificationsIcon
} from '@mui/icons-material';
import WebcamFeed from '../../components/home/WebcamFeed';
import ReviewCarousel from '../../components/reviews/ReviewCarousel';
import { useAuthStore } from '../../store/auth';

const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      number: '01',
      title: 'Распознавание позы',
      description: 'AI определяет ключевые точки тела и положение позвоночника',
      icon: TimelineIcon
    },
    {
      number: '02',
      title: 'Анализ осанки',
      description: 'Сравнение вашей позы с идеальной осанкой в реальном времени',
      icon: SpeedIcon
    },
    {
      number: '03',
      title: 'Мгновенные уведомления',
      description: 'Оповещения при обнаружении нарушений прямо во время работы',
      icon: NotificationsIcon
    }
  ];

  const handleStartAnalysis = () => {
    setAnalysisStarted(true);
  };

  const handleBack = () => {
    setAnalysisStarted(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Фоновые элементы */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0)} 70%)`,
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -200,
        left: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0)} 70%)`,
        zIndex: 0
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {!analysisStarted ? (
          <Box sx={{ py: { xs: 4, md: 8 } }}>
            <Fade in timeout={800}>
              <Grid container spacing={6} alignItems="center">
                {/* Левая колонка - заголовок */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography
                        variant="h1"
                        sx={{
                          fontWeight: 800,
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: { xs: '2.5rem', md: '3.5rem' },
                          lineHeight: 1.1,
                          mb: 1
                        }}
                      >
                        Осанка
                        <Box
                          component="span"
                          sx={{
                            color: theme.palette.primary.main,
                            display: 'block'
                          }}
                        >
                          под контролем
                        </Box>
                      </Typography>
                      <Typography
                        sx={{
                          color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                          fontSize: '1.125rem',
                          lineHeight: 1.6,
                          maxWidth: '90%'
                        }}
                      >
                        AI-анализ вашей позы в реальном времени с мгновенными оповещениями о нарушениях
                      </Typography>
                    </Box>

                    {/* Статистика */}
                    <Stack 
                      direction="row" 
                      spacing={3}
                      divider={<Divider orientation="vertical" flexItem sx={{ 
                        bgcolor: theme.palette.mode === 'light' ? '#e2e8f0' : '#334155' 
                      }} />}
                    >
                      <Box>
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '2rem', 
                          fontWeight: 700,
                          lineHeight: 1
                        }}>
                          99.9%
                        </Typography>
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                          fontSize: '0.875rem'
                        }}>
                          точность
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                          fontSize: '2rem', 
                          fontWeight: 700,
                          lineHeight: 1
                        }}>
                          0.2с
                        </Typography>
                        <Typography sx={{ 
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                          fontSize: '0.875rem'
                        }}>
                          задержка
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Кнопка начала анализа */}
                    <Zoom in timeout={1000}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleStartAnalysis}
                        startIcon={<RecordIcon />}
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          fontWeight: 600,
                          px: 6,
                          py: 1.8,
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          maxWidth: 280,
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[10]
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        Начать анализ
                      </Button>
                    </Zoom>
                  </Stack>
                </Grid>

                {/* Правая колонка - как это работает */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: theme.palette.mode === 'light' 
                        ? alpha(theme.palette.background.paper, 0.7)
                        : alpha(theme.palette.background.paper, 0.4),
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.palette.mode === 'light' 
                        ? 'rgba(0, 0, 0, 0.1)' 
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: 3,
                      p: 4,
                      height: '100%'
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '2rem',
                        mb: 4
                      }}
                    >
                      Как это работает
                    </Typography>

                    <Stack spacing={3}>
                      {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <Box
                            key={index}
                            onMouseEnter={() => setHoveredStep(index)}
                            onMouseLeave={() => setHoveredStep(null)}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              bgcolor: hoveredStep === index 
                                ? alpha(theme.palette.primary.main, 0.1) 
                                : 'transparent',
                              border: '1px solid',
                              borderColor: hoveredStep === index 
                                ? theme.palette.primary.main 
                                : theme.palette.divider,
                              transition: 'all 0.3s',
                              cursor: 'pointer'
                            }}
                          >
                            <Stack direction="row" spacing={3} alignItems="flex-start">
                              <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                bgcolor: hoveredStep === index 
                                  ? theme.palette.primary.main 
                                  : theme.palette.mode === 'light' 
                                    ? '#e2e8f0' 
                                    : '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s'
                              }}>
                                <Icon sx={{
                                  color: hoveredStep === index 
                                    ? '#ffffff' 
                                    : theme.palette.mode === 'light'
                                      ? '#64748b'
                                      : '#94a3b8'
                                }} />
                              </Box>
                              <Box>
                                <Typography sx={{
                                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                  fontWeight: 600,
                                  fontSize: '1.125rem',
                                  mb: 1
                                }}>
                                  {step.title}
                                </Typography>
                                <Typography sx={{
                                  color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                  fontSize: '0.95rem',
                                  lineHeight: 1.5
                                }}>
                                  {step.description}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Fade>

            {/* Блок отзывов */}
            <Box sx={{ mt: 8, mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                  textAlign: 'center',
                  mb: 6,
                  fontWeight: 700
                }}
              >
                Что говорят пользователи
              </Typography>
              
              <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <ReviewCarousel 
                  limit={5}
                  autoPlay={true}
                  showControls={true}
                  onReviewClick={(review) => {
                    navigate('/reviews');
                  }}
                />
              </Box>
              
              <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/reviews')}
                  sx={{
                    color: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  Все отзывы
                </Button>
                {user && (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/reviews')}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark
                      }
                    }}
                  >
                    Оставить отзыв
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        ) : (
          // Режим анализа
          <Box sx={{ py: 4 }}>
            {/* Навигация */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              alignItems={{ xs: 'flex-start', sm: 'center' }} 
              spacing={2} 
              sx={{ mb: 4 }}
            >
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  '&:hover': {
                    color: theme.palette.text.primary,
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  },
                  px: 2,
                  py: 1,
                  borderRadius: 2
                }}
              >
                Назад
              </Button>
              
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700
                  }}
                >
                  Анализ осанки
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.success.main
                  }}>
                    <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography sx={{ 
                      fontSize: '0.875rem', 
                      color: theme.palette.text.secondary 
                    }}>
                      Активный мониторинг
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.palette.success.main,
                    animation: 'pulse 1.5s infinite'
                  }} />
                </Stack>
              </Box>
            </Stack>

            {/* Webcam компонент */}
            <WebcamFeed />
          </Box>
        )}
      </Container>

      {/* Стили для анимации */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default Home;