import React, { useState, useEffect } from 'react';
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
  Snackbar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Star as StarIcon,
  Storefront as StorefrontIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { subscriptionApi } from '../../api/subscription';
import { useAuthStore } from '../../store/auth';

interface SubscriptionData {
  subscription: any;
  availablePlans: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
  }>;
  hasActiveSubscription: boolean;
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await subscriptionApi.getMySubscription();
      console.log('Subscription data loaded:', response.data);
      setSubscriptionData(response.data);
      
      // Обновляем данные пользователя, чтобы синхронизировать статус подписки
      await refreshUserData();
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      setError(error.message || 'Ошибка при загрузке данных подписки');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      setError(null);
      
      console.log('Cancelling subscription...');
      const response = await subscriptionApi.cancelSubscription();
      console.log('Cancel response:', response);
      
      if (response.success) {
        // Закрываем диалог
        setCancelDialogOpen(false);
        
        // Показываем сообщение об успехе через Snackbar
        setSnackbar({
          open: true,
          message: 'Подписка успешно отменена',
          severity: 'success'
        });
        
        // Перезагружаем данные подписки
        await loadSubscriptionData();
        
        // Обновляем данные пользователя
        await refreshUserData();
        
        // Принудительно обновляем состояние, чтобы скрыть кнопку отмены
        // Делаем дополнительную проверку через 1 секунду
        setTimeout(async () => {
          await refreshUserData();
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
      setSnackbar({
        open: true,
        message: error.message || 'Ошибка при отмене подписки',
        severity: 'error'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Функция для проверки, активна ли подписка (по дате)
  const checkIfSubscriptionIsActive = (endDate: string | null | undefined): boolean => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    return end > now;
  };

  // Получаем актуальный статус подписки
  const subscription = subscriptionData?.subscription;
  const endDate = subscription?.endDate || user?.subscriptionEndsAt;
  
  // Проверяем активность подписки по дате
  const isSubscriptionActiveByDate = checkIfSubscriptionIsActive(endDate);
  
  // Проверяем через store (hasPremiumAccess) и дополнительно проверяем дату
  const hasActiveFromStore = hasPremiumAccess();
  const hasActiveSubscription = hasActiveFromStore && isSubscriptionActiveByDate;
  
  // Проверяем статус подписки из данных API
  const isSubscriptionCancelled = subscription?.status === 'cancelled';
  const isSubscriptionExpired = subscription?.status === 'expired';
  
  // Вычисляем оставшиеся дни (только если подписка активна)
  const getRemainingDays = (endDate: string | null | undefined): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    if (end <= now) return 0;
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  
  const remainingDays = hasActiveSubscription ? getRemainingDays(endDate) : 0;
  
  // Проверяем пробный период
  const isInTrial = user?.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const trialDaysLeft = isInTrial && user?.trialEndsAt 
    ? Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Премиум план (только один)
  const premiumPlan = subscriptionData?.availablePlans?.[0] || {
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
      {/* Snackbar для уведомлений */}
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
              <Button color="inherit" size="small" onClick={loadSubscriptionData}>
                Повторить
              </Button>
            }
          >
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Заголовок */}
      <Fade in={true} timeout={500}>
        <Box sx={{ mb: 5, textAlign: 'center' }}>
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
            Премиум подписка
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, maxWidth: 600, mx: 'auto' }}>
            Получите доступ ко всем функциям приложения для эффективной работы над осанкой
          </Typography>
        </Box>
      </Fade>

      {/* Статус подписки */}
      <Fade in={true} timeout={800}>
        <Box sx={{ mb: 4 }}>
          {hasActiveSubscription && remainingDays > 0 && !isSubscriptionCancelled ? (
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
                  <VerifiedIcon sx={{ color: theme.palette.success.main, fontSize: 48 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                    Премиум подписка активна
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                    Вам доступны все функции приложения
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

                  {subscription?.autoRenew && (
                    <Chip 
                      label="Автопродление включено" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                      icon={<CheckCircleIcon />}
                      sx={{ mt: 1 }}
                    />
                  )}

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
                </Box>
              </Box>
            </Paper>
          ) : isInTrial && trialDaysLeft > 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.dark, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TimerIcon sx={{ color: theme.palette.warning.main, fontSize: 48 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ color: theme.palette.warning.main, fontWeight: 700 }}>
                    Пробный период
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                    Вы используете пробный период приложения
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={((7 - trialDaysLeft) / 7) * 100} 
                      sx={{ 
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.warning.main
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ color: theme.palette.warning.main, fontWeight: 500 }}>
                      Осталось {trialDaysLeft} дн.
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    После окончания пробного периода оформите подписку для продолжения использования
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => handleSubscribe(premiumPlan.id)}
                    disabled={!!processingPlan}
                    sx={{ mt: 3 }}
                  >
                    {processingPlan === premiumPlan.id ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Оформить подписку'
                    )}
                  </Button>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.dark, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 4,
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 48 }} />
                <Typography variant="h4" sx={{ color: theme.palette.info.main, fontWeight: 700 }}>
                  Нет активной подписки
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 500, mx: 'auto', mb: 3 }}>
                Оформите премиум подписку для доступа ко всем функциям приложения
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => handleSubscribe(premiumPlan.id)}
                disabled={!!processingPlan}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              >
                {processingPlan === premiumPlan.id ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Оформить подписку за 599 ₽'
                )}
              </Button>
            </Paper>
          )}
        </Box>
      </Fade>

      {/* Карточка тарифа - только Premium */}
      <Fade in={true} timeout={1000}>
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
            О тарифе
          </Typography>
          
          <Grid container justifyContent="center">
            <Grid item xs={12} md={8} lg={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
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
                    border: hasActiveSubscription && remainingDays > 0 && !isSubscriptionCancelled
                      ? `2px solid ${theme.palette.success.main}` 
                      : `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <StarIcon sx={{ fontSize: 60, color: theme.palette.warning.main, mb: 2 }} />
                      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                        {premiumPlan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        {premiumPlan.description}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center', my: 3 }}>
                      <Typography variant="h2" component="span" sx={{ fontWeight: 800 }}>
                        {premiumPlan.price}
                      </Typography>
                      <Typography variant="h5" component="span" sx={{ color: theme.palette.text.secondary }}>
                        ₽
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        в месяц
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <List dense>
                      {premiumPlan.features.map((feature, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" fontSize="small" />
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
                    {hasActiveSubscription && remainingDays > 0 && !isSubscriptionCancelled ? (
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
                    ) : (
                      <Button 
                        fullWidth 
                        variant="contained" 
                        size="large"
                        onClick={() => handleSubscribe(premiumPlan.id)}
                        disabled={!!processingPlan}
                        sx={{
                          py: 1.5,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                          }
                        }}
                      >
                        {processingPlan === premiumPlan.id ? (
                          <>
                            <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                            Обработка...
                          </>
                        ) : (
                          'Оформить подписку'
                        )}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
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
            После отмены подписки вы потеряете доступ к премиум-функциям
          </Alert>
          <Typography variant="body1" paragraph>
            Вы уверены, что хотите отменить подписку?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Подписка будет отменена, но доступ к функциям сохранится до конца оплаченного периода.
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