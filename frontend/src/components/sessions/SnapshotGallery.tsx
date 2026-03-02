import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Paper,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Divider,
  Avatar,
  Fade,
  FormControlLabel
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Delete,
  Warning,
  Error,
  CheckCircle,
  Info,
  FilterList,
  Clear,
  PhotoCamera,
  Collections,
  ModeComment,
  Tag,
  Close,
  Fullscreen,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
  Timeline
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSnapshots } from '../../hooks/useSnapshots';
import { PoseOverlay } from './PoseOverlay';

interface SnapshotGalleryProps {
  sessionId: string;
  onSelect?: (snapshot: any) => void;
  maxHeight?: number | string;
  onStatsUpdate?: (stats: any) => void;
}

interface Snapshot {
  _id: string;
  sessionId: string;
  timestamp: string;
  type: 'warning' | 'error' | 'calibration' | 'manual' | 'auto';
  postureStatus: 'good' | 'warning' | 'error';
  postureScore: number;
  issues: string[];
  issueDetails?: any;
  poseData?: {
    keypoints?: Array<{
      x: number;
      y: number;
      score: number;
      name?: string;
    }>;
    normalizedPoints?: Array<{
      x: number;
      y: number;
      score: number;
      name?: string;
    }>;
  };
  isFavorite: boolean;
  notes?: string;
  tags: string[];
  importance: number;
  views: number;
  imageUrl: string;
  thumbnailUrl: string;
  imageMetadata?: { // Делаем опциональным
    filename: string;
    contentType: string;
    size: number;
    width: number;
    height: number;
    thumbnailId?: string;
  };
  createdAt: string;
}

