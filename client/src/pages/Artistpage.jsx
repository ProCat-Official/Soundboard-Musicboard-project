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
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CircularProgress from '@mui/material/CircularProgress';
import EmptyState from '../components/Emptystate';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import API_URL from '../config';

function Artistpage({ onPlay, selectedTrack, isPlaying, setIsPlaying, currentUserId, isAdmin }) {
    const { t, i18n } = useTranslation();   
    const { artistName } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [artist, setArtist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [popularTracks, setPopularTracks] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [showAllPopular, setShowAllPopular] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shuffleMode, setShuffleMode] = useState(false);
    const [shuffledQueue, setShuffledQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [bio, setBio] = useState('');
    const [language, setLanguage] = useState('ua');
    const [activeCategory, setActiveCategory] = useState('popular');
    const [hoveredAlbum, setHoveredAlbum] = useState(null);
    const [hoveredTrack, setHoveredTrack] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);

    useEffect(() => {
        setLanguage(i18n.language || 'ua');
    }, [i18n.language]);

    useEffect(() => {
        fetchArtistData();
    }, [artistName, language]);

    const fetchArtistData = async () => {
        setLoading(true);
        try {
            const artistResponse = await axios.get(`${API_URL}/api/artist/${encodeURIComponent(artistName)}`);
            const artistData = artistResponse.data;

            const tracksResponse = await axios.get(`${API_URL}/api/tracks`);
            const allTracks = tracksResponse.data;
            
            const artistTracks = allTracks.filter(
                track => track.artist && track.artist.toLowerCase() === artistName.replace(/_/g, ' ').toLowerCase()
            );
            setTracks(artistTracks);
            setPopularTracks(artistTracks.slice(0, 10));

            try {
                const bioResponse = await axios.get(`${API_URL}/api/artist/${encodeURIComponent(artistName)}/bio?lang=${language}`);
                setBio(bioResponse.data.bio || '');
            } catch (bioError) {
                setBio('');
            }

            const albumMap = {};
            artistTracks.forEach(track => {
                if (track.album) {
                    if (!albumMap[track.album]) {
                        const isSingle = track.album.toLowerCase().includes('single') || 
                                        track.album.toLowerCase().includes('ep') || 
                                        track.album.length < 8 ||
                                        (artistTracks.filter(t => t.album === track.album).length <= 2);
                        
                        albumMap[track.album] = {
                            name: track.album,
                            cover: track.cover_url,
                            tracks: [],
                            year: track.release_year || '',
                            isSingle: isSingle,
                        };
                    }
                    albumMap[track.album].tracks.push(track);
                }
            });
            setAlbums(Object.values(albumMap));

            if (artistTracks.length > 0) {
                setArtist({
                    id: artistData.id,
                    name: artistData.name || artistName.replace(/_/g, ' '),
                    tracks: artistTracks.length,
                    cover: artistTracks[0].cover_url,
                    avatar: `${API_URL}${artistData.avatar_url || '/static/artists/default.jpg'}`,
                    user_id: artistTracks[0]?.user_id || null,
                });
            } else {
                setArtist(null);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const playTrack = (track) => {
        if (track) {
            onPlay(track);
            setIsPlaying(true);
        }
    };

    const handlePlayAll = () => {
        if (tracks.length === 0) return;
        
        const isPopularPlaying = selectedTrack && popularTracks.some(t => t.id === selectedTrack.id);
        
        if (isPopularPlaying) {
            setIsPlaying(!isPlaying);
        } else {
            if (popularTracks.length > 0) {
                playTrack(popularTracks[0]);
            } else {
                playTrack(tracks[0]);
            }
        }
    };

    const handleShufflePlay = () => {
        const newShuffleMode = !shuffleMode;
        setShuffleMode(newShuffleMode);

        if (newShuffleMode && tracks.length > 0) {
            const queue = [...tracks];
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue[i], queue[j]] = [queue[j], queue[i]];
            }
            setShuffledQueue(queue);
            setQueueIndex(0);
        } else {
            setShuffledQueue([]);
            setQueueIndex(0);
        }
    };

    const handleAlbumClick = (albumName) => {
        navigate(`/album/${encodeURIComponent(albumName)}`);
    };

    const handleTrackClick = (track) => {
        if (selectedTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            playTrack(track);
            if (shuffleMode) {
                setShuffleMode(false);
                setShuffledQueue([]);
                setQueueIndex(0);
            }
        }
    };

    const handleShowAll = () => {
        let filterType = 'all';
        if (activeCategory === 'popular') filterType = 'all';
        else if (activeCategory === 'albums') filterType = 'albums';
        else if (activeCategory === 'singles') filterType = 'singles';
        
        navigate(`/artist/${encodeURIComponent(artist.name)}/albums?filter=${filterType}`);
    };

    const handleNext = () => {
        if (tracks.length === 0) return;

        if (shuffleMode && shuffledQueue.length > 0) {
            const nextIndex = (queueIndex + 1) % shuffledQueue.length;
            setQueueIndex(nextIndex);
            playTrack(shuffledQueue[nextIndex]);
        } else {
            if (!selectedTrack) {
                playTrack(tracks[0]);
                return;
            }
            const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
            const nextIndex = (currentIndex + 1) % tracks.length;
            playTrack(tracks[nextIndex]);
        }
    };

    const handlePrev = () => {
        if (tracks.length === 0) return;

        if (shuffleMode && shuffledQueue.length > 0) {
            const prevIndex = (queueIndex - 1 + shuffledQueue.length) % shuffledQueue.length;
            setQueueIndex(prevIndex);
            playTrack(shuffledQueue[prevIndex]);
        } else {
            if (!selectedTrack) {
                playTrack(tracks[0]);
                return;
            }
            const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
            const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
            playTrack(tracks[prevIndex]);
        }
    };

    // ===== УДАЛЕНИЕ ИСПОЛНИТЕЛЯ =====
    const handleDeleteArtist = async () => {
        if (!window.confirm(`Вы уверены, что хотите удалить исполнителя "${artist.name}" и все его треки?`)) return;
        try {
            await axios.delete(`${API_URL}/api/artists/${artist.id}`, {
                headers: { 'x-user-id': currentUserId }
            });
            navigate('/');
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert(error.response?.data?.error || 'Ошибка при удалении исполнителя');
        }
    };

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!artist) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5">{t('artist.notFound')}</Typography>
            </Box>
        );
    }

    const displayedPopularTracks = showAllPopular ? popularTracks : popularTracks.slice(0, 5);

    const getFilteredAlbums = () => {
        switch (activeCategory) {
            case 'popular':
                return albums.slice(0, 7);
            case 'albums':
                return albums.filter(a => !a.isSingle).slice(0, 7);
            case 'singles':
                return albums.filter(a => a.isSingle).slice(0, 7);
            default:
                return albums.slice(0, 7);
        }
    };

    const filteredAlbums = getFilteredAlbums();
    const isDark = theme.palette.mode === 'dark';
    const headerBg = isDark
        ? 'linear-gradient(180deg, #621d3e 0%, #621d3e 60%, #5f1c3d 80%, #581939 100%)'
        : 'linear-gradient(180deg, #F8BBD0 0%, #F8BBD0 60%, #f0b3c8 80%, #e6abc0 100%)';
    const headerTextColor = isDark ? 'white' : '#1A0A0E';
    const headerSubColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,10,14,0.7)';

    // Проверка прав на удаление
    const canDelete = isAdmin || (artist?.user_id === currentUserId);

    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                borderRadius: { xs: 0, md: 4 },
                overflow: { xs: 'visible', md: 'hidden' },
                boxShadow: { xs: 0, md: 3 },
                mx: { xs: -2, sm: -3, md: -5 },
                my: { xs: -11.5, md: 5 },
                width: { xs: '100vw', md: '104%' },
                maxWidth: { xs: '100vw', md: 'none' },
                position: { xs: 'relative', md: 'static' },
                left: { xs: -307, md: 'auto' },
                right: { xs: 0, md: 'auto' },
                pb: { xs: 25, md: 4 },
            }}
        >
            {/* Шапка */}
            <Box
                sx={{
                    background: headerBg,
                    pt: { xs: 15, md: 3 },
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
                {/* ===== КНОПКА "ТРИ ТОЧКИ" В ШАПКЕ ===== */}
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
                                onClick={handleDeleteArtist}
                                sx={{ 
                                    color: 'error.main',
                                    '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                                }}
                            >
                                🗑️ Удалить исполнителя
                            </MenuItem>
                        </Menu>
                    </Box>
                )}

                {artist.avatar && !artist.avatar.includes('default.jpg') ? (
                    <Box
                        component="img"
                        src={artist.avatar}
                        alt={artist.name}
                        sx={{
                            width: { xs: '180px', md: '300px' },
                            height: { xs: '180px', md: '300px' },
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                            flexShrink: 0,
                        }}
                    />
                ) : (
                    <Box sx={{ width: { xs: '180px', md: '300px' }, height: { xs: '180px', md: '300px' }, flexShrink: 0 }}>
                        <EmptyState type="artist" size="100%" height="100%" borderRadius="50%" />
                    </Box>
                )}

                <Box sx={{ 
                    color: headerTextColor, 
                    alignSelf: { xs: 'center', md: 'flex-end' }, 
                    pb: { xs: 0, md: 5 },
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
                        {t('artist.title')}
                    </Typography>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 'bold',
                            lineHeight: 1,
                            fontSize: { xs: '2.2rem', sm: '3rem', md: '5.2rem' },
                        }}
                    >
                        {artist.name}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            opacity: 0.7,
                            fontSize: '0.85rem',
                            color: headerSubColor,
                        }}
                    >
                        {t('artist.tracksCount', { count: artist.tracks })}
                    </Typography>
                </Box>
            </Box>

            {/* Кнопки */}
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
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        },
                    }}
                >
                    {isPlaying && selectedTrack && popularTracks.some(t => t.id === selectedTrack.id) ? (
                        <PauseIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                    ) : (
                        <PlayArrowIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                    )}
                    {isPlaying && selectedTrack && popularTracks.some(t => t.id === selectedTrack.id) ? t('common.pause') : t('common.listen')}
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
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
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

            {/* Популярные треки */}
            <Box sx={{
                background: isDark
                    ? 'linear-gradient(180deg, #40122a 0%, #361727 30%, #211b1e 70%, #211c1f 100%)'
                    : 'linear-gradient(180deg, #eab7c9 0%, #f0c7d5 30%, #f3cedb 70%, #ffffff 100%)',
                px: { xs: 2, md: 4 },
                py: { xs: 2, md: 3 }
            }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    {t('artist.popularTracks')}
                </Typography>

                <Box>
                    {displayedPopularTracks.map((track, index) => {
                        const isTrackPlaying = selectedTrack?.id === track.id;
                        return (
                            <Box
                                key={track.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: { xs: 1.5, md: 2 },
                                    py: { xs: 0.75, md: 1 },
                                    px: { xs: 1, md: 1.5 },
                                    borderRadius: 1,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        cursor: 'pointer',
                                    },
                                    position: 'relative',
                                }}
                                onClick={() => handleTrackClick(track)}
                                onMouseEnter={() => setHoveredTrack(track.id)}
                                onMouseLeave={() => setHoveredTrack(null)}
                            >
                                {/* Номер трека (скрыт на телефонах) */}
                                <Box
                                    sx={{
                                        minWidth: { xs: 0, md: '28px' },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: { xs: 0, md: 1 },
                                        width: { xs: 0, md: 'auto' },
                                        overflow: 'hidden',
                                    }}
                                >
                                    {hoveredTrack === track.id ? (
                                        <IconButton
                                            size="small"
                                            sx={{
                                                color: 'text.primary',
                                                padding: 0,
                                            }}
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
                                                fontSize: { xs: '0.85rem', md: '0.95rem' },
                                                textAlign: 'center',
                                                width: '100%',
                                                color: isTrackPlaying ? '#E91E63' : 'text.secondary',
                                            }}
                                        >
                                            {index + 1}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Обложка трека */}
                                {track.cover_url ? (
                                    <Box
                                        component="img"
                                        src={`${API_URL}${track.cover_url}`}
                                        alt={track.title}
                                        sx={{
                                            width: { xs: '46px', md: '40px' },
                                            height: { xs: '46px', md: '40px' },
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <EmptyState 
                                        type="track" 
                                        size={40}
                                        height={40}
                                        borderRadius="4px" 
                                    />
                                )}

                                {/* Название трека */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        flex: 1,
                                        fontWeight: isTrackPlaying ? 'bold' : 400,
                                        fontSize: { xs: '1.1rem', md: '1rem' },
                                        color: isTrackPlaying ? '#E91E63' : 'text.primary',
                                        lineHeight: 1.3,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        minWidth: 0,
                                    }}
                                >
                                    {track.title}
                                </Typography>

                                {/* Длительность */}
                                <Typography
                                    variant="body2"
                                    color={isTrackPlaying ? '#E91E63' : 'text.secondary'}
                                    sx={{
                                        fontSize: { xs: '0.9rem', md: '0.90rem' },
                                        minWidth: '45px',
                                        textAlign: 'right',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}
                                >
                                    {track.duration ? formatTime(track.duration) : '--:--'}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {popularTracks.length > 5 && (
                    <Button
                        variant="text"
                        onClick={() => setShowAllPopular(!showAllPopular)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            p: 0,
                            mt: 1.5,
                            color: 'text.secondary',
                            '&:hover': {
                                color: 'primary.main',
                            },
                        }}
                    >
                        {showAllPopular ? t('common.collapse') : t('common.more', { count: popularTracks.length - 5 })}
                    </Button>
                )}
            </Box>

            {/* ===== МУЗЫКА ===== */}
            <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                        {t('artist.music')}
                    </Typography>
                    <Button
                        variant="text"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.8rem', md: '0.85rem' },
                            p: 0,
                        }}
                        onClick={handleShowAll}
                    >
                        {t('common.showAll')} →
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, mb: 3, flexWrap: 'wrap' }}>
                    <Button
                        variant={activeCategory === 'popular' ? 'contained' : 'outlined'}
                        onClick={() => setActiveCategory('popular')}
                        sx={{
                            borderRadius: '30px',
                            textTransform: 'none',
                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                            px: { xs: 2, md: 2.5 },
                            py: { xs: 0.5, md: 0.6 },
                            ...(activeCategory === 'popular' && {
                                bgcolor: 'text.primary',
                                color: 'background.paper',
                                '&:hover': {
                                    bgcolor: 'text.primary',
                                    opacity: 0.8,
                                },
                            }),
                            ...(activeCategory !== 'popular' && {
                                borderColor: 'divider',
                                color: 'text.secondary',
                            }),
                        }}
                    >
                        {t('artist.popularReleases')}
                    </Button>
                    <Button
                        variant={activeCategory === 'albums' ? 'contained' : 'outlined'}
                        onClick={() => setActiveCategory('albums')}
                        sx={{
                            borderRadius: '30px',
                            textTransform: 'none',
                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                            px: { xs: 2, md: 2.5 },
                            py: { xs: 0.5, md: 0.6 },
                            ...(activeCategory === 'albums' && {
                                bgcolor: 'text.primary',
                                color: 'background.paper',
                                '&:hover': {
                                    bgcolor: 'text.primary',
                                    opacity: 0.8,
                                },
                            }),
                            ...(activeCategory !== 'albums' && {
                                borderColor: 'divider',
                                color: 'text.secondary',
                            }),
                        }}
                    >
                        {t('artist.albums')}
                    </Button>
                    <Button
                        variant={activeCategory === 'singles' ? 'contained' : 'outlined'}
                        onClick={() => setActiveCategory('singles')}
                        sx={{
                            borderRadius: '30px',
                            textTransform: 'none',
                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                            px: { xs: 2, md: 2.5 },
                            py: { xs: 0.5, md: 0.6 },
                            ...(activeCategory === 'singles' && {
                                bgcolor: 'text.primary',
                                color: 'background.paper',
                                '&:hover': {
                                    bgcolor: 'text.primary',
                                    opacity: 0.8,
                                },
                            }),
                            ...(activeCategory !== 'singles' && {
                                borderColor: 'divider',
                                color: 'text.secondary',
                            }),
                        }}
                    >
                        {t('artist.singles')}
                    </Button>
                </Box>

                {/* КАРТОЧКИ АЛЬБОМОВ */}
                <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 2, md: 3 }, 
                    flexWrap: { xs: 'nowrap', md: 'wrap' },
                    overflowX: { xs: 'auto', md: 'visible' },
                    overflowY: 'hidden',
                    justifyContent: { xs: 'flex-start', md: 'flex-start' },
                    pb: { xs: 1, md: 0 },
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        height: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                    },
                    px: { xs: 0.5, md: 0 },
                    mx: { xs: -0.5, md: 0 },
                }}>
                    {filteredAlbums.map((album) => {
                        const isAlbumPlaying = selectedTrack && album.tracks.some(t => t.id === selectedTrack.id);
                        const isHovered = hoveredAlbum === album.name;
                        return (
                            <Card
                                key={album.name}
                                sx={{
                                    width: { xs: '160px', sm: '180px', md: '200px' },
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
                                onMouseEnter={() => setHoveredAlbum(album.name)}
                                onMouseLeave={() => setHoveredAlbum(null)}
                                onClick={() => handleAlbumClick(album.name)}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    {album.cover ? (
                                        <CardMedia
                                            component="img"
                                            height={window.innerWidth < 600 ? '160' : '200'}
                                            image={`${API_URL}${album.cover}`}
                                            alt={album.name}
                                            sx={{ 
                                                objectFit: 'cover',
                                                backgroundColor: 'action.hover',
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ height: { xs: '160px', sm: '200px' } }}>
                                            <EmptyState type="album" size="100%" height="100%" borderRadius="0px" />
                                        </Box>
                                    )}
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
                                                '&:hover': {
                                                    transform: 'scale(1.08)',
                                                },
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (album.tracks.length > 0) {
                                                    if (isAlbumPlaying && selectedTrack) {
                                                        onPlay(selectedTrack);
                                                    } else {
                                                        onPlay(album.tracks[0]);
                                                    }
                                                }
                                            }}
                                        >
                                            {isAlbumPlaying && isPlaying ? (
                                                <PauseIcon sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />
                                            ) : (
                                                <PlayArrowIcon sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />
                                            )}
                                        </Box>
                                    )}
                                </Box>
                                <CardContent 
                                    sx={{ 
                                        p: { xs: 1.5, md: 2 }, 
                                        pb: '12px !important',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.5,
                                    }}
                                >
                                    <Typography 
                                        variant="body1" 
                                        noWrap 
                                        sx={{ 
                                            fontWeight: 700,
                                            fontSize: { xs: '0.85rem', md: '0.95rem' },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%',
                                            lineHeight: 1.3,
                                            cursor: 'pointer',
                                            transition: 'color 0.2s ease',
                                            '&:hover': {
                                                color: 'primary.main',
                                                textDecoration: 'underline',
                                            },
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAlbumClick(album.name);
                                        }}
                                    >
                                        {album.name}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        noWrap
                                        sx={{
                                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%',
                                            display: 'block',
                                            lineHeight: 1.3,
                                            opacity: 0.8,
                                            cursor: 'default',
                                        }}
                                    >
                                        {album.isSingle ? t('artist.single') : t('homepage.album')} • {album.year || ''}
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            </Box>

            {/* Об исполнителе */}
            <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, pb: { xs: 4, md: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    {t('artist.about')}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        lineHeight: 1.6,
                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                    }}
                >
                    {bio || `${artist.name} — ${t('artist.defaultBio')}`}
                </Typography>
            </Box>
        </Box>
    );
}

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
};

export default Artistpage;