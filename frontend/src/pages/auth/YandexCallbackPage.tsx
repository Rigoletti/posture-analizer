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
  const { handleYandexCallback, error, clearError } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('=== Yandex Callback Page ===');
        console.log('URL:', window.location.href);
        
        const result = handleYandexCallback();
        
        if (result) {
          console.log('✅ Yandex auth successful, user:', result.user?.email);
          setStatus('success');
        } else {
          console.error('❌ Failed to process Yandex callback');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('❌ Yandex callback error:', err);
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

  if (status === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3, color: '#FC3F1D' }} />
          <Typography variant="h5">Авторизация через Яндекс</Typography>
          <Typography variant="body1" color="textSecondary">
            Пожалуйста, подождите...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (status === 'success') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: '#10b981', mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Успешная авторизация!
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Вы успешно вошли в систему через Яндекс.
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            Перенаправление на главную через {countdown} секунд...
          </Alert>
          <Button variant="contained" onClick={() => navigate('/')}>
            Перейти на главную
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 80, color: '#ef4444', mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Ошибка авторизации
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {error || 'Не удалось завершить авторизацию через Яндекс.'}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Вернуться ко входу
        </Button>
      </Paper>
    </Container>
  );
};

export default YandexCallbackPage;