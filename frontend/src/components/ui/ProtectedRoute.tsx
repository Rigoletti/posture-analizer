import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { LoadingSpinner } from './LoadingSpinner';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Lock as LockIcon,
  VerifiedUser as VerifiedUserIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePremium?: boolean;
  requireVerified?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requirePremium = false,
  requireVerified = false,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, isLoading, hasPremiumAccess, isAdmin, isEmailVerified } = useAuthStore();
  const location = useLocation();

  // Показываем загрузку
  if (isLoading) {
    return <LoadingSpinner fullScreen size="medium" />;
  }

  // Если требуется авторизация, но пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Если пользователь авторизован, но на странице логина/регистрации
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Если требуется роль админа, но пользователь не админ
  if (requireAdmin && !isAdmin()) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        p: 3
      }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Доступ запрещен</AlertTitle>
            Эта страница доступна только администраторам
          </Alert>
          <Typography variant="body1" color="textSecondary" paragraph>
            У вас нет прав для просмотра этой страницы.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
          >
            Вернуться на главную
          </Button>
        </Paper>
      </Box>
    );
  }

  // Если требуется подтверждение email, но email не подтвержден
  if (requireVerified && !isEmailVerified()) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        p: 3
      }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Email не подтвержден</AlertTitle>
            Для доступа к этой странице необходимо подтвердить email
          </Alert>
          <Typography variant="body1" color="textSecondary" paragraph>
            Пожалуйста, проверьте вашу почту и перейдите по ссылке для подтверждения email.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.href = `/verify-email?email=${user?.email}`}
            sx={{ mt: 2 }}
          >
            Подтвердить email
          </Button>
        </Paper>
      </Box>
    );
  }

  // Если требуется премиум доступ, проверяем его
  if (requirePremium && !hasPremiumAccess()) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        p: 3
      }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <VerifiedUserIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Требуется подписка</AlertTitle>
            Для доступа к этому разделу необходима активная подписка
          </Alert>
          <Typography variant="body1" color="textSecondary" paragraph>
            Оформите подписку, чтобы получить доступ ко всем функциям приложения:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/profile/subscription'}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              }}
            >
              Перейти к подпискам
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/'}
            >
              На главную
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Все проверки пройдены - рендерим дочерние компоненты
  return <>{children}</>;
};