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
  CardContent
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon
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
  const { refreshUserData, user } = useAuthStore();

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
    console.log('All URL params:', Object.fromEntries(params.entries()));

    if (foundPaymentId) {
      setPaymentId(foundPaymentId);
      // Сразу проверяем статус платежа
      checkPaymentStatus(foundPaymentId);
    } else {
      // Если paymentId не найден, проверяем статус подписки
      checkSubscriptionStatus();
    }
  }, []);

  const checkPaymentStatus = async (id: string) => {
    try {
      setActiveStep(1);
      console.log('Checking payment status for ID:', id);
      
      const response = await subscriptionApi.checkPaymentStatus(id);
      console.log('Payment status response:', response);
      
      if (response.success) {
        const data = response.data;
        
        // Проверяем различные статусы успеха
        if (data.paymentStatus === 'succeeded' || 
            data.subscriptionStatus === 'active' ||
            data.paymentStatus === 'waiting_for_capture' && data.subscriptionStatus === 'active') {
          
          setActiveStep(2);
          await refreshUserData();
          setStatus('success');
          
        } else if (data.paymentStatus === 'pending' || 
                   data.paymentStatus === 'waiting_for_capture') {
          
          setStatus('waiting');
          setError('Платеж обрабатывается. Пожалуйста, подождите...');
          
          // Автоматически проверяем статус еще несколько раз
          if (checkCount < 5) {
            setTimeout(() => {
              setCheckCount(prev => prev + 1);
              checkPaymentStatus(id);
            }, 2000);
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
        const subResponse = await subscriptionApi.getMySubscription();
        if (subResponse.success && subResponse.data.subscription.status === 'active') {
          setActiveStep(2);
          await refreshUserData();
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
      
      const response = await subscriptionApi.getMySubscription();
      console.log('Subscription status response:', response);
      
      if (response.success && response.data) {
        const subscription = response.data.subscription;
        
        // Проверяем, активна ли подписка
        if (subscription.status === 'active' || subscription.hasActiveSubscription) {
          setActiveStep(2);
          await refreshUserData();
          setStatus('success');
          return;
        }
        
        // Проверяем историю платежей
        if (subscription.paymentHistory && subscription.paymentHistory.length > 0) {
          const lastPayment = subscription.paymentHistory[subscription.paymentHistory.length - 1];
          if (lastPayment.status === 'succeeded') {
            setActiveStep(2);
            await refreshUserData();
            setStatus('success');
            return;
          }
        }
        
        // Если есть paymentId в подписке, проверяем его
        if (subscription.paymentId) {
          await checkPaymentStatus(subscription.paymentId);
          return;
        }
        
        setStatus('waiting');
        setError('Платеж обрабатывается. Пожалуйста, подождите...');
        
      } else {
        setStatus('error');
        setError('Не удалось получить информацию о подписке');
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
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          background: 'linear-gradient(145deg, #1a1f2e 0%, #1e2335 100%)',
          color: 'white'
        }}
      >
        {status === 'checking' && (
          <Fade in={status === 'checking'}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
                <CircularProgress size={80} thickness={4} sx={{ color: '#3b82f6' }} />
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
                  <Typography variant="caption" component="div" sx={{ fontSize: '1rem', color: 'white' }}>
                    {Math.round((activeStep / steps.length) * 100)}%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                Проверка платежа
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                Пожалуйста, подождите, мы проверяем статус вашего платежа
              </Typography>

              <Stepper 
                activeStep={activeStep} 
                alternativeLabel 
                sx={{ 
                  mt: 4,
                  '& .MuiStepLabel-label': { 
                    color: 'rgba(255, 255, 255, 0.7) !important'
                  },
                  '& .MuiStepLabel-label.Mui-active': { 
                    color: '#3b82f6 !important'
                  },
                  '& .MuiStepLabel-label.Mui-completed': { 
                    color: '#10b981 !important'
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
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2, display: 'block' }}>
                  ID платежа: {paymentId.slice(0, 8)}...{paymentId.slice(-4)}
                </Typography>
              )}
            </Box>
          </Fade>
        )}

        {status === 'waiting' && (
          <Fade in={status === 'waiting'}>
            <Box sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 80, color: '#f59e0b', mb: 3 }} />
              
              <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                Ожидание подтверждения платежа
              </Typography>
              
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                Платеж обрабатывается. Обычно это занимает несколько секунд.
              </Typography>

              {error && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 3, 
                    mb: 4,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    '& .MuiAlert-icon': {
                      color: '#fbbf24'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                    }
                  }}
                >
                  Проверить снова
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoToSubscription}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Перейти к подпискам
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGoHome}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  На главную
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
                bgcolor: '#10b981',
                mb: 3
              }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'white' }} />
              </Box>

              <Typography variant="h3" gutterBottom sx={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700
              }}>
                Оплата прошла успешно!
              </Typography>
              
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                Ваша подписка активирована. Теперь вам доступны все функции приложения.
              </Typography>

              <Card sx={{ 
                mt: 3, 
                mb: 4, 
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <CardContent>
                  <Typography variant="body1" sx={{ color: '#34d399', textAlign: 'left' }}>
                    ✓ Доступ к премиум-функциям<br />
                    ✓ Расширенная статистика<br />
                    ✓ Неограниченное количество сеансов<br />
                    ✓ Приоритетная поддержка
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={handleGoToProfile}
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                    }
                  }}
                >
                  Перейти в профиль
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={handleGoHome}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
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
                bgcolor: '#dc2626',
                mb: 3
              }}>
                <ErrorIcon sx={{ fontSize: 80, color: 'white' }} />
              </Box>

              <Typography variant="h3" gutterBottom sx={{ color: '#ef4444' }}>
                Ошибка при обработке платежа
              </Typography>
              
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3, 
                  mb: 4,
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  '& .MuiAlert-icon': {
                    color: '#f87171'
                  }
                }}
              >
                {error || 'Произошла неизвестная ошибка'}
              </Alert>

              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                Пожалуйста, проверьте статус подписки в профиле или попробуйте снова.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleGoToSubscription}
                  sx={{
                    background: '#3b82f6',
                    color: 'white',
                    px: 4,
                    '&:hover': {
                      background: '#2563eb'
                    }
                  }}
                >
                  Перейти к подпискам
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    px: 4,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Попробовать снова
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleGoHome}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    px: 4,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
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