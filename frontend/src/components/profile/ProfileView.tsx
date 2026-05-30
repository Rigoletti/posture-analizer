import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../../api/auth';
import { subscriptionApi } from '../../api/subscription';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';
import YandexProfileInfo from './YandexProfileInfo';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Container,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  Fade,
  Zoom,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Login as LoginIcon,
  Badge as BadgeIcon,
  ChevronRight as ChevronRightIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  FlashOn as FlashOnIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Импортируем иконку Яндекса для чипа
import yandexIconUrl from '../../assets/img/icons/icon_yandex.svg';

interface SubscriptionInfo {
  id: string;
  plan: string;
  status: string;
  endDate: string | null;
  remainingDays: number;
  hasActiveSubscription: boolean;
}

const ProfileView: React.FC = () => {
  const { user, isLoading, error, clearError, refreshUserData } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<null | HTMLElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Состояние для подписки
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

  useEffect(() => {
    clearError();
    loadAllData();
  }, [clearError]);

  // Загрузка всех данных (пользователь + подписка)
  const loadAllData = async () => {
    try {
      setIsSubscriptionLoading(true);
      
      // Сначала обновляем данные пользователя
      await refreshUserData();
      
      // Затем загружаем информацию о подписке
      await loadSubscriptionInfo();
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  // Загрузка информации о подписке
  const loadSubscriptionInfo = async () => {
    try {
      const response = await subscriptionApi.getMySubscription();
      const data = response.data;
      
      console.log('Subscription data from API:', data);
      
      if (data.subscription && data.hasActiveSubscription) {
        const sub = data.subscription;
        setSubscriptionInfo({
          id: sub.id,
          plan: sub.plan,
          status: sub.status,
          endDate: sub.endDate,
          remainingDays: sub.remainingDays || 0,
          hasActiveSubscription: true
        });
      } else {
        // Проверяем также через user данные
        const userHasAccess = user?.hasPremiumAccess === true;
        const userHasEndDate = user?.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date();
        
        if (userHasAccess && userHasEndDate) {
          console.log('User has premium access from user data');
          setSubscriptionInfo({
            id: '',
            plan: 'premium',
            status: 'active',
            endDate: user.subscriptionEndsAt,
            remainingDays: Math.ceil((new Date(user.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            hasActiveSubscription: true
          });
        } else {
          setSubscriptionInfo(null);
        }
      }
    } catch (error) {
      console.error('Error loading subscription info:', error);
      
      // Если ошибка, проверяем через user данные
      const userHasAccess = user?.hasPremiumAccess === true;
      const userHasEndDate = user?.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date();
      
      if (userHasAccess && userHasEndDate) {
        setSubscriptionInfo({
          id: '',
          plan: 'premium',
          status: 'active',
          endDate: user.subscriptionEndsAt,
          remainingDays: Math.ceil((new Date(user.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          hasActiveSubscription: true
        });
      } else {
        setSubscriptionInfo(null);
      }
    }
  };

  // Обновление данных (после изменения подписки)
  const handleRefreshData = async () => {
    await loadAllData();
    showNotification('Данные обновлены', 'success');
  };

  // Логируем изменения user
  useEffect(() => {
    if (user) {
      console.log('=== USER DATA IN PROFILE VIEW ===');
      console.log('hasPremiumAccess:', user.hasPremiumAccess);
      console.log('subscriptionEndsAt:', user.subscriptionEndsAt);
      console.log('subscription:', user.subscription);
    }
  }, [user]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      showNotification('Email скопирован', 'success');
    }
  };

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAvatarMenuAnchor(event.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Пожалуйста, выберите изображение', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимальный размер: 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setUploadDialogOpen(true);
    handleAvatarMenuClose();
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      
      const response = await authApi.uploadAvatar(selectedFile);
      
      if (response.success) {
        await refreshUserData();
        showNotification('Аватар успешно загружен', 'success');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Ошибка при загрузке аватара', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsDeleting(true);
      const response = await authApi.deleteAvatar();
      
      if (response.success) {
        await refreshUserData();
        showNotification('Аватар успешно удален', 'success');
        setDeleteDialogOpen(false);
      }
    } catch (error: any) {
      showNotification(error.message || 'Ошибка при удалении аватара', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAvatarSource = () => {
    if (!user) {
      return undefined;
    }
    
    if (user.avatarUrl) {
      return user.avatarUrl;
    }
    
    if (user.authProvider === 'yandex' && user.yandexAvatar) {
      return user.yandexAvatar;
    }
    
    return undefined;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  // Получение иконки для плана подписки
  const getPlanIcon = (plan: string) => {
    return plan === 'premium' ? <DiamondIcon sx={{ fontSize: 20 }} /> : <StarIcon sx={{ fontSize: 20 }} />;
  };

  // Получение названия плана
  const getPlanName = (plan: string) => {
    return plan === 'premium' ? 'Премиум' : 'Базовый';
  };

  // Получение цвета для плана
  const getPlanColor = (plan: string) => {
    return plan === 'premium' ? theme.palette.warning.main : theme.palette.info.main;
  };

  // Проверяем активность подписки через user данные
  const hasActiveSubscriptionFromUser = user?.hasPremiumAccess === true && 
    user?.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date();

  const avatarSource = getAvatarSource();

  const DarkPaper = styled(Paper)(({ theme: t }) => ({
    padding: t.spacing(3),
    backgroundColor: t.palette.mode === 'light' 
      ? alpha(t.palette.background.paper, 0.8)
      : '#14181f',
    borderRadius: 16,
    border: `1px solid ${t.palette.divider}`,
    boxShadow: t.palette.mode === 'light'
      ? '0 4px 20px rgba(0, 0, 0, 0.05)'
      : '0 4px 20px rgba(0, 0, 0, 0.5)',
    transition: 'border-color 0.2s ease',
    backdropFilter: t.palette.mode === 'light' ? 'blur(10px)' : 'none',
    '&:hover': {
      borderColor: t.palette.primary.main
    }
  }));

  const ActionButton = styled(Button)(({ theme: t }) => ({
    borderRadius: 10,
    padding: '10px 16px',
    textTransform: 'none',
    fontSize: '0.95rem',
    fontWeight: 500,
    backgroundColor: t.palette.mode === 'light'
      ? alpha(t.palette.background.paper, 0.6)
      : '#1e242c',
    borderColor: t.palette.divider,
    color: t.palette.text.primary,
    justifyContent: 'space-between',
    '&:hover': {
      backgroundColor: t.palette.mode === 'light'
        ? alpha(t.palette.background.paper, 0.8)
        : '#262e38',
      borderColor: t.palette.primary.main
    }
  }));

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: theme.palette.background.default,
        }}
      >
        <LoadingSpinner size="large" />
        <Typography sx={{ color: theme.palette.text.secondary }}>Загрузка профиля...</Typography>
      </Box>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // Определяем, показывать ли блок с подпиской
  const showSubscriptionBlock = hasActiveSubscriptionFromUser || (subscriptionInfo?.hasActiveSubscription === true);
  const activePlan = subscriptionInfo?.plan || (hasActiveSubscriptionFromUser ? 'premium' : null);
  const activeEndDate = subscriptionInfo?.endDate || user?.subscriptionEndsAt;
  const activeRemainingDays = subscriptionInfo?.remainingDays || 
    (user?.subscriptionEndsAt ? Math.ceil((new Date(user.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        position: 'relative'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Заголовок */}
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              Профиль
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary
              }}
            >
              Управление аккаунтом и персональными данными
            </Typography>
          </Box>
        </Fade>

        {/* Ошибки */}
        {error && (
          <Zoom in={true}>
            <Box sx={{ mb: 3 }}>
              <Alert type="error" message={error} onClose={clearError} />
            </Box>
          </Zoom>
        )}

        {/* Уведомления */}
        {showAlert && (
          <Zoom in={true}>
            <Box sx={{ mb: 3 }}>
              <Alert
                type={alertType}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
                autoClose
              />
            </Box>
          </Zoom>
        )}

        {/* Основная карточка профиля */}
        <DarkPaper sx={{ mb: 3, p: 4 }}>
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        onClick={handleAvatarClick}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          border: `2px solid ${theme.palette.background.paper}`,
                          padding: '6px',
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark
                          }
                        }}
                      >
                        <PhotoCameraIcon sx={{ fontSize: 16, color: '#ffffff' }} />
                      </IconButton>
                    }
                  >
                    <Avatar
                      src={avatarSource}
                      onClick={handleAvatarClick}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        color: theme.palette.primary.main,
                        fontSize: '2rem',
                        fontWeight: 500,
                        border: `2px solid ${theme.palette.primary.main}`,
                        boxShadow: theme.shadows[3],
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      {!avatarSource && getUserInitials()}
                    </Avatar>
                  </Badge>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {user.fullName || `${user.lastName} ${user.firstName}`}
                    </Typography>
                    <Chip
                      label={user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      size="small"
                      sx={{
                        bgcolor: alpha(
                          user.role === 'admin' ? theme.palette.primary.main : theme.palette.text.secondary,
                          0.1
                        ),
                        color: user.role === 'admin' ? theme.palette.primary.main : theme.palette.text.secondary,
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        height: 24,
                      }}
                    />
                    {user.authProvider === 'yandex' && (
                      <Chip
                        icon={
                          <Box
                            component="img"
                            src={yandexIconUrl}
                            alt="Yandex"
                            sx={{
                              width: 14,
                              height: 14,
                            }}
                          />
                        }
                        label="Яндекс ID"
                        size="small"
                        sx={{
                          bgcolor: alpha('#FC3F1D', 0.1),
                          color: '#FC3F1D',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      {user.email}
                    </Typography>
                    <Tooltip title="Копировать">
                      <IconButton 
                        size="small" 
                        onClick={handleCopyEmail} 
                        sx={{ 
                          p: 0.5,
                          color: theme.palette.text.secondary,
                          '&:hover': { color: theme.palette.primary.main }
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      Статус: <span style={{ color: theme.palette.success.main }}>Активен</span>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/profile/edit')}
                >
                  Редактировать
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color={theme.palette.text.secondary} sx={{ display: 'block', mb: 0.5 }}>
                    Зарегистрирован
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {formatDateTime(user.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LoginIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color={theme.palette.text.secondary} sx={{ display: 'block', mb: 0.5 }}>
                    Последний вход
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {user.lastLogin ? formatDateTime(user.lastLogin) : '—'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DarkPaper>

        {/* Блок с информацией о подписке - показываем если есть активная подписка */}
        {showSubscriptionBlock && activePlan && (
          <DarkPaper sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(getPlanColor(activePlan), 0.1),
                  borderRadius: '10px',
                }}
              >
                {getPlanIcon(activePlan)}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                Моя подписка
              </Typography>
              <Chip
                label={subscriptionInfo?.status === 'cancelled' ? 'Отменена' : 'Активна'}
                size="small"
                sx={{
                  bgcolor: alpha(
                    subscriptionInfo?.status === 'cancelled' ? theme.palette.warning.main : theme.palette.success.main,
                    0.1
                  ),
                  color: subscriptionInfo?.status === 'cancelled' ? theme.palette.warning.main : theme.palette.success.main,
                }}
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.background.paper, 0.5), 
                  borderRadius: 3,
                }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
                    Тариф
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPlanIcon(activePlan)}
                    <Typography variant="h6" sx={{ fontWeight: 600, color: getPlanColor(activePlan) }}>
                      {getPlanName(activePlan)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.background.paper, 0.5), 
                  borderRadius: 3,
                }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
                    Действует до
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                    <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                      {formatDate(activeEndDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {activeRemainingDays > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Осталось дней
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: getPlanColor(activePlan) }}>
                    {activeRemainingDays} из 30
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(activeRemainingDays / 30) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(getPlanColor(activePlan), 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPlanColor(activePlan),
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PaymentIcon />}
                onClick={() => navigate('/profile/subscription')}
              >
                Управление подпиской
              </Button>
              <Button
                variant="text"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshData}
                disabled={isSubscriptionLoading}
              >
                Обновить
              </Button>
            </Box>
          </DarkPaper>
        )}

        {/* Если нет активной подписки, показываем предложение */}
        {!showSubscriptionBlock && (
          <DarkPaper sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: '10px',
                }}
              >
                <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                Нет активной подписки
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              Оформите подписку, чтобы получить доступ ко всем функциям приложения
            </Typography>
            
            <Button
              variant="contained"
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/profile/subscription')}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Оформить подписку
            </Button>
          </DarkPaper>
        )}

        {/* Меню аватара */}
        <Menu
          anchorEl={avatarMenuAnchor}
          open={Boolean(avatarMenuAnchor)}
          onClose={handleAvatarMenuClose}
          TransitionComponent={Fade}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
          />
          <MenuItem onClick={() => fileInputRef.current?.click()}>
            <ListItemIcon>
              <CloudUploadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Загрузить фото</ListItemText>
          </MenuItem>
          
          {user.avatarUrl && (
            <MenuItem onClick={() => setDeleteDialogOpen(true)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Удалить фото</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Диалог загрузки аватара */}
        <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Загрузка аватара</DialogTitle>
          <DialogContent>
            {previewUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Avatar src={previewUrl} sx={{ width: 150, height: 150 }} />
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Выберите изображение для аватара. Рекомендуемый размер: 400x400 пикселей.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadDialogClose}>Отмена</Button>
            <Button onClick={handleUploadAvatar} variant="contained" disabled={isUploading}>
              {isUploading ? <CircularProgress size={24} /> : 'Загрузить'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог удаления аватара */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Удалить аватар?</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить аватар?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleDeleteAvatar} color="error" disabled={isDeleting}>
              {isDeleting ? <CircularProgress size={24} /> : 'Удалить'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Информация о Яндекс ID */}
        {user.authProvider !== 'yandex' && <YandexProfileInfo />}

        {/* Быстрые действия */}
        <DarkPaper>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '10px',
              }}
            >
              <FlashOnIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Быстрые действия
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <ActionButton
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/profile/edit')}
              >
                Редактировать
              </ActionButton>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ActionButton
                fullWidth
                variant="outlined"
                startIcon={<SecurityIcon />}
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/profile/security')}
              >
                Безопасность
              </ActionButton>
            </Grid> 
            <Grid item xs={12} sm={6} md={3}>
              <ActionButton
                fullWidth
                variant="outlined"
                startIcon={<PaymentIcon />}
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/profile/subscription')}
              >
                Подписка
              </ActionButton>
            </Grid>
          </Grid>
        </DarkPaper>
      </Container>
    </Box>
  );
};

export default ProfileView;