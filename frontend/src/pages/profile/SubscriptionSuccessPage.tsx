import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { subscriptionApi } from '../../api/subscription';
import { useAuthStore } from '../../store/auth';

const SubscriptionSuccessPage: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'waiting'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { refreshUserData, hasPremiumAccess, user } = useAuthStore();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = ['Создание платежа', 'Проверка платежа', 'Активация подписки'];

  // Функция для проверки статуса подписки
  const checkSubscriptionDirectly = useCallback(async () => {
    try {
      console.log('Checking subscription directly...');
      
      // Получаем свежие данные подписки
      const response = await subscriptionApi.getMySubscription();
      console.log('Subscription data:', response.data);
      
      const hasActive = response.data?.hasActiveSubscription;
      const subscriptionStatus = response.data?.subscription?.status;
      const isActive = response.data?.subscription?.isActive;
      
      console.log('Has active subscription:', hasActive);
      console.log('Subscription status:', subscriptionStatus);
      console.log('Is active:', isActive);
      
      // Если подписка активна - успех
      if (hasActive === true || subscriptionStatus === 'active' || isActive === true) {
        console.log('Subscription is active!');
        setActiveStep(2);
        setStatus('success');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking subscription directly:', error);
      return false;
    }
  }, []);

  // Функция для принудительной синхронизации
  const forceSyncAndCheck = useCallback(async () => {
    try {
      console.log('Forcing sync and check...');
      
      // Синхронизируем подписку
      await subscriptionApi.syncSubscription();
      
      // Обновляем данные пользователя
      await refreshUserData();
      
      // Проверяем статус
      const hasAccess = hasPremiumAccess();
      const hasEndDate = user?.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date();
      
      console.log('After sync - hasPremiumAccess:', hasAccess);
      console.log('After sync - subscriptionEndsAt:', user?.subscriptionEndsAt);
      
      if (hasAccess && hasEndDate) {
        setActiveStep(2);
        setStatus('success');
        return true;
      }
      
      // Дополнительная проверка через API подписки
      const subResponse = await subscriptionApi.getMySubscription();
      if (subResponse.data?.hasActiveSubscription === true) {
        setActiveStep(2);
        setStatus('success');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Force sync error:', error);
      return false;
    }
  }, [refreshUserData, hasPremiumAccess, user]);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10; // 10 попыток по 2 секунды = 20 секунд максимум
    
    const startChecking = async () => {
      console.log('Starting subscription check...');
      setActiveStep(1);
      
      // Сначала проверяем напрямую
      const isActive = await checkSubscriptionDirectly();
      
      if (isActive) {
        console.log('Subscription already active, success!');
        return;
      }
      
      // Если не активна, запускаем интервал проверки
      checkIntervalRef.current = setInterval(async () => {
        attempts++;
        console.log(`Check attempt ${attempts}/${maxAttempts}`);
        
        // Пробуем синхронизировать и проверить
        const success = await forceSyncAndCheck();
        
        if (success) {
          console.log('Subscription activated successfully!');
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log('Max attempts reached, showing error');
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          setStatus('error');
          setError('Время ожидания истекло. Подписка не активирована. Пожалуйста, проверьте статус в профиле.');
        } else {
          setStatus('waiting');
          setError('Платеж обрабатывается. Пожалуйста, подождите...');
        }
      }, 2000); // Проверяем каждые 2 секунды
    };
    
    startChecking();
    
    // Очистка интервала при размонтировании
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [checkSubscriptionDirectly, forceSyncAndCheck]);

  const handleRetry = async () => {
    setStatus('checking');
    setActiveStep(1);
    setError(null);
    
    // Принудительно синхронизируем
    await forceSyncAndCheck();
    
    // Проверяем статус
    const isActive = await checkSubscriptionDirectly();
    
    if (isActive) {
      setStatus('success');
      setActiveStep(2);
    } else {
      // Запускаем новый цикл проверки
      let attempts = 0;
      const maxAttempts = 10;
      
      const interval = setInterval(async () => {
        attempts++;
        const success = await forceSyncAndCheck();
        
        if (success) {
          clearInterval(interval);
          setStatus('success');
          setActiveStep(2);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus('error');
          setError('Не удалось активировать подписку. Пожалуйста, проверьте статус в профиле.');
        } else {
          setStatus('waiting');
          setError('Платеж обрабатывается. Пожалуйста, подождите...');
        }
      }, 2000);
      
      // Сохраняем интервал для очистки
      return () => clearInterval(interval);
    }
  };

  const handleGoToSubscription = () => {
    navigate('/profile/subscription');
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1a1f2e 0%, #1e2335 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {status === 'checking' && (
          <Fade in={status === 'checking'}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
                <CircularProgress size={80} thickness={4} sx={{ color: theme.palette.primary.main }} />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" component="div" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    50%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Проверка статуса подписки
              </Typography>
              
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }} paragraph>
                Пожалуйста, подождите, мы проверяем статус вашей подписки
              </Typography>

              <Stepper 
                activeStep={activeStep} 
                alternativeLabel 
                sx={{ 
                  mt: 4,
                  '& .MuiStepLabel-label': { 
                    color: `${theme.palette.text.secondary} !important`
                  },
                  '& .MuiStepLabel-label.Mui-active': { 
                    color: `${theme.palette.primary.main} !important`
                  },
                  '& .MuiStepLabel-label.Mui-completed': { 
                    color: `${theme.palette.success.main} !important`
                  }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Fade>
        )}

        {status === 'waiting' && (
          <Fade in={status === 'waiting'}>
            <Box sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 80, color: theme.palette.warning.main, mb: 3 }} />
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Ожидание активации подписки
              </Typography>
              
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }} paragraph>
                Платеж обрабатывается. Обычно это занимает несколько секунд.
              </Typography>

              {error && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 3, 
                    mb: 4,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  }}
                >
                  {error}
                </Alert>
              )}

              <CircularProgress size={40} sx={{ mt: 2, mb: 4 }} />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                >
                  Проверить сейчас
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToSubscription}
                >
                  Перейти к подпискам
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {status === 'success' && (
          <Fade in={status === 'success'}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: theme.palette.success.main,
                mb: 3
              }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'white' }} />
              </Box>

              <Typography variant="h3" gutterBottom sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>
                Подписка успешно активирована!
              </Typography>
              
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }} paragraph>
                Ваша подписка активна. Теперь вам доступны все функции приложения.
              </Typography>

              <Card sx={{ 
                mt: 3, 
                mb: 4, 
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                borderRadius: 2
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
                    <StarIcon sx={{ color: theme.palette.warning.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Что теперь доступно?
                    </Typography>
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                        ✓ Неограниченное количество сеансов
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                        ✓ Детальная статистика осанки
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                        ✓ Сохранение истории измерений
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                        ✓ Персональные рекомендации
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                        ✓ Расширенная аналитика
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                        ✓ Экспорт данных в PDF
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={handleGoToProfile}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    px: 4,
                    py: 1.5
                  }}
                >
                  Перейти в профиль
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={handleGoHome}
                  sx={{ px: 4, py: 1.5 }}
                >
                  На главную
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {status === 'error' && (
          <Fade in={status === 'error'}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: theme.palette.error.main,
                mb: 3
              }}>
                <ErrorIcon sx={{ fontSize: 80, color: 'white' }} />
              </Box>

              <Typography variant="h3" gutterBottom sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
                Не удалось активировать подписку
              </Typography>
              
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3, 
                  mb: 4,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                }}
              >
                {error || 'Произошла неизвестная ошибка'}
              </Alert>

              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }} paragraph>
                Пожалуйста, проверьте статус подписки в профиле. Возможно, платеж уже прошел успешно.
              </Typography>

              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Вы можете проверить статус подписки на странице "Мои подписки" или обратиться в поддержку.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleGoToSubscription}
                  sx={{ px: 4 }}
                >
                  Проверить статус подписки
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleGoToProfile}
                  sx={{ px: 4 }}
                >
                  Перейти в профиль
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleGoHome}
                  sx={{ px: 4 }}
                >
                  На главную
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Paper>
    </Container>
  );
};

export default SubscriptionSuccessPage;