import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme, alpha } from '@mui/material';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isLoginPage = location.pathname === '/login';
  const [prevPage, setPrevPage] = useState(isLoginPage);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    if (prevPage !== isLoginPage) {
      setDirection(isLoginPage ? 'right' : 'left');
    }
    setPrevPage(isLoginPage);
  }, [isLoginPage, prevPage]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? `linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)`
          : `linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f1f5f9 100%)`,
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Animated Background Shapes */}
      <Box sx={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Box
            key={num}
            sx={{
              position: 'absolute',
              borderRadius: '50%',
              filter: 'blur(40px)',
              opacity: isDark ? 0.4 : 0.2,
              animation: 'floatShape 20s infinite ease-in-out',
              '@keyframes floatShape': {
                '0%, 100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
                '33%': { transform: 'translate(30px, 30px) scale(1.1) rotate(120deg)' },
                '66%': { transform: 'translate(-30px, -30px) scale(0.9) rotate(240deg)' },
              },
              ...(num === 1 && {
                width: 300, height: 300,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                top: '10%', left: '5%',
                animationDelay: '0s',
              }),
              ...(num === 2 && {
                width: 200, height: 200,
                background: `linear-gradient(135deg, #10b981, #0ea5e9)`,
                bottom: '15%', right: '10%',
                animationDelay: '-5s',
              }),
              ...(num === 3 && {
                width: 150, height: 150,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, #ec4899)`,
                top: '50%', left: '80%',
                animationDelay: '-10s',
              }),
              ...(num === 4 && {
                width: 250, height: 250,
                background: `linear-gradient(135deg, #f59e0b, #ef4444)`,
                bottom: '40%', left: '15%',
                animationDelay: '-15s',
              }),
              ...(num === 5 && {
                width: 180, height: 180,
                background: `linear-gradient(135deg, #0ea5e9, ${theme.palette.primary.main})`,
                top: '70%', right: '20%',
                animationDelay: '-7s',
              }),
            }}
          />
        ))}
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10 }}>
        {/* Header with logo and tabs */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              mb: 4,
              px: 3,
              py: 2,
              borderRadius: 3,
              bgcolor: isDark ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.common.white, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.2)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 16L16 28L4 16L16 4Z" stroke="url(#gradient)" strokeWidth="2" />
                <path d="M16 10L22 16L16 22L10 16L16 10Z" stroke="url(#gradient)" strokeWidth="2" />
                <defs>
                  <linearGradient id="gradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor={theme.palette.primary.main} />
                    <stop offset="1" stopColor={theme.palette.secondary.main} />
                  </linearGradient>
                </defs>
              </svg>
            </Box>
            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 900,
                background: isDark
                  ? `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.common.white, 0.7)} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 2,
              }}
            >
              POSTURE
            </Typography>
          </Box>

          {/* Tabs */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: isDark ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.common.white, 0.8),
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              p: 1,
              border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.1)}`,
              position: 'relative',
            }}
          >
            <Box
              component={Link}
              to="/login"
              sx={{
                flex: 1,
                textDecoration: 'none',
                position: 'relative',
                zIndex: 1,
                py: 2,
                textAlign: 'center',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                color: isLoginPage
                  ? (isDark ? theme.palette.common.white : theme.palette.primary.main)
                  : (isDark ? alpha(theme.palette.common.white, 0.6) : alpha(theme.palette.common.black, 0.6)),
                fontWeight: 600,
                '&:hover': {
                  color: isDark ? theme.palette.common.white : theme.palette.primary.main,
                },
              }}
            >
              Вход
            </Box>
            <Box
              component={Link}
              to="/register"
              sx={{
                flex: 1,
                textDecoration: 'none',
                position: 'relative',
                zIndex: 1,
                py: 2,
                textAlign: 'center',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                color: !isLoginPage
                  ? (isDark ? theme.palette.common.white : theme.palette.primary.main)
                  : (isDark ? alpha(theme.palette.common.white, 0.6) : alpha(theme.palette.common.black, 0.6)),
                fontWeight: 600,
                '&:hover': {
                  color: isDark ? theme.palette.common.white : theme.palette.primary.main,
                },
              }}
            >
              Регистрация
            </Box>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                width: 'calc(50% - 8px)',
                bgcolor: isDark ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.5)}`,
                transition: 'transform 0.3s ease',
                transform: isLoginPage ? 'translateX(8px)' : 'translateX(calc(100% + 8px))',
              }}
            />
          </Box>
        </Box>

        {/* Main Card */}
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={location.pathname}
            timeout={400}
            classNames="page-transition"
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.7)
                  : alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(40px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: `0 25px 50px -12px ${alpha(theme.palette.common.black, 0.2)}`,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: isDark ? theme.palette.common.white : theme.palette.text.primary,
                  }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? alpha(theme.palette.common.white, 0.7) : theme.palette.text.secondary,
                      maxWidth: 400,
                      mx: 'auto',
                      p: 1.5,
                      bgcolor: isDark ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.common.black, 0.03),
                      borderRadius: 2,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              <Box>{children}</Box>

              <Box
                sx={{
                  textAlign: 'center',
                  pt: 3,
                  mt: 3,
                  borderTop: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.1)}`,
                }}
              >
                <Typography variant="body2" sx={{ color: isDark ? alpha(theme.palette.common.white, 0.7) : theme.palette.text.secondary }}>
                  {isLoginPage ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                  <Box
                    component={Link}
                    to={isLoginPage ? '/register' : '/login'}
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'inline-block',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {isLoginPage ? 'Зарегистрируйтесь' : 'Войдите'}
                  </Box>
                </Typography>
              </Box>
            </Paper>
          </CSSTransition>
        </SwitchTransition>
      </Container>

      <style>{`
        .page-transition-enter {
          opacity: 0;
          transform: translateX(${direction === 'right' ? '20px' : '-20px'}) scale(0.98);
        }
        .page-transition-enter-active {
          opacity: 1;
          transform: translateX(0) scale(1);
          transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
                      transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .page-transition-exit {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .page-transition-exit-active {
          opacity: 0;
          transform: translateX(${direction === 'right' ? '-20px' : '20px'}) scale(0.98);
          transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1),
                      transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </Box>
  );
};

export default AuthLayout;