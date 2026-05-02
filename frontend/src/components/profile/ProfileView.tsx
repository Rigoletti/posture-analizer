import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../../api/auth';
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
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Login as LoginIcon,
  Badge as BadgeIcon,
  ChevronRight as ChevronRightIcon,
  Security as SecurityIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  FlashOn as FlashOnIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Импортируем иконку Яндекса для чипа
import yandexIconUrl from '../../assets/img/icons/icon_yandex.svg';

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

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Логируем изменения user
  useEffect(() => {
    if (user) {
      console.log('=== USER DATA IN PROFILE VIEW ===');
      console.log('Full user object:', user);
      console.log('avatarUrl:', user.avatarUrl);
      console.log('avatar:', user.avatar);
      console.log('authProvider:', user.authProvider);
      console.log('yandexAvatar:', user.yandexAvatar);
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

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      showNotification('Пожалуйста, выберите изображение', 'error');
      return;
    }

    // Проверяем размер файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимальный размер: 5MB', 'error');
      return;
    }

    // Создаем превью
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
      console.log('Uploading avatar...', selectedFile);
      
      const response = await authApi.uploadAvatar(selectedFile);
      console.log('Upload response:', response);
      
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
      console.log('No user, returning undefined');
      return undefined;
    }
    
    console.log('=== GET AVATAR SOURCE ===');
    console.log('1. Checking uploaded avatar (avatarUrl):', user.avatarUrl);
    
    // Приоритет 1: Загруженный пользователем аватар
    if (user.avatarUrl) {
      console.log('✅ USING UPLOADED AVATAR:', user.avatarUrl);
      return user.avatarUrl;
    }
    
    console.log('2. Checking Yandex avatar:', user.yandexAvatar);
    console.log('3. Auth provider:', user.authProvider);
    
    // Приоритет 2: Аватар из Яндекса (только если нет загруженного)
    if (user.authProvider === 'yandex' && user.yandexAvatar) {
      console.log('✅ USING YANDEX AVATAR:', user.yandexAvatar);
      return user.yandexAvatar;
    }
    
    console.log('❌ No avatar available, using initials');
    return undefined;
  };

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
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
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

  const formatDate = (dateString: string) => {
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
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

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

  const InfoCard = styled(Box)(({ theme: t }) => ({
    padding: t.spacing(2),
    backgroundColor: t.palette.mode === 'light'
      ? alpha(t.palette.background.paper, 0.6)
      : '#1e242c',
    borderRadius: 12,
    border: `1px solid ${t.palette.divider}`
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        position: 'relative'
      }}
    >
      {/* Анимированный фон */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'light'
          ? `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`
          : `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0
      }} />

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
            <Grid item xs={12} md={8}>
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
                        border: '1px solid',
                        borderColor: alpha(
                          user.role === 'admin' ? theme.palette.primary.main : theme.palette.text.secondary,
                          0.2
                        )
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
                              filter: theme.palette.mode === 'light'
                                ? 'brightness(0) saturate(100%) invert(24%) sepia(95%) saturate(7489%) hue-rotate(357deg) brightness(97%) contrast(107%)'
                                : 'brightness(0) saturate(100%) invert(32%) sepia(86%) saturate(7489%) hue-rotate(357deg) brightness(97%) contrast(107%)'
                            }}
                          />
                        }
                        label="Яндекс ID"
                        size="small"
                        sx={{
                          bgcolor: alpha('#FC3F1D', 0.1),
                          color: '#FC3F1D',
                          border: `1px solid ${alpha('#FC3F1D', 0.2)}`,
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          height: 24,
                          '& .MuiChip-icon': {
                            ml: 0.5
                          }
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

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/profile/edit')}
                  sx={{
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  Редактировать
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" color={theme.palette.text.secondary} sx={{ display: 'block', mb: 0.5 }}>
                    Зарегистрирован
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {formatDate(user.createdAt)}
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
                    {user.lastLogin ? formatDate(user.lastLogin) : '—'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DarkPaper>

        {/* Меню аватара */}
        <Menu
          anchorEl={avatarMenuAnchor}
          open={Boolean(avatarMenuAnchor)}
          onClose={handleAvatarMenuClose}
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 12,
              minWidth: 200,
              mt: 1,
              boxShadow: theme.shadows[5]
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
          />
          <MenuItem 
            onClick={() => {
              fileInputRef.current?.click();
            }}
            sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <ListItemIcon>
              <CloudUploadIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText>Загрузить фото</ListItemText>
          </MenuItem>
          
          {user.avatarUrl && (
            <MenuItem 
              onClick={() => {
                setDeleteDialogOpen(true);
                handleAvatarMenuClose();
              }}
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              <ListItemIcon>
                <DeleteIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText>Удалить фото</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Диалог загрузки аватара */}
        <Dialog 
          open={uploadDialogOpen} 
          onClose={handleUploadDialogClose}
          TransitionComponent={Zoom}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 16,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[10],
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <PhotoCameraIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Загрузка аватара
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Предпросмотр изображения
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ py: 3 }}>
            {previewUrl && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                borderRadius: 12,
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Avatar
                  src={previewUrl}
                  sx={{
                    width: 200,
                    height: 200,
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: theme.shadows[5]
                  }}
                />
              </Box>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Рекомендации:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2, color: theme.palette.text.primary }}>
                <li>Квадратное изображение</li>
                <li>Минимум 400x400 пикселей</li>
                <li>Максимальный размер 5MB</li>
                <li>Форматы: JPEG, PNG, GIF, WEBP</li>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
            <Button 
              onClick={handleUploadDialogClose}
              disabled={isUploading}
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.secondary, 0.1)
                }
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleUploadAvatar}
              variant="contained"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: theme.palette.primary.contrastText,
                px: 3,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                },
                '&:disabled': {
                  background: alpha(theme.palette.primary.main, 0.5)
                }
              }}
            >
              {isUploading ? 'Загрузка...' : 'Сохранить'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог удаления аватара */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          TransitionComponent={Zoom}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 16,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[10],
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <DeleteIcon sx={{ color: theme.palette.error.main }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Удалить аватар
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Вы уверены, что хотите удалить фото профиля?
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Alert 
              type="warning" 
              message="После удаления будет отображаться аватар с инициалами"
            />
          </DialogContent>
          
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              sx={{
                color: theme.palette.text.secondary,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.secondary, 0.1)
                }
              }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleDeleteAvatar}
              variant="contained"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={18} /> : null}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                bgcolor: theme.palette.error.main,
                color: theme.palette.error.contrastText,
                px: 3,
                '&:hover': {
                  bgcolor: theme.palette.error.dark
                },
                '&:disabled': {
                  bgcolor: alpha(theme.palette.error.main, 0.5)
                }
              }}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
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
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
                startIcon={<EditIcon sx={{ color: theme.palette.primary.main }} />}
                endIcon={<ChevronRightIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />}
                onClick={() => navigate('/profile/edit')}
              >
                Редактировать
              </ActionButton>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ActionButton
                fullWidth
                variant="outlined"
                startIcon={<SecurityIcon sx={{ color: theme.palette.primary.main }} />}
                endIcon={<ChevronRightIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />}
                onClick={() => navigate('/profile/security')}
              >
                Безопасность
              </ActionButton>
            </Grid> 
            <Grid item xs={12} sm={6} md={3}>
              <ActionButton
                fullWidth
                variant="outlined"
                startIcon={<PaymentIcon sx={{ color: theme.palette.primary.main }} />}
                endIcon={<ChevronRightIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />}
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