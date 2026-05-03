import React, { useState, lazy, Suspense, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  NotificationsActive as NotificationsActiveIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewCarousel from '../../components/reviews/ReviewCarousel';
import { useAuthStore } from '../../store/auth';

const WebcamFeed = lazy(() => import('../../components/home/WebcamFeed'));

const COLORS = {
  primary: '#0066FF',
  primaryLight: '#3385FF',
  primaryDark: '#0052CC',
  secondary: '#FF6B35',
  accent: '#00C9A7',
  warning: '#FFC107',
  error: '#FF4444',
  bg: '#FFFFFF',
  bgGradient: 'radial-gradient(ellipse at 20% 30%, #F8F9FF, #FFFFFF)',
  text: '#1A1A1A',
  textLight: '#6B7280',
  border: '#E5E7EB',
};

const WebcamLoader = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 500,
    borderRadius: 4,
    background: `linear-gradient(135deg, ${COLORS.primary}05, ${COLORS.secondary}05)`,
  }}>
    <Stack spacing={3} alignItems="center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </motion.div>
      <Typography sx={{ color: COLORS.textLight, fontWeight: 500 }}>
        Инициализация камеры...
      </Typography>
    </Stack>
  </Box>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const handleStart = useCallback(() => setAnalysisStarted(true), []);
  const handleBack = useCallback(() => setAnalysisStarted(false), []);

  const stats = useMemo(() => [
    { value: '99.9%', label: 'Точность', icon: <VerifiedIcon />, color: COLORS.primary },
    { value: '<0.2с', label: 'Задержка', icon: <SpeedIcon />, color: COLORS.secondary },
  ], []);

  // Полностью удаляем все скроллы кроме body
  useEffect(() => {
    // Сохраняем оригинальные стили
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    
    // Устанавливаем правильные стили
    document.documentElement.style.overflow = 'visible';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'visible';
      root.style.minHeight = '100vh';
    }
    
    return () => {
      // Восстанавливаем стили
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = '';
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = '';
      document.body.style.minHeight = '';
      if (root) {
        root.style.overflow = '';
        root.style.minHeight = '';
      }
    };
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: COLORS.bgGradient,
      position: 'relative',
    }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, position: 'relative', zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {!analysisStarted ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ maxWidth: 900, mx: 'auto', textAlign: 'center', mb: 8 }}>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '3rem', md: '5rem' },
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      mb: 2,
                      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Держите спину<br />прямо с AI
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      color: COLORS.textLight,
                      maxWidth: 550,
                      mx: 'auto',
                      mb: 5,
                      lineHeight: 1.5,
                    }}
                  >
                    Компьютерное зрение анализирует вашу осанку в реальном времени и помогает исправить привычку сутулиться
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    variant="contained"
                    onClick={handleStart}
                    startIcon={<PlayIcon />}
                    sx={{
                      bgcolor: COLORS.primary,
                      px: 5,
                      py: 1.8,
                      borderRadius: 50,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: `0 8px 20px ${COLORS.primary}40`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: COLORS.primaryDark,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 28px ${COLORS.primary}50`,
                      },
                    }}
                  >
                    Начать анализ
                  </Button>
                </motion.div>
              </Box>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={4} 
                  justifyContent="center" 
                  sx={{ mb: 10 }}
                >
                  {stats.map((stat, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2,
                          color: stat.color,
                          bgcolor: `${stat.color}10`,
                        }}>
                          {stat.icon}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.textLight }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </Stack>
                    </motion.div>
                  ))}
                </Stack>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Grid container spacing={4}>
                  {[
                    { icon: <TimelineIcon />, title: '33 точки отслеживания', desc: 'Локализуем проблему с точностью до миллиметра', color: '#0066FF' },
                    { icon: <SpeedIcon />, title: 'Реальное время', desc: 'Мгновенная реакция на изменение позы', color: '#FF6B35' },
                    { icon: <NotificationsActiveIcon />, title: 'Умные напоминания', desc: 'Не дадим вам забыть о правильной осанке', color: '#00C9A7' },
                  ].map((item, i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Box sx={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${item.color}20, ${item.color}05)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            color: item.color,
                          }}>
                            {item.icon}
                          </Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', mb: 1 }}>
                            {item.title}
                          </Typography>
                          <Typography sx={{ color: COLORS.textLight, lineHeight: 1.5 }}>
                            {item.desc}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>

              <Box sx={{ mt: 12 }}>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>
                    Что говорят
                  </Typography>
                  <Typography sx={{ textAlign: 'center', color: COLORS.textLight, mb: 6, fontSize: '1.1rem' }}>
                    Присоединяйтесь к сообществу
                  </Typography>

                  <ReviewCarousel
                    limit={5}
                    autoPlay
                    showControls
                    onReviewClick={() => navigate('/reviews')}
                  />

                  <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 5, mb: 4 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/reviews')}
                      sx={{
                        borderColor: COLORS.border,
                        color: COLORS.text,
                        borderRadius: 50,
                        px: 3,
                        textTransform: 'none',
                        '&:hover': { borderColor: COLORS.primary, bgcolor: 'transparent' },
                      }}
                    >
                      Все отзывы
                    </Button>
                    {user && (
                      <Button
                        variant="contained"
                        onClick={() => navigate('/reviews')}
                        sx={{
                          bgcolor: COLORS.primary,
                          borderRadius: 50,
                          px: 3,
                          textTransform: 'none',
                          '&:hover': { bgcolor: COLORS.primaryDark },
                        }}
                      >
                        Написать отзыв
                      </Button>
                    )}
                  </Stack>
                </motion.div>
              </Box>
            </motion.div>
          ) : (
            <motion.div 
              key="analysis" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ 
                      color: COLORS.textLight,
                      borderRadius: 50,
                      textTransform: 'none',
                      '&:hover': { bgcolor: `${COLORS.primary}10` }
                    }}
                  >
                    На главную
                  </Button>
                </Stack>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: COLORS.accent,
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.5, transform: 'scale(1.2)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    }
                  }} />
                  <Typography variant="body2" sx={{ color: COLORS.textLight, fontWeight: 500 }}>
                    Активный мониторинг
                  </Typography>
                </Stack>
              </Stack>

              <Suspense fallback={<WebcamLoader />}>
                <WebcamFeed />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default Home;