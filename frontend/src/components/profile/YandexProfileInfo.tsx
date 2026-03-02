import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  LinkOff as LinkOffIcon,
  ContentCopy as ContentCopyIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuthStore } from '../../store/auth';
import { yandexAuthApi } from '../../api/yandexAuth';
import yandexIconUrl from '../../assets/img/icons/icon_yandex.svg';

const YandexConnectButton = styled(Button)(({ theme }) => ({
  background: '#1E2A3A',
  color: '#FFFFFF',
  fontWeight: 500,
  fontSize: '15px',
  textTransform: 'none',
  borderRadius: '12px',
  padding: '12px 20px',
  border: '1px solid #FC3F1D',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: '#232F41',
    borderColor: '#FF5722',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
  },
  '&:active': {
    background: '#1A2533',
    transform: 'translateY(0)',
  },
  '& .MuiButton-startIcon': {
    marginRight: '12px',
    '& img': {
      width: '22px',
      height: '22px',
      filter: 'brightness(0) saturate(100%) invert(32%) sepia(86%) saturate(7489%) hue-rotate(357deg) brightness(97%) contrast(107%)',
    }
  }
}));

const YandexProfileInfo: React.FC = () => {
  const { 
    user, 
    refreshUserData,
    isLoading 
  } = useAuthStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isYandexUser = user?.authProvider === 'yandex';
  const yandexAvatar = user?.yandexAvatar;
  
  // Проверяем, есть ли загруженный аватар
  const hasUploadedAvatar = !!(user as any)?.avatarUrl;

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await yandexAuthApi.redirectToYandex();
    } catch (err: any) {
      setError(err.message || 'Ошибка при подключении Яндекса');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    
    try {
      await yandexAuthApi.disconnectYandex();
      await refreshUserData();
      setSuccess('Яндекс аккаунт успешно отключен');
      setDisconnectDialogOpen(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при отключении Яндекса');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setSuccess('Email скопирован');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={40} sx={{ color: '#FC3F1D' }} />
      </Box>
    );
  }

  // Если пользователь авторизован через Яндекс - показываем карточку с информацией
  if (isYandexUser) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5,
          backgroundColor: '#14181f',
          borderRadius: 12,
          border: '1px solid #2a313c',
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#1e2c3a',
              borderRadius: '10px',
              border: '1px solid #2a384a',
            }}
          >
            <img 
              src={yandexIconUrl} 
              alt="Yandex" 
              style={{ 
                width: '22px', 
                height: '22px',
                filter: 'brightness(0) saturate(100%) invert(32%) sepia(86%) saturate(7489%) hue-rotate(357deg) brightness(97%) contrast(107%)'
              }} 
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
              Аккаунт Яндекса
            </Typography>
            <Typography variant="caption" sx={{ color: '#8a9bb5' }}>
              {hasUploadedAvatar 
                ? 'Подключен, но используется загруженное фото' 
                : 'Используется для входа'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasUploadedAvatar && (
              <Tooltip title="Используется ваше фото">
                <PhotoCameraIcon sx={{ color: '#8ab3ff', fontSize: 20 }} />
              </Tooltip>
            )}
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
              label="Активен"
              size="small"
              sx={{
                bgcolor: alpha('#10b981', 0.1),
                color: '#6fcf97',
                border: `1px solid ${alpha('#10b981', 0.2)}`,
                fontWeight: 400,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-icon': {
                  color: '#6fcf97',
                  fontSize: 14
                }
              }}
            />
          </Box>
        </Box>
        
        {hasUploadedAvatar && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #2a313c' }}>
            <Typography variant="body2" sx={{ color: '#8a9bb5' }}>
              <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              Вы используете загруженное фото профиля. Аватар из Яндекса не отображается.
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <>
      

      {/* Disconnect Dialog */}
      <Dialog 
        open={disconnectDialogOpen} 
        onClose={() => setDisconnectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 16,
            bgcolor: '#14181f',
            border: '1px solid #2a313c',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
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
                bgcolor: alpha('#ef4444', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${alpha('#ef4444', 0.2)}`,
              }}
            >
              <LinkOffIcon sx={{ color: '#ef4444' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 500 }}>
                Отключить Яндекс ID
              </Typography>
              <Typography variant="body2" sx={{ color: '#8a9bb5' }}>
                Вы уверены, что хотите отключить?
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ borderColor: '#2a313c' }}>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              borderRadius: '10px',
              bgcolor: alpha('#f59e0b', 0.1),
              color: '#f59e0b',
              border: `1px solid ${alpha('#f59e0b', 0.2)}`,
              '& .MuiAlert-icon': {
                color: '#f59e0b'
              }
            }}
          >
            После отключения вход через Яндекс станет недоступен.
            Вход будет возможен только по паролю.
          </Alert>
          
          <Typography variant="body2" sx={{ color: '#d1dbe6' }}>
            Вы сможете подключить Яндекс ID снова в любое время.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2a313c' }}>
          <Button 
            onClick={() => setDisconnectDialogOpen(false)}
            disabled={isDisconnecting}
            sx={{
              color: '#d1dbe6',
              borderRadius: '10px',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#1e242c'
              }
            }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDisconnect}
            variant="contained"
            disabled={isDisconnecting}
            startIcon={isDisconnecting ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : null}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              bgcolor: '#ef4444',
              color: '#ffffff',
              px: 3,
              '&:hover': {
                bgcolor: '#dc2626'
              },
              '&:disabled': {
                bgcolor: alpha('#ef4444', 0.5)
              }
            }}
          >
            {isDisconnecting ? 'Отключение...' : 'Отключить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default YandexProfileInfo;