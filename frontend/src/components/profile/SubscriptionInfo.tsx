import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Container,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Star as StarIcon,
  Storefront as StorefrontIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
  Diamond as DiamondIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { subscriptionApi } from '../../api/subscription';
import { useAuthStore } from '../../store/auth';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface SubscriptionData {
  subscription: any;
  availablePlans: Plan[];
  hasActiveSubscription: boolean;
  currentPlan?: string;
}

const SubscriptionInfo: React.FC = () => {
  const theme = useTheme();
  const { user, refreshUserData, hasPremiumAccess } = useAuthStore();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Функция для проверки и синхронизации статуса подписки
  const checkAndSyncSubscriptionStatus = useCallback(async () => {
    try {
      console.log('Checking and syncing subscription status...');
      
      // Получаем текущую подписку
      const response = await subscriptionApi.getMySubscription();
      const sub = response.data?.subscription;
      
      console.log('Current subscription status:', sub?.status);
      console.log('User hasPremiumAccess:', hasPremiumAccess());
      console.log('User subscriptionEndsAt:', user?.subscriptionEndsAt);
      
      // Если статус pending но есть дата окончания или есть доступ у пользователя
      if (sub?.status === 'pending') {
        // Проверяем, есть ли активный доступ у пользователя
        const userHasAccess = hasPremiumAccess();
        const hasEndDate = user?.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date();
        
        if (userHasAccess && hasEndDate) {
          console.log('User has active access but subscription status is pending - forcing refresh');
          // Принудительно обновляем данные
          await refreshUserData();
          // Повторно загружаем подписку
          const freshResponse = await subscriptionApi.getMySubscription();
          setSubscriptionData(freshResponse.data);
          return;
        }
        
        // Если нет доступа у пользователя, но есть paymentId - проверяем статус платежа
        if (sub?.paymentId || sub?.yookassaPaymentId) {
          const paymentId = sub?.yookassaPaymentId || sub?.paymentId;
          if (paymentId) {
            console.log('Checking payment status for:', paymentId);
            try {
              const paymentStatus = await subscriptionApi.checkPaymentStatus(paymentId);
              console.log('Payment status:', paymentStatus);
              
              if (paymentStatus.data?.subscriptionStatus === 'active') {
                console.log('Payment is successful, refreshing data');
                await refreshUserData();
                const finalResponse = await subscriptionApi.getMySubscription();
                setSubscriptionData(finalResponse.data);
                return;
              }
            } catch (paymentError) {
              console.error('Error checking payment:', paymentError);
            }
          }
        }
      }
      
      setSubscriptionData(response.data);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }, [hasPremiumAccess, refreshUserData, user?.subscriptionEndsAt]);

  const loadSubscriptionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Сначала проверяем и синхронизируем статус
      await checkAndSyncSubscriptionStatus();
      
      // Затем обновляем пользователя
      await refreshUserData();
      
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      setError(error.message || 'Ошибка при загрузке данных подписки');
    } finally {
      setIsLoading(false);
    }
  }, [checkAndSyncSubscriptionStatus, refreshUserData]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Принудительная проверка статуса
      await checkAndSyncSubscriptionStatus();
      await refreshUserData();
      
      setSnackbar({
        open: true,
        message: 'Данные успешно обновлены',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Refresh error:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении данных',
        severity: 'error'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [checkAndSyncSubscriptionStatus, refreshUserData]);

  useEffect(() => {
    const forceLoad = async () => {
      setIsLoading(true);
      await checkAndSyncSubscriptionStatus();
      await refreshUserData();
      setIsLoading(false);
    };
    forceLoad();
  }, [checkAndSyncSubscriptionStatus, refreshUserData]);

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessingPlan(planId);
      setError(null);

      const response = await subscriptionApi.createPayment(planId);
      console.log('Payment created:', response);
      
      if (response.success && response.data.confirmationUrl) {
        window.location.href = response.data.confirmationUrl;
      } else {
        setError('Не удалось создать платеж. Попробуйте позже.');
      }
    } catch (error: any) {
      console.error('Subscribe error:', error);
      setError(error.message || 'Ошибка при создании платежа');
    } finally {
      setProcessingPlan(null);
    }
  };

const handleCancelSubscription = useCallback(async () => {
  try {
    setIsCancelling(true);
    setError(null);
    
    console.log('Cancelling subscription...');
    const response = await subscriptionApi.cancelSubscription();
    console.log('Cancel response:', response);
    
    if (response.success) {
      setCancelDialogOpen(false);
      
      let message = response.message || 'Подписка успешно отменена';
      
      if (response.alreadyCancelled) {
        message = response.message || 'Подписка уже отменена или неактивна';
      }
      
      setSnackbar({
        open: true,
        message: message,
        severity: response.alreadyCancelled ? 'info' : 'success'
      });
      
      // Принудительно обновляем данные после отмены
      await refreshUserData();
      await checkAndSyncSubscriptionStatus();
      
      // Дополнительная проверка через 1 секунду
      setTimeout(async () => {
        await refreshUserData();
        await checkAndSyncSubscriptionStatus();
        const currentUser = useAuthStore.getState().user;
        console.log('Updated user after cancellation:', currentUser);
      }, 1000);
      
    } else {
      setSnackbar({
        open: true,
        message: response.error || 'Не удалось отменить подписку',
        severity: 'error'
      });
    }
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    
    const errorMessage = error.response?.data?.error || error.message;
    
    if (errorMessage?.includes('неактивна') || errorMessage?.includes('истекла')) {
      setSnackbar({
        open: true,
        message: 'Подписка уже неактивна или истекла. Обновляем данные...',
        severity: 'info'
      });
      await refreshUserData();
      await checkAndSyncSubscriptionStatus();
    } else {
      setSnackbar({
        open: true,
        message: errorMessage || 'Ошибка при отмене подписки',
        severity: 'error'
      });
    }
  } finally {
    setIsCancelling(false);
  }
}, [checkAndSyncSubscriptionStatus, refreshUserData]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const checkIfSubscriptionIsActive = (endDate: string | null | undefined): boolean => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    return end > now;
  };

  const subscription = subscriptionData?.subscription;
  const endDate = subscription?.endDate || user?.subscriptionEndsAt;
  const isSubscriptionActiveByDate = checkIfSubscriptionIsActive(endDate);
  const hasActiveFromStore = hasPremiumAccess();
  
  // Активна если: есть доступ в сторе И дата не истекла, ИЛИ подписка отменена но дата не истекла
  let hasActiveSubscription = (hasActiveFromStore && isSubscriptionActiveByDate);
  
  // Если подписка отменена, но дата не истекла - все еще активна
  if (subscription?.status === 'cancelled' && isSubscriptionActiveByDate) {
    hasActiveSubscription = true;
  }
  
  const isSubscriptionCancelled = subscription?.status === 'cancelled';
  const isSubscriptionExpired = subscription?.status === 'expired';
  // Показываем "Ожидание оплаты" только если статус pending И нет активного доступа
  const isSubscriptionPending = subscription?.status === 'pending' && !hasActiveSubscription;
  const currentPlanId = subscriptionData?.currentPlan || subscription?.plan;
  
  const getRemainingDays = (date: string | null | undefined): number => {
    if (!date) return 0;
    const end = new Date(date);
    const now = new Date();
    if (end <= now) return 0;
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  
  const remainingDays = (hasActiveSubscription && endDate) ? getRemainingDays(endDate) : 0;

  // Проверка, можно ли отменить подписку
  const canCancelSubscription = (): boolean => {
    if (!hasActiveSubscription) return false;
    if (isSubscriptionCancelled) return false;
    if (isSubscriptionExpired) return false;
    if (remainingDays <= 0) return false;
    return true;
  };
  
  const plans = subscriptionData?.availablePlans || [
    {
      id: 'basic',
      name: 'Базовый',
      price: 299,
      description: 'Базовый доступ к функциям приложения на 30 дней',
      features: [
        'До 30 сеансов в месяц',
        'Базовая статистика осанки',
        'Сохранение истории измерений (30 дней)',
        'Основные рекомендации',
        'Email поддержка'
      ]
    },
    {
      id: 'premium',
      name: 'Премиум',
      price: 599,
      description: 'Полный доступ ко всем функциям приложения на 30 дней',
      features: [
        'Неограниченное количество сеансов',
        'Детальная статистика осанки',
        'Сохранение истории измерений',
        'Персональные рекомендации',
        'Расширенная аналитика',
        'Экспорт данных в PDF',
        'Приоритетная поддержка'
      ]
    }
  ];

  const getPlanIcon = (planId: string) => {
    return planId === 'premium' ? <DiamondIcon sx={{ fontSize: 60 }} /> : <StarIcon sx={{ fontSize: 60 }} />;
  };

  const getPlanColor = (planId: string) => {
    return planId === 'premium' ? theme.palette.warning.main : theme.palette.info.main;
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8 
      }}>
        <CircularProgress size={60} sx={{ mb: 2, color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
          Загрузка информации о подписке...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Zoom in={true}>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError(null)}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" size="small" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? <CircularProgress size={20} /> : 'Обновить'}
                </Button>
                <Button color="inherit" size="small" onClick={loadSubscriptionData}>
                  Повторить
                </Button>
              </Box>
            }
          >
            {error}
          </Alert>
        </Zoom>
      )}

      <Fade in={true} timeout={500}>
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <IconButton onClick={handleRefresh} disabled={isRefreshing} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Выберите подписку
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, maxWidth: 600, mx: 'auto' }}>
            Получите доступ ко всем функциям приложения для эффективной работы над осанкой
          </Typography>
        </Box>
      </Fade>

      {/* Статус активной подписки */}
      {hasActiveSubscription && remainingDays > 0 && !isSubscriptionCancelled && (
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.dark, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                position: 'absolute',
                top: -30,
                right: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: alpha(theme.palette.success.main, 0.1),
                pointerEvents: 'none'
              }} />
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentPlanId === 'premium' ? (
                    <DiamondIcon sx={{ color: theme.palette.warning.main, fontSize: 48 }} />
                  ) : (
                    <VerifiedIcon sx={{ color: theme.palette.success.main, fontSize: 48 }} />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                    {currentPlanId === 'premium' ? 'Премиум' : 'Базовый'} подписка активна
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                    Вам доступны все функции выбранного тарифа
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Действует до: <strong>{formatDate(endDate)}</strong>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimerIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Осталось дней: <strong>{remainingDays}</strong>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {remainingDays > 0 && remainingDays <= 30 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(remainingDays / 30) * 100} 
                        sx={{ 
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.success.main
                          }
                        }}
                      />
                    </Box>
                  )}

                  {canCancelSubscription() && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={() => setCancelDialogOpen(true)}
                      sx={{ mt: 3 }}
                      startIcon={<CancelIcon />}
                    >
                      Отменить подписку
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Отмененная, но еще действующая подписка */}
      {isSubscriptionCancelled && remainingDays > 0 && (
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.dark, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 4,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 48 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ color: theme.palette.warning.main, fontWeight: 700 }}>
                    Подписка отменена
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 1 }}>
                    Доступ к платным функциям сохранится до {formatDate(endDate)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Осталось дней: <strong>{remainingDays}</strong>
                  </Typography>
                  <Chip 
                    label="Автопродление отключено" 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    icon={<InfoIcon />}
                    sx={{ mt: 2 }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Ожидание подтверждения платежа - показываем только если нет активной подписки */}
      {isSubscriptionPending && !hasActiveSubscription && (
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.dark, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 4,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <CircularProgress size={48} sx={{ color: theme.palette.info.main }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
                    Ожидание оплаты
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                    Ваш платеж обрабатывается. После подтверждения подписка активируется автоматически.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    sx={{ mt: 2 }}
                    startIcon={<RefreshIcon />}
                  >
                    {isRefreshing ? <CircularProgress size={20} /> : 'Проверить статус'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Карточки тарифов */}
      <Fade in={true} timeout={1000}>
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan, index) => {
            const isCurrentPlan = hasActiveSubscription && currentPlanId === plan.id && !isSubscriptionCancelled;
            const isDisabled = (hasActiveSubscription && !isSubscriptionCancelled) || isSubscriptionPending;
            
            return (
              <Grid item xs={12} md={6} key={plan.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.3s',
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: isCurrentPlan
                        ? `2px solid ${theme.palette.success.main}` 
                        : `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    {plan.id === 'premium' && !isCurrentPlan && (
                      <Box sx={{
                        position: 'absolute',
                        top: 20,
                        right: -35,
                        transform: 'rotate(45deg)',
                        backgroundColor: theme.palette.warning.main,
                        color: 'white',
                        px: 4,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        zIndex: 1
                      }}>
                        ПОПУЛЯРНЫЙ
                      </Box>
                    )}
                    
                    <CardContent sx={{ flexGrow: 1, p: 4 }}>
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{ color: getPlanColor(plan.id) }}>
                          {getPlanIcon(plan.id)}
                        </Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mt: 2 }}>
                          {plan.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                          {plan.description}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', my: 3 }}>
                        <Typography variant="h2" component="span" sx={{ fontWeight: 800, color: getPlanColor(plan.id) }}>
                          {plan.price}
                        </Typography>
                        <Typography variant="h5" component="span" sx={{ color: theme.palette.text.secondary }}>
                          ₽
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          /мес
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      <List dense>
                        {plan.features.map((feature, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon>
                              <CheckCircleIcon sx={{ color: getPlanColor(plan.id) }} fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>

                      <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
                          🔒 Безопасная оплата через ЮKassa
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 4, pt: 0 }}>
                      {isCurrentPlan ? (
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          disabled
                          size="large"
                          startIcon={<CheckCircleIcon />}
                          sx={{ py: 1.5 }}
                        >
                          Текущий тариф
                        </Button>
                      ) : isDisabled ? (
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          disabled
                          size="large"
                          sx={{ py: 1.5 }}
                        >
                          {hasActiveSubscription ? 'Подписка уже активна' : 'Ожидание оплаты'}
                        </Button>
                      ) : (
                        <Button 
                          fullWidth 
                          variant="contained" 
                          size="large"
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={!!processingPlan}
                          sx={{
                            py: 1.5,
                            background: plan.id === 'premium'
                              ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.error.main} 100%)`
                              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            '&:hover': {
                              background: plan.id === 'premium'
                                ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.error.dark} 100%)`
                                : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                            }
                          }}
                        >
                          {processingPlan === plan.id ? (
                            <>
                              <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                              Обработка...
                            </>
                          ) : (
                            `Оформить за ${plan.price} ₽`
                          )}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Fade>

      {/* Способы оплаты */}
      <Fade in={true} timeout={1200}>
        <Paper sx={{ p: 4, mt: 4, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <PaymentIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Способы оплаты
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            Оплата производится через платежный сервис ЮKassa. Все платежи защищены и обрабатываются по протоколу 3D Secure.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip icon={<CreditCardIcon />} label="Банковские карты" variant="outlined" />
            <Chip icon={<PhoneAndroidIcon />} label="СБП" variant="outlined" />
            <Chip icon={<AccountBalanceIcon />} label="Сбербанк" variant="outlined" />
            <Chip icon={<AccountBalanceIcon />} label="Тинькофф" variant="outlined" />
            <Chip icon={<PaymentIcon />} label="ЮMoney" variant="outlined" />
            <Chip icon={<StorefrontIcon />} label="Apple Pay" variant="outlined" />
          </Box>
        </Paper>
      </Fade>

      {/* Диалог подтверждения отмены */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => !isCancelling && setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon sx={{ color: theme.palette.warning.main }} />
            <Typography variant="h6">Отмена подписки</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            После отмены подписки вы потеряете доступ к платным функциям
          </Alert>
          <Typography variant="body1" paragraph>
            Вы уверены, что хотите отменить подписку?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Подписка будет отменена, но доступ к функциям сохранится до конца оплаченного периода ({formatDate(endDate)}).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
          <Button 
            onClick={() => setCancelDialogOpen(false)}
            variant="outlined"
            fullWidth
            disabled={isCancelling}
          >
            Нет, оставить
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            color="error" 
            variant="contained"
            disabled={isCancelling}
            fullWidth
          >
            {isCancelling ? <CircularProgress size={24} /> : 'Да, отменить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionInfo;