import React, { useEffect, useState } from 'react';
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
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { refreshUserData, hasPremiumAccess } = useAuthStore();

  const steps = ['Создание платежа', 'Проверка платежа', 'Активация подписки'];

  useEffect(() => {
    // Парсим URL-параметры
    const params = new URLSearchParams(location.search);
    
    // ЮKassa может вернуть paymentId в разных параметрах
    const possibleParams = ['paymentId', 'order_id', 'payment_id', 'id'];
    let foundPaymentId: string | null = null;
    
    for (const param of possibleParams) {
      const value = params.get(param);
      if (value) {
        foundPaymentId = value;
        break;
      }
    }

    // Также проверяем весь URL на наличие UUID
    if (!foundPaymentId) {
      const urlPath = location.pathname + location.search;
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const match = urlPath.match(uuidRegex);
      if (match) {
        foundPaymentId = match[0];
      }
    }

    console.log('Payment ID from URL:', foundPaymentId);

    if (foundPaymentId) {
      setPaymentId(foundPaymentId);
      setActiveStep(1);
      checkPaymentStatus(foundPaymentId);
    } else {
      // Если paymentId не найден, проверяем статус подписки
      checkSubscriptionStatus();
    }
  }, []);

  const checkPaymentStatus = async (id: string) => {
    try {
      console.log('Checking payment status for ID:', id);
      
      const response = await subscriptionApi.checkPaymentStatus(id);
      console.log('Payment status response:', response);
      
      if (response.success) {
        const data = response.data;
        
        // Проверяем различные статусы успеха
        if (data.paymentStatus === 'succeeded' || 
            data.subscriptionStatus === 'active' ||
            (data.paymentStatus === 'waiting_for_capture' && data.subscriptionStatus === 'active')) {
          
          setActiveStep(2);
          await refreshUserData();
          
          // Небольшая задержка для обновления данных
          setTimeout(() => {
            setStatus('success');
          }, 1000);
          
        } else if (data.paymentStatus === 'pending' || 
                   data.paymentStatus === 'waiting_for_capture') {
          
          setStatus('waiting');
          setError('Платеж обрабатывается. Пожалуйста, подождите...');
          
          // Автоматически проверяем статус еще несколько раз
          if (checkCount < 10) {
            setTimeout(() => {
              setCheckCount(prev => prev + 1);
              checkPaymentStatus(id);
            }, 3000);
          } else {
            setStatus('error');
            setError('Время ожидания истекло. Проверьте статус подписки в профиле.');
          }
          
        } else {
          setStatus('error');
          setError(`Статус платежа: ${data.paymentStatus || 'неизвестен'}`);
        }
      } else {
        setStatus('error');
        setError('Платеж не был завершен. Пожалуйста, проверьте статус подписки в профиле.');
      }
    } catch (error: any) {
      console.error('Error checking payment:', error);
      
      // Если ошибка, но подписка могла активироваться
      try {
        await refreshUserData();
        if (hasPremiumAccess()) {
          setActiveStep(2);
          setStatus('success');
          return;
        }
      } catch (e) {
        // Игнорируем
      }
      
      setStatus('error');
      setError(error.message || 'Ошибка при проверке платежа');
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      setActiveStep(1);
      console.log('Checking subscription status directly');
      
      await refreshUserData();
      
      if (hasPremiumAccess()) {
        setActiveStep(2);
        setStatus('success');
      } else {
        setStatus('waiting');
        setError('Платеж обрабатывается. Пожалуйста, подождите...');
        
        // Проверяем еще несколько раз
        if (checkCount < 10) {
          setTimeout(() => {
            setCheckCount(prev => prev + 1);
            checkSubscriptionStatus();
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setStatus('error');
      setError(error.message || 'Ошибка при проверке подписки');
    }
  };

  const handleRetry = () => {
    setCheckCount(0);
    setStatus('checking');
    setActiveStep(1);
    if (paymentId) {
      checkPaymentStatus(paymentId);
    } else {
      checkSubscriptionStatus();
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
                    {Math.round((activeStep / steps.length) * 100)}%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Проверка платежа
              </Typography>
              
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }} paragraph>
                Пожалуйста, подождите, мы проверяем статус вашего платежа
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

              {paymentId && (
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 2, display: 'block' }}>
                  ID платежа: {paymentId.slice(0, 8)}...{paymentId.slice(-4)}
                </Typography>
              )}
            </Box>
          </Fade>
        )}

        {status === 'waiting' && (
          <Fade in={status === 'waiting'}>
            <Box sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 80, color: theme.palette.warning.main, mb: 3 }} />
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Ожидание подтверждения платежа
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
                  Проверить снова
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
                Оплата прошла успешно!
              </Typography>
              
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }} paragraph>
                Ваша премиум подписка активирована. Теперь вам доступны все функции приложения.
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
                Ошибка при обработке платежа
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
                Пожалуйста, проверьте статус подписки в профиле или попробуйте снова.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleGoToSubscription}
                  sx={{ px: 4 }}
                >
                  Перейти к подпискам
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                  sx={{ px: 4 }}
                >
                  Попробовать снова
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