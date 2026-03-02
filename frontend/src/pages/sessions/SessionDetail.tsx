import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Stack,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  alpha,
  Divider,
  Paper,
  LinearProgress,
  Tooltip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Fab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';
import {
  ArrowBack,
  Timeline,
  Delete,
  Warning,
  CheckCircle,
  Error,
  AccessTime,
  Score,
  BarChart,
  History,
  Refresh,
  Print,
  FitnessCenter,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  OpenInNew,
  Whatshot,
  Timer,
  TrendingUp,
  Spa,
  LocalFireDepartment,
  Description,
  Download,
  Share,
  Add,
  Info,
  Visibility,
  PictureAsPdf,
  Collections,
  PhotoCamera,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { sessionsApi } from '../../api/sessions';
import { useAuthStore } from '../../store/auth';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import SessionRecommendations from '../../components/sessions/SessionRecommendations';
import { PDFExport } from '../../components/sessions/PDFExport';
import { SnapshotGallery } from '../../components/sessions/SnapshotGallery';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface ProblemZone {
  zone: string;
  percentage: number;
  duration: number;
  count: number;
}

const SessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthStore();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [problemZones, setProblemZones] = useState<ProblemZone[]>([]);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [snapshotStats, setSnapshotStats] = useState({
    total: 0,
    warning: 0,
    error: 0,
    favorite: 0
  });

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    }
  }, [sessionId]);

  const loadSessionDetails = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await sessionsApi.getSessionDetailsWithRecommendations(sessionId);
      setSession(response.data.session);
      
      // Анализируем проблемные зоны
      const zones: ProblemZone[] = [];
      const errorsByZone = response.data.session.postureMetrics.errorsByZone;
      const duration = response.data.session.duration || 1;
      
      if (errorsByZone.shoulders && errorsByZone.shoulders.duration > 0) {
        const percentage = (errorsByZone.shoulders.duration / duration) * 100;
        zones.push({
          zone: 'Плечи',
          percentage: Math.round(percentage * 10) / 10,
          duration: Math.round(errorsByZone.shoulders.duration * 10) / 10,
          count: errorsByZone.shoulders.count
        });
      }
      
      if (errorsByZone.head && errorsByZone.head.duration > 0) {
        const percentage = (errorsByZone.head.duration / duration) * 100;
        zones.push({
          zone: 'Голова',
          percentage: Math.round(percentage * 10) / 10,
          duration: Math.round(errorsByZone.head.duration * 10) / 10,
          count: errorsByZone.head.count
        });
      }
      
      if (errorsByZone.hips && errorsByZone.hips.duration > 0) {
        const percentage = (errorsByZone.hips.duration / duration) * 100;
        zones.push({
          zone: 'Таз',
          percentage: Math.round(percentage * 10) / 10,
          duration: Math.round(errorsByZone.hips.duration * 10) / 10,
          count: errorsByZone.hips.count
        });
      }
      
      // Сортируем по проценту проблем
      zones.sort((a, b) => b.percentage - a.percentage);
      setProblemZones(zones);

      // Подсчитываем статистику снимков из сессии
      if (response.data.session.postureSnapshots) {
        const snapshots = response.data.session.postureSnapshots;
        setSnapshotStats({
          total: snapshots.length,
          warning: snapshots.filter((s: any) => s.status === 'warning').length,
          error: snapshots.filter((s: any) => s.status === 'error').length,
          favorite: 0 // Будет загружено из галереи
        });
      }
      
    } catch (err: any) {
      console.error('Failed to load session details:', err);
      setError(err.message || 'Ошибка при загрузке деталей сеанса');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    
    try {
      await sessionsApi.deleteSession(sessionId);
      navigate('/sessions');
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError(err.message || 'Ошибка при удалении сеанса');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 сек';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    }
    if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    }
    return `${secs}с`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 75) return '#4ade80'; 
    if (score >= 60) return theme.palette.warning.main;
    if (score >= 40) return '#f97316'; 
    return theme.palette.error.main;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Отлично';
    if (score >= 75) return 'Хорошо';
    if (score >= 60) return 'Удовлетворительно';
    if (score >= 40) return 'Требует внимания';
    return 'Критично';
  };

  const getProblemColor = (percentage: number) => {
    if (percentage > 30) return theme.palette.error.main;
    if (percentage > 15) return theme.palette.warning.main;
    return theme.palette.info.main;
  };

  const getProblemIcon = (percentage: number) => {
    if (percentage > 30) return <Error />;
    if (percentage > 15) return <Warning />;
    return <Info />;
  };

  const toggleZoneExpansion = (zone: string) => {
    if (expandedZone === zone) {
      setExpandedZone(null);
    } else {
      setExpandedZone(zone);
    }
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    const factor = Math.pow(10, decimals);
    const rounded = Math.round(num * factor) / factor;
    
    return rounded.toFixed(decimals).replace(/\.?0+$/, '');
  };

  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${formatNumber(value, decimals)}%`;
  };

  const handleSnapshotStatsUpdate = (stats: any) => {
    setSnapshotStats(prev => ({
      ...prev,
      ...stats
    }));
  };

  const renderScoreCard = () => {
    if (!session) return null;
    
    const score = session.postureMetrics?.postureScore || 0;
    const scoreColor = getScoreColor(score);
    const scoreLabel = getScoreLabel(score);
    
    const totalFrames = session.postureMetrics?.totalFrames || 1;
    const goodPercentage = session.postureMetrics?.goodPercentage || 
      Math.round((session.postureMetrics?.goodPostureFrames || 0) / totalFrames * 100);
    const warningPercentage = session.postureMetrics?.warningPercentage || 
      Math.round((session.postureMetrics?.warningFrames || 0) / totalFrames * 100);
    const errorPercentage = session.postureMetrics?.errorPercentage || 
      Math.round((session.postureMetrics?.errorFrames || 0) / totalFrames * 100);
    
    return (
      <Card sx={{ 
        bgcolor: alpha(scoreColor, 0.05),
        border: `2px solid ${alpha(scoreColor, 0.2)}`,
        borderRadius: 3,
        mb: 4,
        position: 'relative',
        overflow: 'visible'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: alpha(scoreColor, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          {score >= 90 ? 
            <CheckCircle sx={{ fontSize: 40, color: scoreColor }} /> :
            score >= 60 ?
            <Warning sx={{ fontSize: 40, color: scoreColor }} /> :
            <Error sx={{ fontSize: 40, color: scoreColor }} />
          }
        </Box>
        
        <CardContent sx={{ p: 4, pt: 5 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                textAlign: 'center',
                position: 'relative'
              }}>
                <Box sx={{
                  position: 'relative',
                  display: 'inline-block'
                }}>
                  <CircularProgress
                    variant="determinate"
                    value={score}
                    size={160}
                    thickness={4}
                    sx={{
                      color: scoreColor,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round'
                      }
                    }}
                  />
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h1" sx={{ 
                      fontWeight: 800,
                      color: scoreColor,
                      lineHeight: 1
                    }}>
                      {score}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.secondary,
                      mt: 1
                    }}>
                      баллов
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ 
                  mt: 2,
                  color: scoreColor,
                  fontWeight: 600
                }}>
                  {scoreLabel}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  color: theme.palette.text.primary
                }}>
                  Анализ осанки
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}>
                      <AccessTime sx={{ 
                        color: theme.palette.primary.main,
                        mb: 1 
                      }} />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Длительность
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatDuration(session.duration || 0)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                    }}>
                      <CheckCircle sx={{ 
                        color: theme.palette.success.main,
                        mb: 1 
                      }} />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Хорошая осанка
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                        {formatPercentage(goodPercentage)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                    }}>
                      <Warning sx={{ 
                        color: theme.palette.warning.main,
                        mb: 1 
                      }} />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Предупреждения
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                        {formatPercentage(warningPercentage)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.error.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
                    }}>
                      <Error sx={{ 
                        color: theme.palette.error.main,
                        mb: 1 
                      }} />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Ошибки
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                        {formatPercentage(errorPercentage)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderProblemZones = () => {
    if (problemZones.length === 0) return null;
    
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            mb: 3,
            fontWeight: 600,
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Warning sx={{ color: theme.palette.warning.main }} />
            Проблемные зоны
          </Typography>
          
          <Stack spacing={2}>
            {problemZones.map((zone, index) => {
              const zoneColor = getProblemColor(zone.percentage);
              const isExpanded = expandedZone === zone.zone;
              
              return (
                <Paper
                  key={index}
                  sx={{
                    border: `1px solid ${alpha(zoneColor, 0.2)}`,
                    bgcolor: alpha(zoneColor, 0.05),
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(zoneColor, 0.08)
                    }
                  }}
                  onClick={() => toggleZoneExpansion(zone.zone)}
                >
                  <Box sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ 
                          bgcolor: alpha(zoneColor, 0.2),
                          color: zoneColor
                        }}>
                          {getProblemIcon(zone.percentage)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {zone.zone}
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {zone.count} нарушений • {formatNumber(zone.duration)}с
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Chip
                          label={`${formatNumber(zone.percentage, 1)}% времени`}
                          sx={{
                            bgcolor: alpha(zoneColor, 0.2),
                            color: zoneColor,
                            fontWeight: 600
                          }}
                        />
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleZoneExpansion(zone.zone);
                          }}
                          sx={{
                            color: zoneColor
                          }}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Stack>
                    </Stack>
                    
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(zone.percentage, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(zoneColor, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: zoneColor,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Collapse in={isExpanded}>
                    <Divider />
                    <Box sx={{ p: 2, bgcolor: alpha(zoneColor, 0.02) }}>
                      <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                        {zone.zone === 'Плечи' && 'Сгорбленные плечи, напряжение в верхней части спины.'}
                        {zone.zone === 'Голова' && 'Наклон головы вперед, напряжение в шее.'}
                        {zone.zone === 'Таз' && 'Неправильное положение таза, напряжение в пояснице.'}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ 
                        color: zoneColor,
                        fontWeight: 600,
                        display: 'block',
                        mb: 1
                      }}>
                        Рекомендации:
                      </Typography>
                      
                      <List dense disablePadding>
                        {zone.zone === 'Плечи' && (
                          <>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircle sx={{ fontSize: 16, color: zoneColor }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Делайте перерывы для разминки плеч"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircle sx={{ fontSize: 16, color: zoneColor }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Следите за положением плеч при работе"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          </>
                        )}
                        {zone.zone === 'Голова' && (
                          <>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircle sx={{ fontSize: 16, color: zoneColor }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Располагайте монитор на уровне глаз"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircle sx={{ fontSize: 16, color: zoneColor }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Делайте упражнения для шеи"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          </>
                        )}
                        {zone.zone === 'Таз' && (
                          <>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircle sx={{ fontSize: 16, color: zoneColor }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Используйте эргономичный стул"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircle sx={{ fontSize: 16, color: zoneColor }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Укрепляйте мышцы кора"
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          </>
                        )}
                      </List>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderMetricsCard = () => {
    if (!session) return null;

    const totalFrames = session.postureMetrics?.totalFrames || 1;
    const goodPercentage = session.postureMetrics?.goodPercentage || 
      Math.round((session.postureMetrics?.goodPostureFrames || 0) / totalFrames * 100);
    const warningPercentage = session.postureMetrics?.warningPercentage || 
      Math.round((session.postureMetrics?.warningFrames || 0) / totalFrames * 100);
    const errorPercentage = session.postureMetrics?.errorPercentage || 
      Math.round((session.postureMetrics?.errorFrames || 0) / totalFrames * 100);

    return (
      <Card sx={{ 
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: theme.palette.text.primary, 
            mb: 3,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <BarChart />
            Детальная статистика
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Всего кадров
                </Typography>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.info.main,
                  fontWeight: 800
                }}>
                  {session?.postureMetrics?.totalFrames?.toLocaleString() || 0}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Хорошая осанка
                </Typography>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.success.main,
                  fontWeight: 800
                }}>
                  {session?.postureMetrics?.goodPostureFrames?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                  {formatPercentage(goodPercentage)}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Предупреждения
                </Typography>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.warning.main,
                  fontWeight: 800
                }}>
                  {session?.postureMetrics?.warningFrames?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.warning.main }}>
                  {formatPercentage(warningPercentage)}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 2, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.05),
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
              }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Ошибки отслеживания
                </Typography>
                <Typography variant="h4" sx={{ 
                  color: theme.palette.error.main,
                  fontWeight: 800
                }}>
                  {session?.postureMetrics?.errorFrames?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  {formatPercentage(errorPercentage)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2, fontWeight: 600 }}>
            Ошибки по зонам
          </Typography>
          
          <Grid container spacing={2}>
            {session?.postureMetrics?.errorsByZone && Object.entries(session.postureMetrics.errorsByZone).map(([zone, data]: [string, any]) => {
              const zoneName = zone === 'shoulders' ? 'Плечи' : 
                              zone === 'head' ? 'Голова' : 'Таз';
              
              const duration = data.duration || 0;
              const totalDuration = session.duration || 1;
              const percentage = data.percentage || Math.round((duration / totalDuration) * 1000) / 10;
              
              const zoneColor = getProblemColor(percentage);
              
              return (
                <Grid item xs={12} md={4} key={zone}>
                  <Paper sx={{ 
                    p: 3, 
                    bgcolor: alpha(zoneColor, 0.05),
                    border: `1px solid ${alpha(zoneColor, 0.1)}`,
                    height: '100%'
                  }}>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" sx={{ 
                          color: theme.palette.text.primary, 
                          fontWeight: 600
                        }}>
                          {zoneName}
                        </Typography>
                        <Badge
                          badgeContent={data.count || 0}
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontWeight: 700
                            }
                          }}
                        />
                      </Stack>
                      
                      <Box>
                        <Typography variant="h4" sx={{ 
                          color: zoneColor,
                          fontWeight: 800,
                          mb: 0.5
                        }}>
                          {formatNumber(duration)}с
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          общая длительность
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {formatNumber(percentage, 1)}% времени сеанса
                          </Typography>
                          <Typography variant="body2" sx={{ color: zoneColor, fontWeight: 600 }}>
                            {formatPercentage(percentage)}
                          </Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(percentage, 100)}
                          sx={{ 
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(zoneColor, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: zoneColor,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} sx={{ mb: 3, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            Загружаем данные сеанса...
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Анализируем вашу осанку и подбираем рекомендации
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/sessions')}>
              К истории
            </Button>
          }
        >
          {error || 'Сеанс не найден'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/sessions')}
          variant="outlined"
        >
          Вернуться к истории сеансов
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок и действия */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/sessions')}
            variant="outlined"
            sx={{ 
              mb: 3,
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main
              }
            }}
          >
            К истории сеансов
          </Button>

          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ 
                color: theme.palette.text.primary, 
                mb: 1,
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}>
                Анализ сеанса осанки
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1}>
                <Chip
                  icon={<AccessTime />}
                  label={formatDate(session.startTime)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Timer />}
                  label={formatDuration(session.duration)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Description />}
                  label={`ID: ${session.sessionId.substring(0, 8)}...`}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
                {snapshotStats.total > 0 && (
                  <Chip
                    icon={<Collections />}
                    label={`${snapshotStats.total} снимков`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Обновить данные">
                <IconButton
                  onClick={loadSessionDetails}
                  sx={{ 
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2)
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              
              <Button
                startIcon={<Print />}
                variant="outlined"
                onClick={handlePrint}
                sx={{ 
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main
                }}
              >
                Печать
              </Button>
              
              <PDFExport 
                session={session}
                buttonVariant="contained"
                buttonSize="medium"
                showIcon={true}
              />
              
              <Button
                startIcon={<Delete />}
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Удалить
              </Button>
            </Stack>
          </Stack>
        </Box>
      </motion.div>

      {/* Карточка с оценкой */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {renderScoreCard()}
      </motion.div>

      {/* Проблемные зоны */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {renderProblemZones()}
      </motion.div>

      {/* Вкладки */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 1
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { 
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.9rem',
                minHeight: 48
              },
              '& .Mui-selected': { 
                color: theme.palette.primary.main,
                fontWeight: 600
              },
              '& .MuiTabs-indicator': { 
                bgcolor: theme.palette.primary.main,
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab icon={<BarChart />} iconPosition="start" label="Метрики" />
            <Tab 
              icon={
                <Badge 
                  badgeContent={snapshotStats.total} 
                  color="primary"
                  max={99}
                  invisible={snapshotStats.total === 0}
                >
                  <Collections />
                </Badge>
              } 
              iconPosition="start" 
              label="Снимки" 
            />
            <Tab icon={<FitnessCenter />} iconPosition="start" label="Рекомендации" />
          </Tabs>
        </Box>
      </motion.div>

      {/* Содержимое вкладок */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TabPanel value={activeTab} index={0}>
          {renderMetricsCard()}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          {sessionId && (
            <SnapshotGallery 
              sessionId={sessionId} 
              onStatsUpdate={handleSnapshotStatsUpdate}
            />
          )}
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <FitnessCenter sx={{ 
                  color: theme.palette.primary.main,
                  fontSize: 32
                }} />
                Персональные рекомендации
              </Typography>
              
              <PDFExport 
                session={session}
                buttonVariant="outlined"
                buttonSize="small"
                showIcon={true}
              />
            </Stack>
            
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                На основе анализа вашей осанки мы подобрали упражнения, которые помогут исправить выявленные проблемы и улучшить общее состояние позвоночника.
              </Typography>
            </Alert>
            
            {sessionId && (
              <SessionRecommendations 
                sessionId={sessionId}
                recommendationsData={session?.recommendations}
              />
            )}
          </Box>
        </TabPanel>
      </motion.div>

      {/* Диалог удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Вы уверены, что хотите удалить этот сеанс анализа?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Это действие нельзя отменить. Все данные сеанса, включая снимки, будут удалены.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Плавающая кнопка для быстрого доступа к рекомендациям */}
      {activeTab !== 2 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            }
          }}
          onClick={() => setActiveTab(2)}
        >
          <FitnessCenter />
        </Fab>
      )}
    </Container>
  );
};

export default SessionDetail;