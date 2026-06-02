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
  alpha,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Badge,
  Stack
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
  KeyboardArrowDown as ArrowDownIcon,
  FiberManualRecord as RecordIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Login as LoginIcon,
  AppRegistration as RegisterIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../store/auth';
import { useThemeMode } from '../../theme/ThemeContext';
import { usePostureAnalysis } from '../../contexts/PostureAnalysisContext';

// Мемоизированный компонент навигационной кнопки
const NavButton = memo(({ item, isActive, isMobile }: { item: any; isActive: boolean; isMobile?: boolean }) => {
  const Icon = item.icon;
  const theme = useTheme();
  
  if (isMobile) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          to={item.path}
          selected={isActive}
          sx={{
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }
            }
          }}
        >
          <Icon sx={{ mr: 2 }} />
          <ListItemText 
            primary={item.label}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: isActive ? 600 : 500
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <Button
      component={Link}
      to={item.path}
      startIcon={<Icon />}
      sx={{
        color: isActive ? 'primary.main' : 'text.secondary',
        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.12),
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
const UserAvatar = memo(({ user, size = 32 }: { user: any; size?: number }) => {
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
    <Avatar 
      src={src} 
      sx={{ 
        width: size, 
        height: size, 
        bgcolor: 'primary.main', 
        fontSize: size * 0.4375, 
        fontWeight: 600 
      }}
    >
      {!src && initials}
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';

// Компонент мобильного меню (без анимаций)
const MobileMenu = memo(({ 
  open, 
  onClose, 
  navItems, 
  location, 
  isAuthenticated, 
  user,
  onLogout,
  onThemeToggle,
  mode,
  onLogin,
  onRegister
}: any) => {
  const theme = useTheme();
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: 320,
          borderRadius: { xs: 0, sm: 2 },
          borderTopLeftRadius: { xs: 0, sm: 16 },
          borderBottomLeftRadius: { xs: 0, sm: 16 },
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {isAuthenticated && user ? (
          <Box 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              textAlign: 'center'
            }}
          >
            <UserAvatar user={user} size={64} />
            <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 600 }}>
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName.charAt(0)}.`
                : user.firstName || user.fullName || 'Пользователь'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {user.email}
            </Typography>
          </Box>
        ) : (
          <Box 
            sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}
            >
              <PersonIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Гость
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Войдите или зарегистрируйтесь
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button
                variant="outlined"
                size="small"
                onClick={onLogin}
                startIcon={<LoginIcon />}
                sx={{ borderRadius: 2 }}
              >
                Вход
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={onRegister}
                startIcon={<RegisterIcon />}
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              >
                Регистрация
              </Button>
            </Stack>
          </Box>
        )}

        <List sx={{ mb: 2 }}>
          {navItems.map((item: any) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/admin' && location.pathname.startsWith('/admin'));
            
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  onClick={onClose}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      }
                    }
                  }}
                >
                  <item.icon sx={{ mr: 2 }} />
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2 }} />

        <List>
          {isAuthenticated && (
            <>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/profile" onClick={onClose}>
                  <PersonIcon sx={{ mr: 2 }} />
                  <ListItemText primary="Профиль" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/sessions" onClick={onClose}>
                  <HistoryIcon sx={{ mr: 2 }} />
                  <ListItemText primary="История сессий" />
                </ListItemButton>
              </ListItem>
            </>
          )}
          
          <ListItem disablePadding>
            <ListItemButton onClick={onThemeToggle}>
              {mode === 'light' ? <DarkIcon sx={{ mr: 2 }} /> : <LightIcon sx={{ mr: 2 }} />}
              <ListItemText primary={mode === 'light' ? 'Тёмная тема' : 'Светлая тема'} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/help" onClick={onClose}>
              <HelpIcon sx={{ mr: 2 }} />
              <ListItemText primary="Помощь" />
            </ListItemButton>
          </ListItem>

          {isAuthenticated && (
            <>
              <Divider sx={{ my: 2 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={onLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 2 }} />
                  <ListItemText primary="Выйти" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
});

MobileMenu.displayName = 'MobileMenu';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { mode, toggleTheme } = useThemeMode();
  const { user, isAuthenticated, logout } = useAuthStore();
  const postureState = usePostureAnalysis();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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

  // Мемоизируем стили AppBar
  const appBarStyle = useMemo(() => ({
    position: 'sticky' as const,
    color: 'default' as const,
    elevation: 0,
    backdropFilter: 'blur(10px)',
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(255, 255, 255, 0.9)' 
      : 'rgba(17, 24, 39, 0.9)',
    borderBottom: `1px solid ${theme.palette.divider}`,
  }), [theme.palette.mode, theme.palette.divider]);

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
      setMobileDrawerOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate, handleMenuClose]);

  const toggleMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(prev => !prev);
  }, []);

  const handleLogin = useCallback(() => {
    setMobileDrawerOpen(false);
    navigate('/login');
  }, [navigate]);

  const handleRegister = useCallback(() => {
    setMobileDrawerOpen(false);
    navigate('/register');
  }, [navigate]);

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

  // Мемоизированный индикатор осанки
  const postureIndicator = useMemo(() => {
    if (!postureState.isRunning) return null;
    
    const hasIssues = postureState.issues.length > 0;
    const color = hasIssues ? 'error.main' : 'success.main';
    const bgColor = hasIssues 
      ? alpha(theme.palette.error.main, 0.12)
      : alpha(theme.palette.success.main, 0.12);
    const label = hasIssues ? 'Нарушение' : `Анализ ${postureState.postureScore}%`;
    
    return (
      <Tooltip title={
        hasIssues
          ? `Обнаружено нарушение: ${postureState.issues.map(i => i.type).join(', ')}`
          : 'Анализ осанки активен. Осанка в норме.'
      }>
        <Chip
          component={Link}
          to="/"
          icon={<RecordIcon sx={{ fontSize: 14, color }} />}
          label={label}
          size="small"
          clickable
          variant="filled"
          sx={{
            height: 28,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.75rem',
            cursor: 'pointer',
            bgcolor: bgColor,
            color: color,
            border: `1px solid ${alpha(hasIssues ? theme.palette.error.main : theme.palette.success.main, 0.2)}`,
            '&:hover': {
              bgcolor: hasIssues
                ? alpha(theme.palette.error.main, 0.2)
                : alpha(theme.palette.success.main, 0.2),
            },
            display: { xs: 'none', sm: 'inline-flex' }
          }}
        />
      </Tooltip>
    );
  }, [postureState.isRunning, postureState.issues, postureState.postureScore, theme.palette]);

  // Мобильная версия
  if (isMobile) {
    return (
      <>
        <AppBar sx={appBarStyle}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ minHeight: 56, justifyContent: 'space-between' }}>
              {/* Логотип */}
              <Box
                component={Link}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textDecoration: 'none',
                  color: 'text.primary',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
              </Box>

              {/* Правая секция */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Индикатор осанки */}
                {postureState.isRunning && (
                  <Badge
                    variant="dot"
                    color={postureState.issues.length > 0 ? "error" : "success"}
                  >
                    <IconButton
                      component={Link}
                      to="/"
                      size="small"
                      sx={{ 
                        bgcolor: postureState.issues.length > 0
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.success.main, 0.1),
                      }}
                    >
                      <RecordIcon sx={{ 
                        fontSize: 20,
                        color: postureState.issues.length > 0 ? 'error.main' : 'success.main'
                      }} />
                    </IconButton>
                  </Badge>
                )}

                <IconButton
                  onClick={toggleTheme}
                  size="small"
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  {mode === 'light' ? <DarkIcon /> : <LightIcon />}
                </IconButton>

                <IconButton
                  onClick={toggleMobileDrawer}
                  size="small"
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <MobileMenu
          open={mobileDrawerOpen}
          onClose={toggleMobileDrawer}
          navItems={navItems}
          location={location}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          onThemeToggle={toggleTheme}
          mode={mode}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </>
    );
  }

  // Десктопная версия
  return (
    <AppBar sx={appBarStyle}>
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
              mr: { sm: 2, md: 4 }
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
            gap: { sm: 0.5, md: 1 },
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
                  isMobile={false}
                />
              );
            })}
          </Box>

          {/* Правая секция */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { sm: 0.5, md: 1 } }}>
            {/* Индикатор фонового анализа осанки */}
            {postureIndicator}

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
                      px: { sm: 0.5, md: 1 },
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: 'text.secondary'
                      }
                    }}
                  >
                    <UserAvatar user={user} size={32} />
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
                      boxShadow: theme.shadows[10]
                    }
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.04) 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <UserAvatar user={user} size={48} />
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

                  <MenuItem component={Link} to="/sessions" sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">История сессий</Typography>
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
                  sx={{ borderRadius: 2, px: { xs: 1.5, sm: 2 } }}
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
                    px: { xs: 1.5, sm: 2 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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