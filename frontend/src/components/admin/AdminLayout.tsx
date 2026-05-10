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
const collapsedDrawerWidth = 72;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeMode();
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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

  // Десктопный Drawer
  const desktopDrawer = (
    <Box sx={{ 
      height: '100%',
      bgcolor: isLight ? '#ffffff' : '#0f172a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Логотип */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between',
        py: 2,
        px: collapsed ? 1 : 2,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        {!collapsed ? (
          <>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AdminPanelSettingsIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                Админ Панель
              </Typography>
            </Stack>
            <Tooltip title="Свернуть">
              <IconButton size="small" onClick={() => setCollapsed(true)}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Развернуть">
            <IconButton onClick={() => setCollapsed(false)}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* Меню */}
      <List sx={{ p: 1, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={item.active}
              sx={{
                py: 1,
                px: collapsed ? 1 : 2,
                borderRadius: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15)
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: item.active ? theme.palette.primary.main : theme.palette.text.secondary,
                minWidth: collapsed ? 'auto' : 40,
                mr: collapsed ? 0 : 1
              }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Кнопка на главную */}
      <Box sx={{ p: collapsed ? 1 : 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Tooltip title="На главную" placement={collapsed ? 'right' : 'top'}>
          <Button
            fullWidth={!collapsed}
            onClick={handleBackToApp}
            variant="outlined"
            size="small"
            sx={{
              minWidth: collapsed ? 'auto' : '100%',
              borderRadius: 1,
              textTransform: 'none'
            }}
          >
            {collapsed ? <ArrowBackIcon fontSize="small" /> : 'На главную'}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  // Мобильный Drawer
  const mobileDrawer = (
    <Box sx={{ 
      width: 280,
      height: '100%',
      bgcolor: isLight ? '#ffffff' : '#0f172a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Шапка мобильного меню */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AdminPanelSettingsIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={700}>
            Админ Панель
          </Typography>
        </Stack>
      </Box>
      
      {/* Мобильное меню */}
      <List sx={{ p: 1, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={item.active}
              onClick={() => setMobileOpen(false)}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: item.active ? theme.palette.primary.main : theme.palette.text.secondary,
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Кнопка на главную в мобильном меню */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          fullWidth
          onClick={handleBackToApp}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: 1, textTransform: 'none' }}
        >
          На главную
        </Button>
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
        p: 2
      }}>
        <Container maxWidth="sm">
          <Fade in={true}>
            <Box sx={{ 
              textAlign: 'center',
              p: 4,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
            }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Доступ запрещен
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                У вас нет прав для доступа к админ-панели.
              </Typography>
              <Button
                component={Link}
                to="/"
                variant="contained"
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar - только для мобильных */}
      {isMobile && (
        <AppBar 
          position="fixed" 
          color="default" 
          elevation={0}
          sx={{
            bgcolor: isLight ? '#ffffff' : '#0f172a',
            borderBottom: `1px solid ${theme.palette.divider}`,
            zIndex: theme.zIndex.drawer + 1
          }}
        >
          <Toolbar sx={{ minHeight: 56, px: 2 }}>
            <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>
              {title}
            </Typography>
            
            <IconButton onClick={toggleTheme} size="small">
              {mode === 'light' ? <DarkIcon /> : <LightIcon />}
            </IconButton>
            
            <IconButton onClick={handleMenuClick} size="small" sx={{ ml: 0.5 }}>
              <Avatar
                src={getAvatarSrc()}
                sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.875rem' }}
              >
                {!getAvatarSrc() && getUserInitials()}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer - десктопный вариант */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedDrawerWidth : drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              height: '100vh'
            }
          }}
        >
          {desktopDrawer}
        </Drawer>
      )}

      {/* Drawer - мобильный вариант */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
        >
          {mobileDrawer}
        </Drawer>
      )}

      {/* Основной контент */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 2, md: 3 },
          width: { md: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          mt: { xs: '56px', md: 0 },
          minHeight: { xs: 'calc(100vh - 56px)', md: '100vh' },
          bgcolor: theme.palette.background.default,
          overflowX: 'hidden'
        }}
      >
        {/* Десктопный заголовок страницы */}
        {!isMobile && (
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            {title}
          </Typography>
        )}
        
        <Fade in={true} timeout={300}>
          <Box sx={{ width: '100%' }}>
            {children}
          </Box>
        </Fade>
      </Box>

      {/* Меню пользователя (общее для всех) */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            ...(isMobile && {
              position: 'fixed',
              top: 'auto !important',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              maxWidth: '100%',
              borderRadius: '16px 16px 0 0',
              transform: 'none !important',
              '& .MuiList-root': {
                pb: 2
              }
            })
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={getAvatarSrc()}
              sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}
            >
              {!getAvatarSrc() && getUserInitials()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.fullName || 'Пользователь'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }} sx={{ py: 1.5 }}>
          <MuiListItemIcon><PersonIcon fontSize="small" /></MuiListItemIcon>
          <Typography variant="body2">Мой профиль</Typography>
        </MenuItem>
        
        <MenuItem onClick={toggleTheme} sx={{ py: 1.5 }}>
          <MuiListItemIcon>{mode === 'light' ? <DarkIcon fontSize="small" /> : <LightIcon fontSize="small" />}</MuiListItemIcon>
          <Typography variant="body2">{mode === 'light' ? 'Темная тема' : 'Светлая тема'}</Typography>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <MuiListItemIcon><LogoutIcon fontSize="small" color="error" /></MuiListItemIcon>
          <Typography variant="body2">Выйти</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminLayout;