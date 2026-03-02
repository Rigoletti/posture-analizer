import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  useTheme,
  alpha,
  Fade,
  Grow,
  Zoom
} from '@mui/material';
import { motion } from 'framer-motion';

interface ProfileLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getTabColor = (path: string) => {
    return isActive(path) ? theme.palette.primary.main : theme.palette.text.secondary;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        background: isLight
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4
      }}
    >
      {/* Анимированный фон */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isLight
            ? `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%),
               radial-gradient(circle at 40% 40%, ${alpha(theme.palette.warning.main, 0.02)} 0%, transparent 50%)`
            : `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%),
               radial-gradient(circle at 40% 40%, ${alpha(theme.palette.warning.main, 0.05)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Анимированные частицы */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          component={motion.div}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            x: [0, Math.sin(i) * 50, 0],
            y: [0, Math.cos(i) * 50, 0]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          sx={{
            position: 'fixed',
            width: 100 + i * 50,
            height: 100 + i * 50,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 70%)`,
            top: `${20 + i * 10}%`,
            left: `${10 + i * 15}%`,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      ))}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    mb: 0.5,
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
                  Управление вашим аккаунтом и настройками
                </Typography>
              </Box>

              <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                <Box
                  component={Link}
                  to="/"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.secondary,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      color: theme.palette.primary.main,
                      transform: 'translateX(-4px)',
                      borderColor: theme.palette.primary.main,
                      '& svg': {
                        transform: 'translateX(-4px)'
                      }
                    }
                  }}
                >
                  <Box
                    component="svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    sx={{
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <path 
                      d="M19 12H5M5 12L12 19M5 12L12 5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    На главную
                  </Typography>
                </Box>
              </Zoom>
            </Stack>

            {/* Табы */}
            <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={1000}>
              <Paper
                elevation={0}
                sx={{
                  display: 'inline-flex',
                  p: 0.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 4,
                  gap: 0.5
                }}
              >
                {[
                  { path: '/profile', label: 'Профиль', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )},
                  { path: '/profile/edit', label: 'Редактировать', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )},
                  { path: '/profile/security', label: 'Безопасность', icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                ].map((tab, index) => {
                  const active = isActive(tab.path);
                  return (
                    <Box
                      key={tab.path}
                      component={Link}
                      to={tab.path}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2.5,
                        py: 1.5,
                        borderRadius: 3,
                        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                        textDecoration: 'none',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.05)
                        },
                        '& svg': {
                          transition: 'transform 0.2s ease'
                        },
                        '&:hover svg': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'inherit'
                        }}
                      >
                        {tab.icon}
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: active ? 600 : 500,
                          display: { xs: 'none', sm: 'block' }
                        }}
                      >
                        {tab.label}
                      </Typography>
                      
                      {/* Индикатор активной вкладки */}
                      {active && (
                        <Box
                          component={motion.div}
                          layoutId="tabIndicator"
                          sx={{
                            position: 'absolute',
                            bottom: -5,
                            left: '20%',
                            right: '20%',
                            height: 3,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            borderRadius: '3px 3px 0 0'
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Paper>
            </Grow>
          </Box>
        </Fade>

        {/* Main Content */}
        <Grow in={true} timeout={1200}>
          <Box sx={{ mb: 4 }}>
            {/* Заголовок страницы */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center" 
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    mb: 0.5,
                    position: 'relative',
                    display: 'inline-block',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -4,
                      left: 0,
                      width: 40,
                      height: 3,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      borderRadius: 2
                    }
                  }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {/* Декоративные точки */}
              <Stack direction="row" spacing={1}>
                {[1, 2, 3].map((dot) => (
                  <Box
                    key={dot}
                    component={motion.div}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: dot * 0.3
                    }}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      opacity: 0.3
                    }}
                  />
                ))}
              </Stack>
            </Stack>

            {/* Карточка с контентом */}
            <Paper
              elevation={isLight ? 2 : 0}
              sx={{
                position: 'relative',
                bgcolor: isLight
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: isLight
                  ? '0 8px 32px rgba(0, 0, 0, 0.05)'
                  : '0 8px 32px rgba(0, 0, 0, 0.4)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                  opacity: 0.5
                }
              }}
            >
              {/* Эффект свечения */}
              <Box
                component={motion.div}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
                {children}
              </Box>
            </Paper>
          </Box>
        </Grow>

        {/* Footer */}
        <Fade in={true} timeout={1500}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems="center"
            spacing={2}
            sx={{
              pt: 4,
              borderTop: `1px solid ${theme.palette.divider}`
            }}
          >
            <Stack direction="row" spacing={3}>
              {[
                { icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ), text: 'Ваши данные защищены' },
                { icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ), text: 'SSL-шифрование' }
              ].map((item, index) => (
                <Stack
                  key={index}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  <Box sx={{ color: 'inherit' }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {item.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
              © {new Date().getFullYear()} Posture Analyzer
            </Typography>
          </Stack>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProfileLayout;