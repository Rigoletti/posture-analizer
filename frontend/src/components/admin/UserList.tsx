import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  InputAdornment,
  Fade,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonOutline as PersonOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { adminApi } from '../../api/admin';

interface User {
  _id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string;
  shortName: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  postureSettings?: {
    notificationsEnabled: boolean;
    calibrationDone: boolean;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const UserList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [toggleStatusCandidate, setToggleStatusCandidate] = useState<User | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit: pagination.limit
      };
      
      if (search) {
        params.search = search;
      }
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }
      
      const response = await adminApi.getUsers(params);
      
      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        });
      } else {
        throw new Error(response.error || 'Ошибка загрузки пользователей');
      }
      
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке пользователей');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, verificationFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRoleFilter = (e: SelectChangeEvent) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilter = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };

  const handleVerificationFilter = (e: SelectChangeEvent) => {
    setVerificationFilter(e.target.value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(pagination.page);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setVerificationFilter('all');
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    fetchUsers(newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchUsers(1);
  };

  const handleEditUser = (userId: string) => {
    navigate(`/admin/users/edit/${userId}`);
  };

  const handleCreateUser = () => {
    navigate('/admin/users/create');
  };

  const handleDeleteClick = (user: User) => {
    setDeleteCandidate(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    
    try {
      setDeleting(true);
      const response = await adminApi.deleteUser(deleteCandidate._id);
      
      if (response.success) {
        setSuccess('Пользователь успешно удален');
        fetchUsers(pagination.page);
      } else {
        throw new Error(response.error || 'Ошибка удаления');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении пользователя');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteCandidate(null);
    }
  };

  const handleToggleStatusClick = (user: User) => {
    setToggleStatusCandidate(user);
    setToggleStatusDialogOpen(true);
  };

  const handleToggleStatusConfirm = async () => {
    if (!toggleStatusCandidate) return;
    
    try {
      setTogglingStatus(true);
      const response = await adminApi.updateUser(toggleStatusCandidate._id, {
        isActive: !toggleStatusCandidate.isActive
      });
      
      if (response.success) {
        setSuccess(`Пользователь успешно ${!toggleStatusCandidate.isActive ? 'активирован' : 'деактивирован'}`);
        fetchUsers(pagination.page);
      } else {
        throw new Error(response.error || 'Ошибка изменения статуса');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при изменении статуса пользователя');
    } finally {
      setTogglingStatus(false);
      setToggleStatusDialogOpen(false);
      setToggleStatusCandidate(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Администратор',
          color: '#ef4444',
          icon: <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />
        };
      case 'user':
        return {
          label: 'Пользователь',
          color: '#3b82f6',
          icon: <PersonIcon sx={{ fontSize: 16 }} />
        };
      case 'guest':
        return {
          label: 'Гость',
          color: '#6b7280',
          icon: <PersonOutlineIcon sx={{ fontSize: 16 }} />
        };
      default:
        return {
          label: role,
          color: '#6b7280',
          icon: <PersonOutlineIcon sx={{ fontSize: 16 }} />
        };
    }
  };

  const getStatusInfo = (isActive: boolean) => {
    return {
      label: isActive ? 'Активен' : 'Неактивен',
      color: isActive ? '#10b981' : '#ef4444',
      icon: isActive ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <CancelIcon sx={{ fontSize: 16 }} />
    };
  };

  const getVerificationInfo = (emailVerified: boolean) => {
    return {
      label: emailVerified ? 'Подтвержден' : 'Не подтвержден',
      color: emailVerified ? '#10b981' : '#f59e0b',
      icon: emailVerified ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <WarningIcon sx={{ fontSize: 16 }} />
    };
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      if (verificationFilter === 'verified') {
        return user.emailVerified;
      }
      if (verificationFilter === 'not-verified') {
        return !user.emailVerified;
      }
      return true;
    });
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ 
            color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
          }}>
            Загрузка пользователей...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'light' 
        ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Фоновые элементы */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0)} 70%)`,
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -200,
        left: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0)} 70%)`,
        zIndex: 0
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Заголовок */}
        <Box sx={{ mb: 4 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }} 
            spacing={3}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h4" sx={{ 
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                mb: 1,
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '1.75rem' }
              }}>
                👥 Управление пользователями
              </Typography>
              <Typography variant="body1" sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
              }}>
                Всего пользователей: {pagination.total}
              </Typography>
            </Box>
         
          </Stack>

          {/* Сообщения об ошибках/успехе */}
          <Fade in={!!error || !!success}>
            <Box>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.error.main, 0.2),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    color: theme.palette.mode === 'light' 
                      ? theme.palette.error.dark
                      : theme.palette.error.light,
                    '& .MuiAlert-icon': {
                      color: theme.palette.error.main
                    }
                  }}
                  onClose={() => setError(null)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {error}
                  </Typography>
                </Alert>
              )}
              
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'light' 
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.success.main, 0.2),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    color: theme.palette.mode === 'light' 
                      ? theme.palette.success.dark
                      : theme.palette.success.light,
                    '& .MuiAlert-icon': {
                      color: theme.palette.success.main
                    }
                  }}
                  onClose={() => setSuccess(null)}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {success}
                  </Typography>
                </Alert>
              )}
            </Box>
          </Fade>

          {/* Фильтры */}
          <Paper sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            bgcolor: theme.palette.mode === 'light'
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.4),
            border: `1px solid ${theme.palette.mode === 'light'
              ? 'rgba(0, 0, 0, 0.1)'
              : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 2,
            backdropFilter: 'blur(10px)'
          }}>
            <Stack spacing={3}>
              <Stack 
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <TextField
                  fullWidth
                  placeholder="Поиск по имени, фамилии или email..."
                  value={search}
                  onChange={handleSearch}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearch('')}
                          sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8' }}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: {
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#ffffff', 0.8)
                        : 'rgba(15, 23, 42, 0.8)',
                      color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.1)'
                          : 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ minWidth: { md: '500px' } }}
                >
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      Роль
                    </InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={handleRoleFilter}
                      label="Роль"
                      startAdornment={
                        <InputAdornment position="start">
                          <FilterListIcon sx={{ color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8', mr: 1 }} />
                        </InputAdornment>
                      }
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        },
                        '& .MuiSvgIcon-root': {
                          color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                        }
                      }}
                    >
                      <MenuItem value="all">Все роли</MenuItem>
                      <MenuItem value="admin">Администратор</MenuItem>
                      <MenuItem value="user">Пользователь</MenuItem>
                      <MenuItem value="guest">Гость</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      Статус
                    </InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilter}
                      label="Статус"
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <MenuItem value="all">Все</MenuItem>
                      <MenuItem value="active">Активные</MenuItem>
                      <MenuItem value="inactive">Неактивные</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8' }}>
                      Подтверждение
                    </InputLabel>
                    <Select
                      value={verificationFilter}
                      onChange={handleVerificationFilter}
                      label="Подтверждение"
                      sx={{
                        bgcolor: theme.palette.mode === 'light'
                          ? alpha('#ffffff', 0.8)
                          : 'rgba(15, 23, 42, 0.8)',
                        color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.1)'
                            : 'rgba(255, 255, 255, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    >
                      <MenuItem value="all">Все</MenuItem>
                      <MenuItem value="verified">Подтвержденные</MenuItem>
                      <MenuItem value="not-verified">Не подтвержденные</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
              
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Stack direction="row" spacing={1}>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outlined"
                    sx={{
                      color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                      borderColor: theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    {refreshing ? 'Обновление...' : 'Обновить'}
                  </Button>
                  
                  {(search || roleFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all') && (
                    <Button
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                      variant="outlined"
                      sx={{
                        color: '#f59e0b',
                        borderColor: alpha('#f59e0b', 0.3),
                        '&:hover': {
                          borderColor: '#f59e0b',
                          bgcolor: alpha('#f59e0b', 0.1)
                        }
                      }}
                    >
                      Очистить фильтры
                    </Button>
                  )}
                </Stack>
                
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                  alignSelf: 'center'
                }}>
                  Показано: {getFilteredUsers().length} из {pagination.total}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* Таблица пользователей */}
        <Card sx={{ 
          bgcolor: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.4),
          border: `1px solid ${theme.palette.mode === 'light'
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ color: theme.palette.primary.main, mb: 2 }} />
              <Typography sx={{ 
                color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8'
              }}>
                Загрузка пользователей...
              </Typography>
            </Box>
          ) : getFilteredUsers().length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <PersonIcon sx={{ 
                fontSize: 64, 
                color: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569',
                mb: 2 
              }} />
              <Typography variant="h6" sx={{ 
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                mb: 1
              }}>
                Пользователи не найдены
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                mb: 3
              }}>
                {search || roleFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all' 
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Пока нет зарегистрированных пользователей'}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleCreateUser}
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  }
                }}
              >
                Создать пользователя
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: theme.palette.mode === 'light'
                        ? alpha('#f8fafc', 0.9)
                        : 'rgba(15, 23, 42, 0.9)'
                    }}>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '25%'
                      }}>
                        Пользователь
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '15%'
                      }}>
                        Роль
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '15%'
                      }}>
                        Статус
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '15%'
                      }}>
                        Подтверждение
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '20%'
                      }}>
                        Дата регистрации
                      </TableCell>
                      <TableCell sx={{ 
                        color: theme.palette.mode === 'light' ? '#475569' : '#94a3b8',
                        fontWeight: 600, 
                        py: 2,
                        width: '10%'
                      }} align="center">
                        Действия
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredUsers().map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const statusInfo = getStatusInfo(user.isActive);
                      const verificationInfo = getVerificationInfo(user.emailVerified);
                      
                      return (
                        <TableRow 
                          key={user._id}
                          sx={{ 
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                fontWeight: 500,
                                fontSize: '0.875rem'
                              }}>
                                {user.fullName}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                fontSize: '0.75rem'
                              }}>
                                {user.email}
                              </Typography>
                              {user.lastLogin && (
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.mode === 'light' ? '#94a3b8' : '#64748b',
                                  fontSize: '0.7rem',
                                  fontStyle: 'italic'
                                }}>
                                  Последний вход: {formatDateTime(user.lastLogin)}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              icon={roleInfo.icon}
                              label={roleInfo.label}
                              size="small"
                              sx={{
                                bgcolor: alpha(roleInfo.color, 0.1),
                                color: roleInfo.color,
                                border: `1px solid ${alpha(roleInfo.color, 0.3)}`,
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: roleInfo.color
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip
                                icon={statusInfo.icon}
                                label={statusInfo.label}
                                size="small"
                                sx={{
                                  bgcolor: alpha(statusInfo.color, 0.1),
                                  color: statusInfo.color,
                                  border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  '& .MuiChip-icon': {
                                    color: statusInfo.color
                                  }
                                }}
                              />
                              <Tooltip title={user.isActive ? 'Деактивировать' : 'Активировать'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleStatusClick(user)}
                                  sx={{
                                    color: user.isActive ? '#f59e0b' : '#10b981',
                                    '&:hover': {
                                      bgcolor: user.isActive 
                                        ? alpha('#f59e0b', 0.1) 
                                        : alpha('#10b981', 0.1)
                                    }
                                  }}
                                >
                                  {user.isActive ? 
                                    <CancelIcon fontSize="small" /> : 
                                    <CheckCircleIcon fontSize="small" />
                                  }
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              icon={verificationInfo.icon}
                              label={verificationInfo.label}
                              size="small"
                              sx={{
                                bgcolor: alpha(verificationInfo.color, 0.1),
                                color: verificationInfo.color,
                                border: `1px solid ${alpha(verificationInfo.color, 0.3)}`,
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: verificationInfo.color
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ 
                                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                                fontSize: '0.875rem'
                              }}>
                                {formatDate(user.createdAt)}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                                fontSize: '0.75rem'
                              }}>
                                {formatDateTime(user.createdAt)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2 }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Редактировать">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditUser(user._id)}
                                  sx={{
                                    color: '#3b82f6',
                                    bgcolor: alpha('#3b82f6', 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha('#3b82f6', 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Удалить">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(user)}
                                  sx={{
                                    color: '#ef4444',
                                    bgcolor: alpha('#ef4444', 0.1),
                                    '&:hover': { 
                                      bgcolor: alpha('#ef4444', 0.2),
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[10, 20, 50, 100]}
                component="div"
                count={pagination.total}
                rowsPerPage={pagination.limit}
                page={pagination.page - 1}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                labelRowsPerPage="Строк на странице:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
                }
                sx={{
                  color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  },
                  '& .MuiSelect-select': {
                    color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff'
                  },
                  '& .MuiSvgIcon-root': {
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8'
                  },
                  '& .MuiButtonBase-root': {
                    color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
                    '&.Mui-disabled': {
                      color: theme.palette.mode === 'light' ? '#cbd5e1' : '#475569'
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              />
            </>
          )}
        </Card>
      </Container>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
            borderRadius: 2,
            width: '100%',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          pb: 2,
          color: 'inherit',
          fontWeight: 600
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <WarningIcon sx={{ color: theme.palette.error.main }} />
            <span>Подтверждение удаления</span>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: 'inherit', mb: 2 }}>
            Вы уверены, что хотите удалить этого пользователя?
          </Typography>
          
          {deleteCandidate && (
            <Box sx={{ 
              p: 2, 
              mb: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
            }}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.error.dark
                    : theme.palette.error.light,
                  fontWeight: 500 
                }}>
                  <strong>ФИО:</strong> {deleteCandidate.fullName}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.error.dark
                    : theme.palette.error.light
                }}>
                  <strong>Email:</strong> {deleteCandidate.email}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'light' 
                    ? theme.palette.error.dark
                    : theme.palette.error.light
                }}>
                  <strong>Роль:</strong> {getRoleInfo(deleteCandidate.role).label}
                </Typography>
              </Stack>
            </Box>
          )}
          
          <Alert 
            severity="warning" 
            sx={{ 
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              color: theme.palette.mode === 'light' 
                ? theme.palette.warning.dark
                : theme.palette.warning.light
            }}
          >
            <Typography variant="caption">
              Это действие нельзя отменить. Все данные пользователя будут удалены из системы.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{
              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
              '&:hover': {
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                backgroundColor: alpha(theme.palette.text.primary, 0.1)
              }
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            sx={{
              bgcolor: theme.palette.error.main,
              color: 'white',
              px: 3,
              '&:hover': {
                bgcolor: theme.palette.error.dark,
                boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.3)}`
              },
              '&.Mui-disabled': {
                bgcolor: theme.palette.mode === 'light' 
                  ? alpha(theme.palette.error.main, 0.3)
                  : alpha(theme.palette.error.main, 0.2),
                color: theme.palette.mode === 'light' 
                  ? alpha('#ffffff', 0.5)
                  : alpha(theme.palette.error.light, 0.5)
              }
            }}
          >
            {deleting ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Удаление...</span>
              </Stack>
            ) : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог изменения статуса */}
      <Dialog
        open={toggleStatusDialogOpen}
        onClose={() => setToggleStatusDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#1e293b',
            color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
            borderRadius: 2,
            width: '100%',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          pb: 2,
          color: 'inherit',
          fontWeight: 600
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <WarningIcon sx={{ color: theme.palette.warning.main }} />
            <span>Изменение статуса</span>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {toggleStatusCandidate && (
            <>
              <Typography sx={{ color: 'inherit', mb: 2 }}>
                Вы уверены, что хотите {toggleStatusCandidate.isActive ? 'деактивировать' : 'активировать'} этого пользователя?
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                mb: 2,
                bgcolor: toggleStatusCandidate.isActive 
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
                borderRadius: 1,
                border: `1px solid ${toggleStatusCandidate.isActive 
                  ? alpha(theme.palette.warning.main, 0.3)
                  : alpha(theme.palette.success.main, 0.3)}`
              }}>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ 
                    color: toggleStatusCandidate.isActive 
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
                    fontWeight: 500 
                  }}>
                    <strong>ФИО:</strong> {toggleStatusCandidate.fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: toggleStatusCandidate.isActive 
                      ? theme.palette.warning.main
                      : theme.palette.success.main
                  }}>
                    <strong>Email:</strong> {toggleStatusCandidate.email}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: toggleStatusCandidate.isActive 
                      ? theme.palette.warning.main
                      : theme.palette.success.main
                  }}>
                    <strong>Текущий статус:</strong> {toggleStatusCandidate.isActive ? 'Активен' : 'Неактивен'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: toggleStatusCandidate.isActive 
                      ? theme.palette.warning.main
                      : theme.palette.success.main
                  }}>
                    <strong>Новый статус:</strong> {toggleStatusCandidate.isActive ? 'Неактивен' : 'Активен'}
                  </Typography>
                </Stack>
              </Box>
              
              <Alert 
                severity={toggleStatusCandidate.isActive ? "warning" : "info"}
                sx={{ 
                  bgcolor: toggleStatusCandidate.isActive 
                    ? alpha(theme.palette.warning.main, 0.1)
                    : alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${toggleStatusCandidate.isActive 
                    ? alpha(theme.palette.warning.main, 0.3)
                    : alpha(theme.palette.info.main, 0.3)}`,
                  color: toggleStatusCandidate.isActive 
                    ? theme.palette.warning.main
                    : theme.palette.info.main
                }}
              >
                <Typography variant="caption">
                  {toggleStatusCandidate.isActive 
                    ? 'Деактивированный пользователь не сможет войти в систему.'
                    : 'Активированный пользователь сможет войти в систему и использовать все функции.'}
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setToggleStatusDialogOpen(false)}
            disabled={togglingStatus}
            sx={{
              color: theme.palette.mode === 'light' ? '#64748b' : '#94a3b8',
              '&:hover': {
                color: theme.palette.mode === 'light' ? '#0f172a' : '#ffffff',
                backgroundColor: alpha(theme.palette.text.primary, 0.1)
              }
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleToggleStatusConfirm}
            variant="contained"
            disabled={togglingStatus}
            sx={{
              bgcolor: toggleStatusCandidate?.isActive 
                ? theme.palette.warning.main 
                : theme.palette.success.main,
              color: 'white',
              px: 3,
              '&:hover': {
                bgcolor: toggleStatusCandidate?.isActive 
                  ? theme.palette.warning.dark
                  : theme.palette.success.dark,
                boxShadow: `0 4px 20px ${toggleStatusCandidate?.isActive 
                  ? alpha(theme.palette.warning.main, 0.3)
                  : alpha(theme.palette.success.main, 0.3)}`
              },
              '&.Mui-disabled': {
                bgcolor: toggleStatusCandidate?.isActive 
                  ? alpha(theme.palette.warning.main, 0.3)
                  : alpha(theme.palette.success.main, 0.3),
                color: theme.palette.mode === 'light' 
                  ? alpha('#ffffff', 0.5)
                  : alpha(toggleStatusCandidate?.isActive 
                    ? theme.palette.warning.light
                    : theme.palette.success.light, 0.5)
              }
            }}
          >
            {togglingStatus ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Сохранение...</span>
              </Stack>
            ) : toggleStatusCandidate?.isActive ? 'Деактивировать' : 'Активировать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Стили для анимации */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default UserList;