export const SnapshotGallery: React.FC<SnapshotGalleryProps> = ({
  sessionId,
  onSelect,
  maxHeight = '600px',
  onStatsUpdate
}) => {
  const theme = useTheme();
  
  const {
    snapshots,
    loading,
    error,
    pagination,
    loadSnapshots,
    updateSnapshot,
    deleteSnapshot,
    toggleFavorite,
    getSnapshotImageUrl,
    getSnapshotThumbnailUrl
  } = useSnapshots({ sessionId });

  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [showPoseOverlay, setShowPoseOverlay] = useState(false);
  const [editData, setEditData] = useState({
    notes: '',
    tags: '',
    importance: 5,
    isFavorite: false
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    favorite: false
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (sessionId) {
      loadSnapshots(sessionId, page, filters);
    }
  }, [sessionId, page, filters]);

  useEffect(() => {
    if (onStatsUpdate && snapshots.length > 0) {
      const stats = {
        total: pagination.total,
        warning: snapshots.filter(s => s.postureStatus === 'warning').length,
        error: snapshots.filter(s => s.postureStatus === 'error').length,
        favorite: snapshots.filter(s => s.isFavorite).length
      };
      onStatsUpdate(stats);
    }
  }, [snapshots, pagination.total, onStatsUpdate]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleStatusFilterChange = (event: any) => {
    handleFilterChange('status', event.target.value);
  };

  const handleTypeFilterChange = (event: any) => {
    handleFilterChange('type', event.target.value);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      favorite: false
    });
    setPage(1);
  };

  const handleSnapshotClick = (snapshot: Snapshot) => {
    setSelectedSnapshot(snapshot);
    setShowPoseOverlay(false);
    if (onSelect) {
      onSelect(snapshot);
    }
  };

  const handleCloseDetails = () => {
    setSelectedSnapshot(null);
    setShowPoseOverlay(false);
  };

  const handleOpenFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
  };

  const handleOpenEdit = (snapshot: Snapshot) => {
    setEditData({
      notes: snapshot.notes || '',
      tags: snapshot.tags?.join(', ') || '',
      importance: snapshot.importance || 5,
      isFavorite: snapshot.isFavorite || false
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSnapshot) return;

    const tags = editData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    await updateSnapshot(selectedSnapshot._id, {
      notes: editData.notes,
      tags,
      importance: editData.importance,
      isFavorite: editData.isFavorite
    });

    setEditDialog(false);
    // Обновляем выбранный снимок
    setSelectedSnapshot((prev: any) => ({
      ...prev,
      notes: editData.notes,
      tags,
      importance: editData.importance,
      isFavorite: editData.isFavorite
    }));
  };

  const handleDelete = async (snapshotId: string) => {
    if (window.confirm('Удалить этот снимок?')) {
      await deleteSnapshot(snapshotId);
      if (selectedSnapshot?._id === snapshotId) {
        setSelectedSnapshot(null);
      }
    }
  };

  const handleToggleFavorite = async (snapshotId: string, currentValue: boolean) => {
    await toggleFavorite(snapshotId, currentValue);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'warning':
        return <Warning sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <Error sx={{ color: theme.palette.error.main }} />;
      default:
        return <Info sx={{ color: theme.palette.info.main }} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good': return 'Хорошая осанка';
      case 'warning': return 'Нарушение';
      case 'error': return 'Критично';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy, HH:mm:ss', { locale: ru });
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Ошибка загрузки снимков: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Фильтры */}
      <Paper sx={{ 
        p: 2, 
        mb: 3,
        background: theme.palette.mode === 'light'
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha(theme.palette.background.paper, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3
      }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList sx={{ color: theme.palette.text.secondary }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Фильтры:
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={filters.status}
              onChange={handleStatusFilterChange}
              label="Статус"
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="good">Хорошая осанка</MenuItem>
              <MenuItem value="warning">Нарушение</MenuItem>
              <MenuItem value="error">Критично</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Тип</InputLabel>
            <Select
              value={filters.type}
              onChange={handleTypeFilterChange}
              label="Тип"
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="auto">Авто</MenuItem>
              <MenuItem value="manual">Ручной</MenuItem>
              <MenuItem value="calibration">Калибровка</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={filters.favorite}
                onChange={(e) => handleFilterChange('favorite', e.target.checked)}
                icon={<FavoriteBorder />}
                checkedIcon={<Favorite sx={{ color: theme.palette.error.main }} />}
              />
            }
            label="Избранное"
          />

          {(filters.status || filters.type || filters.favorite) && (
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={clearFilters}
              sx={{ ml: 'auto' }}
            >
              Сбросить
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Галерея */}
      {loading && snapshots.length === 0 ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton 
                variant="rectangular" 
                height={200} 
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : snapshots.length === 0 ? (
        <Paper sx={{ 
          textAlign: 'center', 
          py: 8,
          background: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4
        }}>
          <PhotoCamera sx={{ 
            fontSize: 80, 
            color: theme.palette.text.secondary,
            mb: 2,
            opacity: 0.5
          }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            Нет снимков
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Снимки будут появляться здесь при обнаружении нарушений осанки
          </Typography>
        </Paper>
      ) : (
        <ImageList 
          variant="masonry" 
          cols={3} 
          gap={16}
          sx={{ 
            maxHeight,
            overflow: 'auto',
            pr: 1
          }}
        >
          {snapshots.map((snapshot) => (
            <ImageListItem 
              key={snapshot._id}
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  zIndex: 1
                }
              }}
              onClick={() => handleSnapshotClick(snapshot)}
            >
              <img
                src={getSnapshotThumbnailUrl(snapshot._id)}
                alt={`Снимок ${format(parseISO(snapshot.timestamp), 'HH:mm:ss')}`}
                loading="lazy"
                style={{ 
                  borderRadius: 12,
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
              
              <ImageListItemBar
                position="top"
                sx={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  borderRadius: '12px 12px 0 0'
                }}
                actionIcon={
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(snapshot._id, snapshot.isFavorite);
                    }}
                  >
                    {snapshot.isFavorite ? 
                      <Favorite sx={{ color: theme.palette.error.main }} /> : 
                      <FavoriteBorder />
                    }
                  </IconButton>
                }
              />
              
              <ImageListItemBar
                position="bottom"
                sx={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  borderRadius: '0 0 12px 12px'
                }}
                title={
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getStatusIcon(snapshot.postureStatus)}
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {snapshot.postureScore}%
                      </Typography>
                      {snapshot.poseData && (
                        <Timeline sx={{ fontSize: 14, color: alpha('#fff', 0.7) }} />
                      )}
                    </Stack>
                    {snapshot.issues && snapshot.issues.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        {snapshot.issues.slice(0, 2).map((issue: string, i: number) => (
                          <Chip
                            key={i}
                            label={issue}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6rem',
                              bgcolor: alpha(theme.palette.warning.main, 0.3),
                              color: 'white'
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                }
                subtitle={
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    {format(parseISO(snapshot.timestamp), 'dd MMM, HH:mm', { locale: ru })}
                  </Typography>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Пагинация */}
      {pagination.pages > 1 && (
        <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
          <Button
            disabled={page === 1}
            onClick={() => setPage(prev => prev - 1)}
          >
            Предыдущая
          </Button>
          <Typography sx={{ alignSelf: 'center' }}>
            {page} из {pagination.pages}
          </Typography>
          <Button
            disabled={page === pagination.pages}
            onClick={() => setPage(prev => prev + 1)}
          >
            Следующая
          </Button>
        </Stack>
      )}

      {/* Диалог деталей снимка */}
      <Dialog
        open={!!selectedSnapshot}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none',
            borderRadius: 3
          }
        }}
      >
        {selectedSnapshot && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 2
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ 
                  bgcolor: alpha(getStatusColor(selectedSnapshot.postureStatus), 0.1),
                  color: getStatusColor(selectedSnapshot.postureStatus)
                }}>
                  {getStatusIcon(selectedSnapshot.postureStatus)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {getStatusLabel(selectedSnapshot.postureStatus)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {formatDateTime(selectedSnapshot.timestamp)}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={handleCloseDetails}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ position: 'relative' }}>
                    {showPoseOverlay && selectedSnapshot.poseData ? (
                      <PoseOverlay
                        imageUrl={getSnapshotImageUrl(selectedSnapshot._id)}
                        poseData={selectedSnapshot.poseData}
                        issues={selectedSnapshot.issues}
                        width={selectedSnapshot.imageMetadata?.width || 640}
                        height={selectedSnapshot.imageMetadata?.height || 480}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          '&:hover .fullscreen-btn': {
                            opacity: 1
                          }
                        }}
                        onClick={() => handleOpenFullscreen(getSnapshotImageUrl(selectedSnapshot._id))}
                      >
                        <img
                          src={getSnapshotImageUrl(selectedSnapshot._id)}
                          alt="Снимок"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      </Box>
                    )}
                    
                    {/* Кнопки управления */}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    >
                      {selectedSnapshot.poseData && (
                        <Tooltip title={showPoseOverlay ? "Скрыть скелет" : "Показать скелет"}>
                          <IconButton
                            onClick={() => setShowPoseOverlay(!showPoseOverlay)}
                            sx={{
                              bgcolor: alpha('#000', 0.5),
                              color: 'white',
                              '&:hover': {
                                bgcolor: alpha('#000', 0.7)
                              }
                            }}
                          >
                            {showPoseOverlay ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Полный экран">
                        <IconButton
                          onClick={() => handleOpenFullscreen(getSnapshotImageUrl(selectedSnapshot._id))}
                          sx={{
                            bgcolor: alpha('#000', 0.5),
                            color: 'white',
                            '&:hover': {
                              bgcolor: alpha('#000', 0.7)
                            }
                          }}
                        >
                          <Fullscreen />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {/* Легенда для скелета */}
                    {showPoseOverlay && selectedSnapshot.issues.length > 0 && (
                      <Box sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        right: 8,
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        zIndex: 1
                      }}>
                        {selectedSnapshot.issues.map((issue) => (
                          <Chip
                            key={issue}
                            label={issue}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.8),
                              color: 'white',
                              fontWeight: 600,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Stack spacing={3}>
                    {/* Оценка */}
                    <Paper sx={{ 
                      p: 2,
                      bgcolor: alpha(getStatusColor(selectedSnapshot.postureStatus), 0.05),
                      border: `1px solid ${alpha(getStatusColor(selectedSnapshot.postureStatus), 0.2)}`,
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                        Оценка осанки
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress
                            variant="determinate"
                            value={selectedSnapshot.postureScore}
                            size={60}
                            thickness={4}
                            sx={{ color: getStatusColor(selectedSnapshot.postureStatus) }}
                          />
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {selectedSnapshot.postureScore}%
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getStatusLabel(selectedSnapshot.postureStatus)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {selectedSnapshot.issues?.length || 0} проблем
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>

                    {/* Проблемы */}
                    {selectedSnapshot.issues && selectedSnapshot.issues.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                          Обнаруженные проблемы
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {selectedSnapshot.issues.map((issue: string, i: number) => (
                            <Chip
                              key={i}
                              label={issue}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Информация о скелете */}
                    {selectedSnapshot.poseData && (
                      <Paper sx={{ 
                        p: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        borderRadius: 2
                      }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Timeline sx={{ color: theme.palette.info.main }} />
                          <Typography variant="body2">
                            Данные о позе доступны
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 1 }}>
                          Нажмите кнопку 👁 над изображением, чтобы увидеть скелет
                        </Typography>
                      </Paper>
                    )}

                    {/* Важность */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                        Важность
                      </Typography>
                      <Rating
                        value={selectedSnapshot.importance}
                        readOnly
                        max={10}
                        icon={<Star sx={{ color: theme.palette.warning.main }} />}
                        emptyIcon={<StarBorder />}
                      />
                    </Box>

                    {/* Заметки */}
                    {selectedSnapshot.notes && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                          Заметки
                        </Typography>
                        <Paper sx={{ 
                          p: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.6),
                          borderRadius: 2
                        }}>
                          <Typography variant="body2">
                            {selectedSnapshot.notes}
                          </Typography>
                        </Paper>
                      </Box>
                    )}

                    {/* Теги */}
                    {selectedSnapshot.tags && selectedSnapshot.tags.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                          Теги
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {selectedSnapshot.tags.map((tag: string, i: number) => (
                            <Chip
                              key={i}
                              label={tag}
                              size="small"
                              icon={<Tag />}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Статистика */}
                    <Paper sx={{ 
                      p: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                      borderRadius: 2
                    }}>
                      <Stack direction="row" spacing={3}>
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Просмотров
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedSnapshot.views}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Тип
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {selectedSnapshot.type === 'auto' ? 'Авто' : 
                             selectedSnapshot.type === 'manual' ? 'Ручной' : 
                             selectedSnapshot.type === 'calibration' ? 'Калибровка' : selectedSnapshot.type}
                          </Typography>
                        </Box>
                        {selectedSnapshot.imageMetadata && (
                          <Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Размер
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {Math.round(selectedSnapshot.imageMetadata.size / 1024)} KB
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
              <Button
                startIcon={<Delete />}
                color="error"
                onClick={() => handleDelete(selectedSnapshot._id)}
              >
                Удалить
              </Button>
              <Button
                startIcon={<ModeComment />}
                onClick={() => handleOpenEdit(selectedSnapshot)}
              >
                Редактировать
              </Button>
              <Button
                startIcon={<FavoriteBorder />}
                color={selectedSnapshot.isFavorite ? 'error' : 'inherit'}
                onClick={() => handleToggleFavorite(selectedSnapshot._id, selectedSnapshot.isFavorite)}
              >
                {selectedSnapshot.isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Полноэкранный просмотр */}
      <Dialog
        open={!!fullscreenImage}
        onClose={handleCloseFullscreen}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'black',
            position: 'relative',
            height: '90vh'
          }
        }}
      >
        <IconButton
          onClick={handleCloseFullscreen}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: alpha('#fff', 0.2),
            color: 'white',
            zIndex: 1,
            '&:hover': {
              bgcolor: alpha('#fff', 0.3)
            }
          }}
        >
          <Close />
        </IconButton>
        
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={fullscreenImage!}
            alt="Полноэкранный снимок"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Редактировать снимок</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Заметки"
              multiline
              rows={4}
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              placeholder="Добавьте заметки к снимку..."
            />

            <TextField
              label="Теги"
              value={editData.tags}
              onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
              fullWidth
              placeholder="тег1, тег2, тег3"
              helperText="Введите теги через запятую"
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Важность
              </Typography>
              <Rating
                value={editData.importance}
                onChange={(e, newValue) => setEditData(prev => ({ ...prev, importance: newValue || 5 }))}
                max={10}
                icon={<Star sx={{ color: theme.palette.warning.main }} />}
                emptyIcon={<StarBorder />}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={editData.isFavorite}
                  onChange={(e) => setEditData(prev => ({ ...prev, isFavorite: e.target.checked }))}
                  icon={<FavoriteBorder />}
                  checkedIcon={<Favorite sx={{ color: theme.palette.error.main }} />}
                />
              }
              label="Добавить в избранное"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Отмена</Button>
          <Button onClick={handleSaveEdit} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};