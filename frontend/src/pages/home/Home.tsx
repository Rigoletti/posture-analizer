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
  useMediaQuery,
  useTheme,
  IconButton,
  Paper,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  NotificationsActive as NotificationsActiveIcon,
  Verified as VerifiedIcon,
  Menu as MenuIcon,
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
    minHeight: { xs: 300, sm: 500 },
    borderRadius: { xs: 2, sm: 4 },
    background: `linear-gradient(135deg, ${COLORS.primary}05, ${COLORS.secondary}05)`,
    p: { xs: 2, sm: 3 },
  }}>
    <Stack spacing={3} alignItems="center">
      <CircularProgress size={{ xs: 40, sm: 48 }} sx={{ color: COLORS.primary }} />
      <Typography sx={{ color: COLORS.textLight, fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
        Инициализация камеры...
      </Typography>
    </Stack>
  </Box>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const handleStart = useCallback(() => setAnalysisStarted(true), []);
  const handleBack = useCallback(() => setAnalysisStarted(false), []);

  const stats = useMemo(() => [
    { value: '99.9%', label: 'Точность', icon: <VerifiedIcon />, color: COLORS.primary },
    { value: '<0.2с', label: 'Задержка', icon: <SpeedIcon />, color: COLORS.secondary },
  ], []);

  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    
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
      overflowX: 'hidden',
    }}>

      {/* Мобильное меню */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItem component="button" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
              <ListItemText primary="Главная" />
            </ListItem>
            <ListItem component="button" onClick={() => { navigate('/about'); setMobileMenuOpen(false); }}>
              <ListItemText primary="О нас" />
            </ListItem>
            <ListItem component="button" onClick={() => { navigate('/reviews'); setMobileMenuOpen(false); }}>
              <ListItemText primary="Отзывы" />
            </ListItem>
            {user ? (
              <ListItem component="button" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                <ListItemText primary="Профиль" />
              </ListItem>
            ) : (
              <>
                <ListItem component="button" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                  <ListItemText primary="Войти" />
                </ListItem>
                <ListItem component="button" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>
                  <ListItemText primary="Регистрация" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 5 },
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative', 
          zIndex: 2 
        }}
      >
        <AnimatePresence mode="wait">
          {!analysisStarted ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6, md: 8 } }}>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '2rem', sm: '3rem', md: '5rem' },
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.2,
                      mb: { xs: 1, sm: 2 },
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
                      fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                      color: COLORS.textLight,
                      maxWidth: 550,
                      mx: 'auto',
                      mb: { xs: 3, sm: 4, md: 5 },
                      lineHeight: 1.5,
                      px: { xs: 2, sm: 0 },
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
                    startIcon={!isMobile && <PlayIcon />}
                    fullWidth={isMobile}
                    sx={{
                      bgcolor: COLORS.primary,
                      px: { xs: 3, sm: 4, md: 5 },
                      py: { xs: 1.5, sm: 1.8 },
                      borderRadius: 50,
                      textTransform: 'none',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      fontWeight: 600,
                      boxShadow: `0 8px 20px ${COLORS.primary}40`,
                      maxWidth: { xs: '100%', sm: 300 },
                      '&:hover': {
                        bgcolor: COLORS.primaryDark,
                        transform: isMobile ? 'none' : 'translateY(-2px)',
                      },
                    }}
                  >
                    {isMobile ? 'Начать анализ' : 'Начать анализ'}
                  </Button>
                </motion.div>
              </Box>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={{ xs: 2, sm: 3, md: 4 }} 
                  justifyContent="center" 
                  alignItems="stretch"
                  sx={{ mb: { xs: 6, sm: 8, md: 10 } }}
                >
                  {stats.map((stat, i) => (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 1.5 },
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${COLORS.border}`,
                        flex: 1,
                      }}
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
                          <Typography sx={{ fontSize: { xs: '1.5rem', sm: '1.8rem' }, fontWeight: 700, lineHeight: 1 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.textLight }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row', md: 'row' },
                  gap: { xs: 2, sm: 3, md: 4 },
                  mb: { xs: 6, sm: 8, md: 10 }
                }}>
                  {[
                    { icon: <TimelineIcon />, title: '17 точки отслеживания', desc: 'Локализуем проблему с точностью до миллиметра', color: '#0066FF' },
                    { icon: <SpeedIcon />, title: 'Реальное время', desc: 'Мгновенная реакция на изменение позы', color: '#FF6B35' },
                    { icon: <NotificationsActiveIcon />, title: 'Умные напоминания', desc: 'Не дадим вам забыть о правильной осанке', color: '#00C9A7' },
                  ].map((item, i) => (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${COLORS.border}`,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: { xs: 'center', sm: 'center', md: 'flex-start' },
                        textAlign: { xs: 'center', sm: 'center', md: 'left' },
                      }}
                    >
                      <Box sx={{ 
                        width: { xs: 48, sm: 56 }, 
                        height: { xs: 48, sm: 56 }, 
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
                      <Typography sx={{ 
                        fontWeight: 700, 
                        fontSize: { xs: '1.125rem', sm: '1.25rem' }, 
                        mb: 1,
                      }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ 
                        color: COLORS.textLight, 
                        lineHeight: 1.5,
                      }}>
                        {item.desc}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </motion.div>

              <Box sx={{ mt: { xs: 8, sm: 10, md: 12 } }}>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Typography sx={{ 
                    fontWeight: 700, 
                    textAlign: 'center', 
                    mb: { xs: 1, sm: 2 },
                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                  }}>
                    Что говорят
                  </Typography>
                  <Typography sx={{ 
                    textAlign: 'center', 
                    color: COLORS.textLight, 
                    mb: { xs: 4, sm: 5, md: 6 }, 
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                  }}>
                    Присоединяйтесь к сообществу
                  </Typography>

                  <ReviewCarousel
                    limit={isMobile ? 1 : isTablet ? 2 : 3}
                    autoPlay
                    showControls={!isMobile}
                    onReviewClick={() => navigate('/reviews')}
                  />

                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="center" 
                    spacing={{ xs: 2, sm: 2 }} 
                    sx={{ mt: { xs: 4, sm: 5, md: 6 } }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/reviews')}
                      fullWidth={isMobile}
                      sx={{
                        borderColor: COLORS.border,
                        color: COLORS.text,
                        borderRadius: 50,
                        px: { xs: 3, sm: 4 },
                        py: { xs: 1, sm: 1.5 },
                        textTransform: 'none',
                      }}
                    >
                      Все отзывы
                    </Button>
                    {user && (
                      <Button
                        variant="contained"
                        onClick={() => navigate('/reviews')}
                        fullWidth={isMobile}
                        sx={{
                          bgcolor: COLORS.primary,
                          borderRadius: 50,
                          px: { xs: 3, sm: 4 },
                          py: { xs: 1, sm: 1.5 },
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
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                alignItems={{ xs: 'stretch', sm: 'center' }} 
                justifyContent="space-between" 
                spacing={{ xs: 2, sm: 0 }}
                sx={{ mb: { xs: 2, sm: 4 } }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    onClick={handleBack}
                    sx={{ 
                      color: COLORS.textLight,
                      '&:hover': { bgcolor: `${COLORS.primary}10` }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  {!isMobile && (
                    <Button
                      onClick={handleBack}
                      sx={{ 
                        color: COLORS.textLight,
                        borderRadius: 50,
                        textTransform: 'none',
                      }}
                    >
                      На главную
                    </Button>
                  )}
                </Stack>
                
                <Paper
                  elevation={0}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 50,
                    background: `${COLORS.accent}10`,
                    border: `1px solid ${COLORS.accent}30`,
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ 
                      width: { xs: 8, sm: 10 }, 
                      height: { xs: 8, sm: 10 }, 
                      borderRadius: '50%', 
                      bgcolor: COLORS.accent,
                      animation: 'pulse 1.5s infinite',
                    }} />
                    <Typography variant="body2" sx={{ color: COLORS.textLight, fontWeight: 500 }}>
                      Активный мониторинг
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>

              <Suspense fallback={<WebcamLoader />}>
                <WebcamFeed />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }
        `}
      </style>
    </Box>
  );
};

export default Home;