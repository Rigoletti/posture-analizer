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
  useTheme
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
  Event as EventIcon
} from '@mui/icons-material';
import { subscriptionApi } from '../../api/subscription';
import { useAuthStore } from '../../store/auth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { alpha } from '@mui/material/styles';

interface SubscriptionData {
  subscription: any;
  availablePlans: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>;
}

const SubscriptionInfo: React.FC = () => {
  const theme = useTheme();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await subscriptionApi.getMySubscription();
      setSubscriptionData(response.data);
    } catch (error: any) {
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
      
      if (response.success && response.data.confirmationUrl) {
        // Перенаправляем пользователя на страницу оплаты ЮKassa
        window.location.href = response.data.confirmationUrl;
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при создании платежа');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      await subscriptionApi.cancelSubscription();
      await loadSubscriptionData();
      await checkAuth(); // Обновляем данные пользователя
      setCancelDialogOpen(false);
    } catch (error: any) {
      setError(error.message || 'Ошибка при отмене подписки');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8 
      }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Загрузка информации о подписке...
        </Typography>
      </Box>
    );
  }

  if (!subscriptionData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadSubscriptionData}>
              Повторить
            </Button>
          }
        >
          {error || 'Не удалось загрузить данные подписки'}
        </Alert>
      </Box>
    );
  }

  const { subscription, availablePlans } = subscriptionData;
  const hasActiveSubscription = subscription.hasActiveSubscription;
  const isInTrial = subscription.isInTrial;

  // Статус подписки
  const renderStatus = () => {
    if (hasActiveSubscription) {
      return (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.dark, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Подписка активна
              </Typography>
              <Typography variant="body1" paragraph>
                Тариф: <strong>{subscription.plan === 'basic' ? 'Базовый' : 'Премиум'}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Действует до: {formatDate(subscription.endDate)}
              </Typography>
              {subscription.autoRenew && (
                <Chip 
                  label="Автопродление включено" 
                  size="small" 
                  color="success" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setCancelDialogOpen(true)}
                sx={{ mt: 2 }}
                startIcon={<CancelIcon />}
              >
                Отменить подписку
              </Button>
            </Box>
          </Box>
        </Paper>
      );
    }

    if (isInTrial) {
      const daysLeft = Math.ceil((new Date(subscription.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.dark, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <TimerIcon sx={{ color: 'warning.main', fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom color="warning.main">
                Пробный период
              </Typography>
              <Typography variant="body1" paragraph>
                Действует до: {formatDate(subscription.trialEndDate)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (7 - daysLeft) * 100 / 7)} 
                  sx={{ 
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'warning.main'
                    }
                  }}
                />
                <Typography variant="body2" color="warning.main">
                  {daysLeft} дн.
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                После окончания пробного периода вам нужно будет оформить подписку
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.dark, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <WarningIcon sx={{ color: 'error.main', fontSize: 40 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom color="error.main">
              Нет активной подписки
            </Typography>
            <Typography variant="body1">
              Оформите подписку для доступа ко всем функциям приложения
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Заголовок */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Управление подпиской
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Выберите подходящий тариф для доступа ко всем функциям
        </Typography>
      </Box>

      {/* Текущий статус */}
      {renderStatus()}

      {/* Тарифы */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {availablePlans.map((plan) => (
          <Grid item xs={12} md={6} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.3s',
                border: subscription.plan === plan.id && hasActiveSubscription 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[10]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h5" gutterBottom align="center" sx={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 600
                }}>
                  {plan.name}
                </Typography>
                
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography variant="h3" component="span" sx={{ fontWeight: 700 }}>
                    {plan.price}
                  </Typography>
                  <Typography variant="h6" component="span" color="textSecondary">
                    ₽
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    в месяц
                  </Typography>
                </Box>

                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Неограниченное количество сеансов" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Детальная статистика осанки" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Сохранение истории измерений" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Персональные рекомендации" />
                  </ListItem>
                  
                  {plan.id === 'premium' && (
                    <>
                      <ListItem sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Расширенная аналитика" 
                          secondary="Дополнительные метрики и графики"
                        />
                      </ListItem>
                      <ListItem sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Экспорт данных в PDF" 
                          secondary="Сохраняйте отчеты о сеансах"
                        />
                      </ListItem>
                      <ListItem sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Приоритетная поддержка" 
                          secondary="Ответ в течение 2 часов"
                        />
                      </ListItem>
                    </>
                  )}
                </List>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                {subscription.plan === plan.id && hasActiveSubscription ? (
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    disabled
                    startIcon={<CheckCircleIcon />}
                  >
                    Текущий тариф
                  </Button>
                ) : (
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!processingPlan}
                    sx={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                      }
                    }}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        Обработка...
                      </>
                    ) : (
                      'Оформить подписку'
                    )}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Информация об оплате */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <InfoIcon color="info" />
          <Typography variant="h6">Информация об оплате</Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" paragraph>
          Оплата производится через платежный сервис ЮKassa. 
          Все платежи защищены и обрабатываются по протоколу 3D Secure.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<CreditCardIcon />} label="Банковские карты" variant="outlined" />
          <Chip icon={<PhoneAndroidIcon />} label="СБП" variant="outlined" />
          <Chip icon={<PaymentIcon />} label="ЮMoney" variant="outlined" />
          <Chip icon={<AccountBalanceIcon />} label="Сбербанк" variant="outlined" />
          <Chip icon={<AccountBalanceIcon />} label="Tinkoff" variant="outlined" />
        </Box>
      </Paper>

      {/* История платежей */}
      {subscription.paymentHistory && subscription.paymentHistory.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <HistoryIcon color="action" />
            <Typography variant="h6">История платежей</Typography>
          </Box>
          <List>
            {subscription.paymentHistory.map((payment: any, index: number) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={formatDate(payment.date)}
                    secondary={`Платеж ID: ${payment.paymentId.slice(0, 8)}...`}
                  />
                  <Typography variant="h6" sx={{ mr: 2 }}>
                    {payment.amount} ₽
                  </Typography>
                  <Chip 
                    label="Успешно" 
                    color="success" 
                    size="small" 
                    icon={<CheckCircleIcon />} 
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Диалог подтверждения отмены */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Отмена подписки</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            После отмены подписки вы потеряете доступ к премиум-функциям
          </Alert>
          <Typography variant="body1" paragraph>
            Вы уверены, что хотите отменить подписку?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Подписка будет отменена, но доступ к функциям сохранится до конца оплаченного периода.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Нет, оставить
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            color="error" 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Да, отменить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionInfo;