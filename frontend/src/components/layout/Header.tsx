import React, { useState, useCallback, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Home as HomeIcon,
  FitnessCenter as ExercisesIcon,
  RateReview as ReviewsIcon,
  BarChart as StatisticsIcon,
  AdminPanelSettings as AdminIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../store/auth';
import { useThemeMode } from '../../theme/ThemeContext';

// Мемоизированный компонент навигационной кнопки
const NavButton = memo(({ item, isActive }: { item: any; isActive: boolean }) => {
  const Icon = item.icon;
  
  return (
    <Button
      component={Link}
      to={item.path}
      startIcon={<Icon />}
      sx={{
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
          color: 'primary.main'
        },
        borderRadius: 2,
        px: { xs: 1.5, sm: 2 },
        py: 1,
        minWidth: { xs: 'auto', sm: 'auto' },
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: isActive ? 600 : 500,
          display: { xs: 'none', sm: 'block' }
        }}
      >
        {item.label}
      </Typography>
    </Button>
  );
});

NavButton.displayName = 'NavButton';

// Мемоизированный компонент аватара
const UserAvatar = memo(({ user }: { user: any }) => {
  const getInitials = useCallback(() => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  }, [user]);

  const getAvatarSrc = useCallback(() => {
    if (!user) return undefined;
    if ((user as any).avatarUrl) return (user as any).avatarUrl;
    if (user.authProvider === 'yandex' && user.yandexAvatar) return user.yandexAvatar;
    return undefined;
  }, [user]);

  const src = getAvatarSrc();
  const initials = getInitials();

  return (
    <Avatar src={src} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 600 }}>
      {!src && initials}
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Мемоизируем навигационные элементы
  const navItems = useMemo(() => {
    const items = [
      { path: '/', label: 'Анализ', icon: HomeIcon },
      { path: '/exercises', label: 'Упражнения', icon: ExercisesIcon },
      { path: '/reviews', label: 'Отзывы', icon: ReviewsIcon },
    ];

    if (isAuthenticated && user) {
      items.push({ path: '/sessions', label: 'Статистика', icon: StatisticsIcon });
    }

    if (isAuthenticated && user?.role === 'admin') {
      items.push({ path: '/admin', label: 'Админ', icon: AdminIcon });
    }

    return items;
  }, [isAuthenticated, user]);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      handleMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate, handleMenuClose]);

  const getUserName = useCallback(() => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName.charAt(0)}.`;
    }
    return user.firstName || user.fullName || 'Пользователь';
  }, [user]);

  const getFullName = useCallback(() => {
    if (!user) return 'Пользователь';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.fullName || 'Пользователь';
  }, [user]);

  return (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={0}
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: (theme) => theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.9)' 
          : 'rgba(17, 24, 39, 0.9)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 60, sm: 64 } }}>
          {/* Логотип */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '-0.5px',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
              mr: 4
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold'
              }}
            >
              P
            </Box>
            <Typography
              variant="h6"
              sx={{
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              POSTURE
            </Typography>
          </Box>

          {/* Навигация */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flex: 1,
            justifyContent: 'center'
          }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/admin' && location.pathname.startsWith('/admin'));
              
              return (
                <NavButton 
                  key={item.path}
                  item={item}
                  isActive={isActive}
                />
              );
            })}
          </Box>

          {/* Правая секция */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={toggleTheme}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {mode === 'light' ? <DarkIcon /> : <LightIcon />}
            </IconButton>

            {isAuthenticated && user ? (
              <>
                <Tooltip title="Меню пользователя">
                  <Button
                    onClick={handleMenuClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        borderColor: 'text.secondary'
                      }
                    }}
                  >
                    <UserAvatar user={user} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        display: { xs: 'none', md: 'block' }
                      }}
                    >
                      {getUserName()}
                    </Typography>
                    <ArrowDownIcon 
                      sx={{ 
                        fontSize: 20,
                        color: 'text.secondary',
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </Button>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 280,
                      borderRadius: 2,
                      boxShadow: (theme) => theme.shadows[10]
                    }
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <UserAvatar user={user} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {getFullName()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  <MenuItem component={Link} to="/profile" sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">Мой профиль</Typography>
                  </MenuItem>

                  <Divider />

                  <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <Typography variant="body2">Выйти</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="outlined" 
                  size="small" 
                  sx={{ borderRadius: 2 }}
                >
                  Вход
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  size="small"
                  disableElevation
                  sx={{
                    borderRadius: 2,
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  Регистрация
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default memo(Header);