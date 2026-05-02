import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { Send, ArrowBack, Email, CheckCircle } from '@mui/icons-material';
import { authApi } from '../../api/auth';

const PendingVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [email, setEmail] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  
  // Получаем email из location state
  useEffect(() => {
    const stateEmail = location.state?.email;
    
    if (stateEmail) {
      setEmail(stateEmail);
    } else {
      setMessage('Email не найден. Пожалуйста, вернитесь к регистрации.');
      setMessageType('error');
    }
  }, [location.state]);

  // Таймер для повторной отправки
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleResendCode = async () => {
    if (!email || loading || countdown > 0) return;

    setLoading(true);
    setMessage('');
    try {
      await authApi.resendVerificationCode(email);
      setMessage('✅ Новый код подтверждения отправлен на ваш email');
      setMessageType('success');
      setCountdown(60);
    } catch (error: any) {
      setMessage(error.message || '❌ Не удалось отправить код');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleVerifyCode = () => {
    navigate('/verify-email', { state: { email } });
  };

  if (!email) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Paper 
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)',
            borderRadius: 4,
            border: '1px solid rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            p: 4
          }}
        >
          <Alert severity="error" sx={{ mb: 3 }}>
            Email не найден. Пожалуйста, вернитесь к регистрации.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
            fullWidth
          >
            Вернуться к регистрации
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          p: 4
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Email sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
            Подтвердите ваш email
          </Typography>
        </Box>
        
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 3,
            borderColor: 'rgba(59, 130, 246, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <CardContent>
            <Alert 
              severity="info" 
              icon={<CheckCircle />}
              sx={{ 
                mb: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                '& .MuiAlert-icon': {
                  color: '#3b82f6',
                }
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                На адрес <Box component="span" sx={{ color: '#1e40af', fontWeight: 600 }}>{email}</Box> был отправлен код подтверждения.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#475569' }}>
                Пожалуйста, введите код для подтверждения email.
              </Typography>
            </Alert>

            {message && (
              <Alert 
                severity={messageType} 
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                }}
              >
                {message}
              </Alert>
            )}

            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary" paragraph>
                <strong>Не получили код?</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#64748b' }}>
                <li>
                  <Typography variant="body2" component="span">
                    Проверьте папку "Спам" или "Нежелательная почта"
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span">
                    Убедитесь, что email адрес указан верно
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span">
                    Подождите несколько минут - иногда письма приходят с задержкой
                  </Typography>
                </li>
              </ul>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleVerifyCode}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              }
            }}
          >
            Ввести код подтверждения
          </Button>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
            onClick={handleResendCode}
            disabled={loading || countdown > 0}
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              },
              '&:disabled': {
                background: 'rgba(59, 130, 246, 0.5)',
              }
            }}
          >
            {loading ? 'Отправка...' : 
             countdown > 0 ? `Отправить код повторно (${countdown}с)` : 
             'Отправить код повторно'}
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '0.95rem',
                textTransform: 'none',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                }
              }}
            >
              Назад к входу
            </Button>
            
            <Button
              variant="text"
              onClick={handleGoHome}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '0.95rem',
                textTransform: 'none',
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.05)',
                }
              }}
            >
              На главную
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Уже подтвердили email?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 600
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Войти в систему
            </Link>
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="caption" color="textSecondary">
          © {new Date().getFullYear()} Posture Analyzer. Все права защищены.
        </Typography>
      </Box>
    </Container>
  );
};

export default PendingVerificationPage;