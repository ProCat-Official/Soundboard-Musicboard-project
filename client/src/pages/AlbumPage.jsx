import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import API_URL from '../config';

function Albumpage({ onPlay, selectedTrack, isPlaying, setIsPlaying, currentUserId, isAdmin }) {
    const { t } = useTranslation();
    const { albumName } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [otherAlbums, setOtherAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredTrack, setHoveredTrack] = useState(null);
    const [shuffleMode, setShuffleMode] = useState(false);
    const [hoveredAlbum, setHoveredAlbum] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);

    useEffect(() => {
        fetchAlbumData();
    }, [albumName]);

    const fetchAlbumData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/tracks`);
            const allTracks = response.data;
            
            const albumTracks = allTracks.filter(
                track => track.album && track.album.toLowerCase() === albumName.toLowerCase()
            );
            
            setTracks(albumTracks);
            
            if (albumTracks.length > 0) {
                let avatarUrl = '';
                try {
                    const artistResponse = await axios.get(`${API_URL}/api/artist/${encodeURIComponent(albumTracks[0].artist)}`);
                    avatarUrl = artistResponse.data.avatar_url || '';
                } catch (e) {
                    console.warn('Аватарка не найдена');
                }
                
                setAlbum({
                    name: albumName,
                    artist: albumTracks[0].artist,
                    tracks: albumTracks.length,
                    cover: albumTracks[0].cover_url,
                    year: albumTracks[0].release_year || '',
                    artistAvatar: avatarUrl,
                    id: albumTracks[0].album_id || null,
                    user_id: albumTracks[0].user_id || null,
                });

                const otherAlbumsData = {};
                allTracks.forEach(track => {
                    if (track.artist === albumTracks[0].artist && track.album && track.album.toLowerCase() !== albumName.toLowerCase()) {
                        if (!otherAlbumsData[track.album]) {
                            otherAlbumsData[track.album] = {
                                name: track.album,
                                cover: track.cover_url,
                                tracks: [],
                                year: track.release_year || '',
                            };
                        }
                        otherAlbumsData[track.album].tracks.push(track);
                    }
                });
                setOtherAlbums(Object.values(otherAlbumsData));
            } else {
                setAlbum(null);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    // ===== УДАЛЕНИЕ АЛЬБОМА =====
    const handleDeleteAlbum = async () => {
        if (!window.confirm(`Вы уверены, что хотите удалить альбом "${album.name}" и все его треки?`)) return;
        try {
            await axios.delete(`${API_URL}/api/albums/${album.id}`, {
                headers: { 'x-user-id': currentUserId }
            });
            if (album.artist) {
                navigate(`/artist/${encodeURIComponent(album.artist)}`);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert(error.response?.data?.error || 'Ошибка при удалении альбома');
        }
    };

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handlePlayAll = () => {
        if (tracks.length === 0) return;
        
        const isAlbumPlaying = selectedTrack && tracks.some(t => t.id === selectedTrack.id);
        
        if (isAlbumPlaying) {
            setIsPlaying(!isPlaying);
        } else {
            onPlay(tracks[0]);
            setIsPlaying(true);
        }
    };

    const handleShufflePlay = () => {
        const newShuffleMode = !shuffleMode;
        setShuffleMode(newShuffleMode);
    };

    const handleTrackClick = (track) => {
        if (selectedTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            onPlay(track);
            setIsPlaying(true);
        }
    };

    const handleArtistClick = () => {
        if (album?.artist) {
            navigate(`/artist/${encodeURIComponent(album.artist)}`);
        }
    };

    const handleAlbumClick = (albumName) => {
        navigate(`/album/${encodeURIComponent(albumName)}`);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    };

    const isDark = theme.palette.mode === 'dark';
    const headerBg = isDark
        ? 'linear-gradient(180deg, #621d3e 0%, #621d3e 60%, #5f1c3d 80%, #581939 100%)'
        : 'linear-gradient(180deg, #F8BBD0 0%, #F8BBD0 60%, #f0b3c8 80%, #e6abc0 100%)';
    const headerTextColor = isDark ? 'white' : '#1A0A0E';
    const headerSubColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,10,14,0.7)';
    const contentBg = isDark
        ? 'linear-gradient(180deg, #40122a 0%, #361727 30%, #211b1e 70%, #211c1f 100%)'
        : 'linear-gradient(180deg, #eab7c9 0%, #f0c7d5 30%, #f3cedb 70%, #ffffff 100%)';

    const canDelete = isAdmin || (album?.user_id === currentUserId);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!album) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5">{t('album.notFound')}</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                borderRadius: { xs: 0, md: 4 },
                overflow: { xs: 'visible', md: 'hidden' },
                boxShadow: { xs: 0, md: 3 },
                mx: { xs: -2, sm: -3, md: -5 },
                my: { xs: -10, md: 5 },
                width: { xs: '100vw', md: '104%' },
                maxWidth: { xs: '100vw', md: 'none' },
                position: { xs: 'relative', md: 'static' },
                left: { xs: -307, md: 'auto' },
                right: { xs: 0, md: 'auto' },
                pb: { xs: 25, md: 4 },
            }}
        >
            {/* Шапка альбома - адаптивная */}
            <Box
                sx={{
                    background: headerBg,
                    pt: { xs: 15, md: 6 },
                    pb: { xs: 3, md: 3 },
                    px: { xs: 2, md: 2 },
                    display: 'flex',
                    alignItems: { xs: 'center', md: 'center' },
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 2, md: 1 },
                    flexWrap: 'wrap',
                    position: 'relative',
                }}
            >
                {/* Кнопка "три точки" */}
                {canDelete && (
                    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                        <IconButton
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                            onClick={handleMenuOpen}
                        >
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={menuAnchor}
                            open={Boolean(menuAnchor)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem 
                                onClick={handleDeleteAlbum}
                                sx={{ 
                                    color: 'error.main',
                                    '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                                }}
                            >
                                🗑️ Удалить альбом
                            </MenuItem>
                        </Menu>
                    </Box>
                )}

                {/* Обложка - адаптивный размер */}
                <Box
                    component="img"
                    src={album.cover ? `${API_URL}${album.cover}` : 'https://via.placeholder.com/300x300?text=No+Cover'}
                    alt={album.name}
                    sx={{
                        width: { xs: '180px', md: '300px' },
                        height: { xs: '180px', md: '300px' },
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{ 
                    color: headerTextColor, 
                    alignSelf: { xs: 'center', md: 'flex-end' }, 
                    pb: { xs: 0, md: 3 },
                    textAlign: { xs: 'center', md: 'left' },
                    px: { xs: 1, md: 0 },
                }}>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.7,
                            fontSize: '0.75rem',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        {t('album.albumLabel')}
                    </Typography>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 'bold',
                            lineHeight: 1,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '2.9rem' },
                        }}
                    >
                        {album.name}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            opacity: 0.8,
                            fontSize: { xs: '0.8rem', md: '0.9rem' },
                            color: headerSubColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: { xs: 'center', md: 'flex-start' },
                            gap: 0.3,
                            flexWrap: 'wrap',
                        }}
                    >
                        {album.artistAvatar && (
                            <img
                                src={`${API_URL}${album.artistAvatar}`}
                                alt={album.artist}
                                style={{
                                    width: '25px',
                                    height: '25px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            />
                        )}
                        <span
                            onClick={handleArtistClick}
                            style={{
                                cursor: 'pointer',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = theme.palette.primary.main;
                                e.target.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = 'inherit';
                                e.target.style.textDecoration = 'none';
                            }}
                        >
                            {album.artist}
                        </span>
                        <span> • {album.year || ''} • {t('artist.tracksCount', { count: album.tracks })}</span>
                    </Typography>
                </Box>
            </Box>

            {/* Кнопки "Слушать" и "Перемешать" - адаптивные */}
            <Box
                sx={{
                    background: isDark
                        ? 'linear-gradient(180deg, #4a1530 0%, #4a1530 30%, #47152f 60%, #40122a 100%)'
                        : 'linear-gradient(180deg, #dc91ab 0%, #e6abc0 30%, #e6b0c3 60%, #eab7c9 100%)',
                    px: { xs: 2, md: 4 },
                    py: { xs: 2, md: 2.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    gap: { xs: 1.5, md: 2 },
                    flexWrap: 'wrap',
                }}
            >
                <Button
                    variant="contained"
                    startIcon={isPlaying && selectedTrack && tracks.some(t => t.id === selectedTrack.id) ? (
                        <PauseIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                    ) : (
                        <PlayArrowIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                    )}
                    onClick={handlePlayAll}
                    sx={{
                        px: { xs: 3, md: 4 },
                        py: { xs: 1, md: 1.5 },
                        borderRadius: '30px',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                        textTransform: 'none',
                        minWidth: { xs: '100px', md: '120px' },
                        gap: 1,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                    }}
                >
                    {isPlaying && selectedTrack && tracks.some(t => t.id === selectedTrack.id) ? t('common.pause') : t('common.listen')}
                </Button>

                <Button
                    variant={shuffleMode ? 'contained' : 'outlined'}
                    onClick={handleShufflePlay}
                    sx={{
                        px: { xs: 3, md: 4 },
                        py: { xs: 1, md: 1.5 },
                        borderRadius: '30px',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                        textTransform: 'none',
                        minWidth: { xs: '120px', md: '140px' },
                        gap: 1,
                        ...(shuffleMode && {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                        }),
                        ...(!shuffleMode && {
                            borderColor: 'divider',
                            color: 'text.secondary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                color: 'primary.main',
                            },
                        }),
                    }}
                >
                    <ShuffleIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                    {shuffleMode ? t('common.shuffleActive') : t('common.shuffle')}
                </Button>
            </Box>

            {/* Список треков */}
            <Box
                sx={{
                    background: contentBg,
                    px: { xs: 2, md: 4 },
                    py: { xs: 2, md: 3 },
                }}
            >
                {/* ШАПКА ТАБЛИЦЫ */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        px: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mb: 1,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                                fontWeight: 'bold',
                                fontSize: { xs: '0.8rem', md: '0.95rem' },
                                minWidth: '28px',
                                textAlign: 'center',
                            }}
                        >
                            #
                        </Typography>
                        <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                                fontWeight: 'bold',
                                fontSize: { xs: '0.8rem', md: '0.95rem' },
                            }}
                        >
                            {t('album.trackName')}
                        </Typography>
                    </Box>
                    <AccessTimeIcon sx={{ fontSize: { xs: 18, md: 21 }, color: 'text.secondary' }} />
                </Box>

                {/* СПИСОК ТРЕКОВ */}
                <Box>
                    {tracks.map((track, index) => {
                        const isTrackPlaying = selectedTrack?.id === track.id;
                        return (
                            <Box
                                key={track.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    py: { xs: 0.8, md: 1 },
                                    px: { xs: 1, md: 1.5 },
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                                onClick={() => handleTrackClick(track)}
                                onMouseEnter={() => setHoveredTrack(track.id)}
                                onMouseLeave={() => setHoveredTrack(null)}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, minWidth: 0 }}>
                                    {/* НОМЕР И PLAY/PAUSE */}
                                    <Box sx={{ minWidth: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {hoveredTrack === track.id ? (
                                            <IconButton
                                                size="small"
                                                sx={{ padding: 0 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTrackClick(track);
                                                }}
                                            >
                                                {isTrackPlaying && isPlaying ? (
                                                    <PauseIcon sx={{ fontSize: { xs: 18, md: 21 } }} />
                                                ) : (
                                                    <PlayArrowIcon sx={{ fontSize: { xs: 18, md: 21 } }} />
                                                )}
                                            </IconButton>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: isTrackPlaying ? 'bold' : 400,
                                                    fontSize: { xs: '0.8rem', md: '0.95rem' },
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    color: isTrackPlaying ? '#E91E63' : 'text.secondary',
                                                }}
                                            >
                                                {index + 1}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* НАЗВАНИЕ И ИСПОЛНИТЕЛЬ */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                fontWeight: isTrackPlaying ? 'bold' : 400,
                                                fontSize: { xs: '0.85rem', md: '1rem' },
                                                color: isTrackPlaying ? '#E91E63' : 'text.primary',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: { xs: '120px', sm: '200px', md: '300px' },
                                            }}
                                        >
                                            {track.title}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                fontSize: { xs: '0.65rem', md: '0.75rem' },
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    color: '#E91E63',
                                                    textDecoration: 'underline'
                                                },
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (track.artist) {
                                                    navigate(`/artist/${encodeURIComponent(track.artist)}`);
                                                }
                                            }}
                                        >
                                            {track.artist}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* ДЛИТЕЛЬНОСТЬ */}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: { xs: '0.75rem', md: '0.85rem' },
                                        color: isTrackPlaying ? '#E91E63' : 'text.secondary',
                                        minWidth: '40px',
                                        textAlign: 'right',
                                        flexShrink: 0,
                                    }}
                                >
                                    {track.duration ? formatTime(track.duration) : '--:--'}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

{/* Другие альбомы исполнителя */}
{otherAlbums.length > 0 && (
    <Box
        sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            borderTop: '1px solid',
            borderColor: 'divider',
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {t('album.otherAlbums', { artist: album.artist })}
            </Typography>
            <Button
                variant="text"
                sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.7rem', md: '0.85rem' },
                    p: 0,
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => navigate(`/artist/${encodeURIComponent(album.artist)}/albums`)}
            >
                {t('album.viewDiscography')}
            </Button>
        </Box>

        {/* ✅ ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ ТОЛЬКО ДЛЯ ТЕЛЕФОНОВ */}
        <Box sx={{ 
            display: 'flex', 
            gap: { xs: 2, md: 3 }, 
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            overflowX: { xs: 'auto', md: 'visible' },
            overflowY: 'hidden',
            justifyContent: { xs: 'flex-start', md: 'flex-start' },
            pb: { xs: 1, md: 0 },
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(128,128,128,0.3)',
                borderRadius: '4px',
            },
            px: { xs: 0.5, md: 0 },
            mx: { xs: -0.5, md: 0 },
        }}>
            {otherAlbums.slice(0, 6).map((otherAlbum) => {
                const isHovered = hoveredAlbum === otherAlbum.name;
                return (
                    <Card
                        key={otherAlbum.name}
                        sx={{
                            width: { xs: '150px', sm: '180px', md: '200px' },
                            flexShrink: 0,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: isHovered 
                                ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)') 
                                : 'transparent !important',
                            '&:hover': {
                                transform: 'scale(1.04)',
                                boxShadow: 8,
                            },
                        }}
                        elevation={0}
                        onMouseEnter={() => setHoveredAlbum(otherAlbum.name)}
                        onMouseLeave={() => setHoveredAlbum(null)}
                        onClick={() => handleAlbumClick(otherAlbum.name)}
                    >
                        <Box sx={{ position: 'relative' }}>
                            <CardMedia
                                component="img"
                                height={window.innerWidth < 600 ? 150 : 200}
                                image={otherAlbum.cover ? `${API_URL}${otherAlbum.cover}` : 'https://via.placeholder.com/200x200?text=No+Cover'}
                                alt={otherAlbum.name}
                                sx={{ 
                                    objectFit: 'cover',
                                    backgroundColor: 'action.hover',
                                }}
                            />
                            {isHovered && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 12,
                                        right: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'primary.main',
                                        borderRadius: '50%',
                                        width: { xs: 36, md: 44 },
                                        height: { xs: 36, md: 44 },
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                        transition: 'transform 0.2s ease',
                                        '&:hover': { transform: 'scale(1.08)' },
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (otherAlbum.tracks.length > 0) {
                                            onPlay(otherAlbum.tracks[0]);
                                            setIsPlaying(true);
                                        }
                                    }}
                                >
                                    <PlayArrowIcon sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />
                                </Box>
                            )}
                        </Box>
                        <CardContent 
                            sx={{ 
                                p: { xs: 1.5, md: 2 }, 
                                pb: '12px !important',
                            }}
                        >
                            <Typography 
                                variant="body1" 
                                noWrap 
                                sx={{ 
                                    fontWeight: 700,
                                    fontSize: { xs: '0.8rem', md: '0.95rem' },
                                }}
                            >
                                {otherAlbum.name}
                            </Typography>
                            <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                noWrap
                                sx={{
                                    fontSize: { xs: '0.65rem', md: '0.8rem' },
                                }}
                            >
                                {t('homepage.album')} • {otherAlbum.year || ''} 
                            </Typography>
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    </Box>
)}
        </Box>
    );
}

export default Albumpage;
