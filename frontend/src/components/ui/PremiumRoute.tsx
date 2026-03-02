import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Alert, AlertTitle, Box, Button, Paper, Typography } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface PremiumRouteProps {
  children: React.ReactNode;
  requiredPlan?: 'basic' | 'premium';
}

export const PremiumRoute: React.FC<PremiumRouteProps> = ({ children, requiredPlan }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasPremiumAccess = user?.hasPremiumAccess || 
                          (user?.trialEndsAt && new Date(user.trialEndsAt) > new Date());

  if (!hasPremiumAccess) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        p: 3
      }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Требуется подписка</AlertTitle>
            Для доступа к этому разделу необходима активная подписка
          </Alert>
          <Typography variant="body1" color="textSecondary" paragraph>
            Оформите подписку, чтобы получить доступ ко всем функциям приложения:
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/profile/subscription"
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              mt: 2
            }}
          >
            Перейти к подпискам
          </Button>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};