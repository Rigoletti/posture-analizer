import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  alpha,
  IconButton,
  Typography,
  Container,
  Fade,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon as MuiListItemIcon,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  RateReview as ReviewsIcon,
  BarChart as StatisticsIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useThemeMode } from '../../theme/ThemeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const drawerWidth = 260;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationsEl, setNotificationsEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const isLight = theme.palette.mode === 'light';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName.charAt(0)}.`;
    }
    return user.firstName || user.fullName || 'Пользователь';
  };

  const getAvatarSrc = () => {
    if (!user) return undefined;
    if ((user as any).avatarUrl) return (user as any).avatarUrl;
    if (user.authProvider === 'yandex' && user.yandexAvatar) return user.yandexAvatar;
    return undefined;
  };

  const notifications = [
    { id: 1, text: 'Новый пользователь зарегистрировался', time: '5 минут назад', read: false },
    { id: 2, text: 'Обновление системы запланировано', time: '1 час назад', read: false },
    { id: 3, text: 'Отчет готов к просмотру', time: '2 часа назад', read: true }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    {
      text: 'Дашборд',
      icon: <DashboardIcon />,
      path: '/admin',
      active: location.pathname === '/admin'
    },
    {
      text: 'Пользователи',
      icon: <PeopleIcon />,
      path: '/admin/users',
      active: location.pathname.startsWith('/admin/users')
    },
    {
      text: 'Упражнения',
      icon: <FitnessCenterIcon />,
      path: '/admin/exercises',
      active: location.pathname.startsWith('/admin/exercises')
    },
    {
      text: 'Рекомендации',
      icon: <AssignmentIcon />,
      path: '/admin/recommendations',
      active: location.pathname.startsWith('/admin/recommendations')
    }
  ];

  const drawer = (
    <Box sx={{ 
      height: '100%',
      bgcolor: isLight ? alpha(theme.palette.background.paper, 0.95) : '#0f172a',
      color: isLight ? theme.palette.text.primary : '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Логотип и кнопка сворачивания */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between',
        py: 2,
        px: collapsed ? 1 : 2,
        borderBottom: `1px solid ${isLight ? alpha(theme.palette.divider, 0.1) : 'rgba(100, 116, 139, 0.2)'}`
      }}>
        {!collapsed ? (
          <>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AdminPanelSettingsIcon sx={{ 
                color: theme.palette.primary.main,
                fontSize: 32
              }} />
              <Typography 
                variant="h6" 
                noWrap 
                component="div"
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Админ Панель
              </Typography>
            </Stack>
            <Tooltip title="Свернуть">
              <IconButton 
                size="small"
                onClick={() => setCollapsed(true)}
                sx={{
                  color: isLight ? theme.palette.text.secondary : '#94a3b8',
                  '&:hover': {
                    color: theme.palette.primary.main
                  }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Развернуть">
            <IconButton 
              onClick={() => setCollapsed(false)}
              sx={{
                color: isLight ? theme.palette.text.secondary : '#94a3b8',
                '&:hover': {
                  color: theme.palette.primary.main
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Divider sx={{ borderColor: isLight ? alpha(theme.palette.divider, 0.1) : 'rgba(100, 116, 139, 0.2)' }} />
      
      {/* Меню */}
      <List sx={{ p: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding
            sx={{ 
              mb: 1,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <ListItemButton
              component={Link}
              to={item.path}
              selected={item.active}
              sx={{
                py: 1.5,
                px: collapsed ? 2 : 2,
                borderRadius: 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2)
                  }
                },
                '&:hover': {
                  bgcolor: isLight 
                    ? alpha(theme.palette.text.primary, 0.05)
                    : alpha(theme.palette.text.primary, 0.1)
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: item.active ? theme.palette.primary.main : (isLight ? theme.palette.text.secondary : '#94a3b8'),
                minWidth: collapsed ? 'auto' : 40,
                mr: collapsed ? 0 : 2
              }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: item.active ? 600 : 500
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Кнопка возврата */}
      <Box sx={{ 
        p: collapsed ? 1 : 2,
        borderTop: `1px solid ${isLight ? alpha(theme.palette.divider, 0.1) : 'rgba(100, 116, 139, 0.2)'}`
      }}>
        <Tooltip title="На главную" placement={collapsed ? 'right' : 'top'}>
          <Button
            fullWidth={!collapsed}
            sx={{
              minWidth: collapsed ? 48 : 'auto',
              height: 48,
              borderRadius: 2,
              color: isLight ? theme.palette.text.secondary : '#94a3b8',
              borderColor: isLight ? alpha(theme.palette.divider, 0.2) : 'rgba(100, 116, 139, 0.3)',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
            variant="outlined"
            onClick={handleBackToApp}
          >
            {collapsed ? <ArrowBackIcon /> : 'На главную'}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: theme.palette.background.default
      }}>
        <Container maxWidth="sm">
          <Fade in={true}>
            <Box sx={{ 
              textAlign: 'center',
              p: 6,
              borderRadius: 4,
              bgcolor: isLight ? alpha(theme.palette.background.paper, 0.8) : alpha('#1e293b', 0.7),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              backdropFilter: 'blur(10px)',
              boxShadow: theme.shadows[5]
            }}>
              <AdminPanelSettingsIcon sx={{ 
                fontSize: 64, 
                color: theme.palette.error.main,
                mb: 3
              }} />
              <Typography variant="h4" sx={{ 
                color: theme.palette.text.primary, 
                mb: 2,
                fontWeight: 700
              }}>
                Доступ запрещен
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme.palette.text.secondary,
                mb: 4
              }}>
                У вас нет прав для доступа к админ-панели.
              </Typography>
              <Button
                component={Link}
                to="/"
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                  }
                }}
              >
                Вернуться на главную
              </Button>
            </Box>
          </Fade>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      bgcolor: theme.palette.background.default
    }}>
      {/* Фиксированный Header - всегда сверху, только один */}
      <AppBar 
        position="fixed" 
        color="default" 
        elevation={0}
        sx={{
          backdropFilter: 'blur(10px)',
          backgroundColor: isLight 
            ? 'rgba(255, 255, 255, 0.9)' 
            : 'rgba(17, 24, 39, 0.9)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1
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

            {/* Пустое пространство для баланса */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Правая секция */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Переключатель тем */}
              <IconButton 
                onClick={toggleTheme}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {mode === 'light' ? <DarkIcon /> : <LightIcon />}
              </IconButton>


              {/* Меню пользователя */}
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
                    border: `1px solid ${theme.palette.divider}`,
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderColor: 'text.secondary'
                    }
                  }}
                >
                  <Avatar
                    src={getAvatarSrc()}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    {!getAvatarSrc() && getUserInitials()}
                  </Avatar>
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
            </Box>

            {/* Меню пользователя (popup) */}
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
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={getAvatarSrc()}
                    sx={{ 
                      width: 48, 
                      height: 48,
                      bgcolor: 'primary.main',
                      fontSize: '1.125rem',
                      fontWeight: 600
                    }}
                  >
                    {!getAvatarSrc() && getUserInitials()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.fullName || 'Пользователь'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              <MenuItem component={Link} to="/profile" sx={{ py: 1.5 }}>
                <MuiListItemIcon>
                  <PersonIcon fontSize="small" />
                </MuiListItemIcon>
                <Typography variant="body2">Мой профиль</Typography>
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                <MuiListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </MuiListItemIcon>
                <Typography variant="body2">Выйти</Typography>
              </MenuItem>
            </Menu>

            {/* Меню уведомлений */}
            <Menu
              anchorEl={notificationsEl}
              open={Boolean(notificationsEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 300,
                  maxWidth: 350,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[5]
                }
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Уведомления
                </Typography>
              </Box>
              {notifications.map((notification) => (
                <MenuItem 
                  key={notification.id}
                  onClick={handleNotificationsClose}
                  sx={{
                    whiteSpace: 'normal',
                    py: 1.5,
                    bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                      {notification.text}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {notification.time}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Отступ для фиксированного Header */}
      <Toolbar sx={{ minHeight: { xs: 60, sm: 64 } }} />

      {/* Основной контент с Drawer */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Drawer */}
        <Box
          component="nav"
          sx={{ 
            width: { md: collapsed ? 80 : drawerWidth }, 
            flexShrink: { md: 0 },
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            })
          }}
        >
          {isMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                  bgcolor: isLight ? alpha(theme.palette.background.paper, 0.95) : '#0f172a',
                  borderRight: `1px solid ${theme.palette.divider}`,
                  backdropFilter: isLight ? 'blur(10px)' : 'none',
                  mt: '64px',
                  height: 'calc(100% - 64px)'
                }
              }}
            >
              {drawer}
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: collapsed ? 80 : drawerWidth,
                  bgcolor: isLight ? alpha(theme.palette.background.paper, 0.95) : '#0f172a',
                  borderRight: `1px solid ${theme.palette.divider}`,
                  backdropFilter: isLight ? 'blur(10px)' : 'none',
                  overflowX: 'hidden',
                  mt: '64px',
                  height: 'calc(100% - 64px)',
                  transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  })
                }
              }}
              open
            >
              {drawer}
            </Drawer>
          )}
        </Box>
        
        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${collapsed ? 80 : drawerWidth}px)` },
            minHeight: 'calc(100vh - 64px)',
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            })
          }}
        >
          {/* Заголовок страницы и кнопка меню для мобильных */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            {isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>

          {/* Контент */}
          <Fade in={true} timeout={500}>
            <Box>
              {children}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;