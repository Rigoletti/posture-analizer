import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useAuthStore } from '../../store/auth';

const YandexCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleYandexCallback, isLoading, error, clearError } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = handleYandexCallback();
        
        if (result) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Yandex callback error:', error);
        setStatus('error');
      }
    };

    processCallback();
  }, [handleYandexCallback]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/');
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          p: 4,
          textAlign: 'center'
        }}
      >
        {status === 'loading' && (
          <Box sx={{ py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3, color: '#FC3F1D' }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Авторизация через Яндекс
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Пожалуйста, подождите, мы обрабатываем данные...
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#10b981', mb: 3 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Успешная авторизация!
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Вы успешно вошли в систему через Яндекс.
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Перенаправление на главную через {countdown} секунд...
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              }}
            >
              Перейти на главную
            </Button>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ py: 4 }}>
            <ErrorIcon sx={{ fontSize: 80, color: '#ef4444', mb: 3 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Ошибка авторизации
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {error || 'Не удалось завершить авторизацию через Яндекс. Пожалуйста, попробуйте снова.'}
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              Проверьте подключение к интернету и попробуйте еще раз.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                }}
              >
                Вернуться ко входу
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Повторить
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default YandexCallbackPage;