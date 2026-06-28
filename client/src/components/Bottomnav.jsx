import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import AlbumIcon from '@mui/icons-material/Album';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import API_URL from '../config';
import { useTheme } from '../context/ThemeContext';

function BottomNav({ tracks, onPlay, selectedTrack, isPlaying, setIsPlaying }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [artistsData, setArtistsData] = useState([]);
    const [hoveredArtist, setHoveredArtist] = useState(null);

    const isDark = theme === 'dark';

    // Загрузка исполнителей для медиатеки
    useEffect(() => {
        fetchArtistsData();
    }, [tracks]);

    const fetchArtistsData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/artists`);
            const allArtists = response.data;
            const artistsWithData = allArtists
                .map(artist => ({
                    ...artist,
                    tracks: tracks.filter(t => t.artist === artist.name),
                }))
                .filter(a => a.tracks.length > 0);
            setArtistsData(artistsWithData);
        } catch (error) {
            console.warn('API /artists не найден, используем fallback из tracks');
            const artists = [...new Set(tracks.map(t => t.artist))].filter(Boolean);
            const fallbackData = await Promise.all(artists.map(async (artist) => {
                let avatarUrl = '';
                try {
                    const artistRes = await axios.get(`${API_URL}/api/artist/${encodeURIComponent(artist)}`);
                    avatarUrl = artistRes.data.avatar_url || '';
                } catch (e) {
                    avatarUrl = `/static/artists/${artist.toLowerCase().replace(/ /g, '_')}.jpg`;
                }
                return {
                    name: artist,
                    avatar_url: avatarUrl,
                    tracks: tracks.filter(t => t.artist === artist),
                };
            }));
            setArtistsData(fallbackData);
        }
    };

    // ===== УЛУЧШЕННЫЙ ПОИСК =====
    const handleSearch = async (e) => {
        const value = e.target.value;
        setQuery(value);
        
        if (value.trim().length === 0) {
            setResults([]);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/tracks/search?query=${encodeURIComponent(value.trim())}`);
            const tracksData = response.data;

            const combinedResults = [];

            // Исполнители
            const artistNames = [...new Set(tracksData.map(t => t.artist).filter(Boolean))];
            for (const name of artistNames) {
                let avatarUrl = '';
                try {
                    const artistRes = await axios.get(`${API_URL}/api/artist/${encodeURIComponent(name)}`);
                    avatarUrl = artistRes.data.avatar_url || '';
                } catch (e) {
                    avatarUrl = `/static/artists/${name.toLowerCase().replace(/ /g, '_')}.jpg`;
                }
                combinedResults.push({
                    type: 'artist',
                    name: name,
                    avatar: avatarUrl,
                });
            }

            // Альбомы
            const albumsMap = {};
            tracksData.forEach(t => {
                if (t.album && !albumsMap[t.album]) {
                    let cover = t.cover_url || '';
                    if (!cover) {
                        const trackWithCover = tracksData.find(t2 => t2.album === t.album && t2.cover_url);
                        if (trackWithCover) cover = trackWithCover.cover_url;
                    }
                    albumsMap[t.album] = {
                        name: t.album,
                        cover: cover,
                        artist: t.artist,
                    };
                }
            });
            Object.values(albumsMap).forEach(album => {
                combinedResults.push({
                    type: 'album',
                    name: album.name,
                    cover: album.cover,
                    artist: album.artist,
                });
            });

            // Треки
            tracksData.slice(0, 5).forEach(track => {
                combinedResults.push({
                    type: 'track',
                    name: track.title,
                    cover: track.cover_url || '',
                    id: track.id,
                    album: track.album,
                    artist: track.artist,
                    duration: track.duration,
                });
            });

            setResults(combinedResults);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            setResults([]);
        }
    };

    const handleItemClick = (item) => {
        setSearchOpen(false);
        setQuery('');
        setResults([]);
        if (item.type === 'artist') {
            navigate(`/artist/${encodeURIComponent(item.name)}`);
        } else if (item.type === 'album') {
            navigate(`/album/${encodeURIComponent(item.name)}`);
        } else if (item.type === 'track') {
            if (item.album) {
                navigate(`/album/${encodeURIComponent(item.album)}`);
            }
        }
    };

    const handleHomeClick = () => {
        setLibraryOpen(false);
        setSearchOpen(false);
        navigate('/');
    };

    const handleLibraryClick = () => {
        setLibraryOpen(!libraryOpen);
        if (!libraryOpen) {
            setSearchOpen(false);
        }
    };

    const handleArtistClick = (artist) => {
        setLibraryOpen(false);
        navigate(`/artist/${encodeURIComponent(artist.name)}`);
    };

    const handlePlayArtist = (artist, event) => {
        event.stopPropagation();
        if (artist.tracks.length === 0) return;
        const isArtistPlaying = selectedTrack && artist.tracks.some(t => t.id === selectedTrack.id);
        if (isArtistPlaying) {
            setIsPlaying(!isPlaying);
        } else {
            const randomIndex = Math.floor(Math.random() * artist.tracks.length);
            onPlay(artist.tracks[randomIndex]);
            setIsPlaying(true);
        }
    };

    const isArtistPlaying = (artist) => {
        return selectedTrack && artist.tracks.some(t => t.id === selectedTrack.id);
    };

    const handleAllTracksClick = () => {
        setLibraryOpen(false);
        navigate('/under-construction');
    };

    const getArtistAvatar = (artist) => {
        if (artist.avatar_url) {
            return artist.avatar_url.startsWith('http') 
                ? artist.avatar_url 
                : `${API_URL}${artist.avatar_url}`;
        }
        return `/static/artists/${artist.name.toLowerCase().replace(/ /g, '_')}.jpg`;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'artist': return <PersonIcon sx={{ fontSize: 24, color: isDark ? 'white' : '#1A0A0E' }} />;
            case 'album': return <AlbumIcon sx={{ fontSize: 24, color: isDark ? 'white' : '#1A0A0E' }} />;
            default: return <MusicNoteIcon sx={{ fontSize: 24, color: isDark ? 'white' : '#1A0A0E' }} />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'artist': return t('search.artist') || 'Исполнитель';
            case 'album': return t('search.album') || 'Альбом';
            default: return t('search.track') || 'Трек';
        }
    };

    const truncateText = (text, maxLength = 35) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        let truncated = text.slice(0, maxLength);
        let lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
        return truncated + '...';
    };

    return (
        <>
            {/* Нижняя панель навигации */}
            <Paper
                elevation={0}
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1100,
                    display: { xs: 'flex', md: 'none' },
                    bgcolor: { 
                        xs: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    },
                    backdropFilter: { xs: 'blur(10px)', md: 'none' },
                    borderTop: { xs: '1px solid', md: 'none' },
                    borderColor: { 
                        xs: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        md: 'transparent'
                    },
                    py: 0.5,
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    height: '56px',
                }}
            >
                <Box
                    onClick={handleHomeClick}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 0.5,
                        px: 2,
                        opacity: location.pathname === '/' && !libraryOpen ? 1 : 0.6,
                        '&:hover': { opacity: 1 },
                        transition: 'opacity 0.2s',
                    }}
                >
                    <HomeIcon sx={{ fontSize: 26, color: isDark ? 'white' : '#1A0A0E' }} />
                    <Typography variant="caption" sx={{ 
                        fontSize: '0.55rem', 
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        mt: 0.3,
                    }}>
                        {t('bottomNav.home')}
                    </Typography>
                </Box>

                <Box
                    onClick={() => setSearchOpen(true)}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 0.5,
                        px: 2,
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                        transition: 'opacity 0.2s',
                    }}
                >
                    <SearchIcon sx={{ fontSize: 26, color: isDark ? 'white' : '#1A0A0E' }} />
                    <Typography variant="caption" sx={{ 
                        fontSize: '0.55rem', 
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        mt: 0.3,
                    }}>
                        {t('bottomNav.search')}
                    </Typography>
                </Box>

                <Box
                    onClick={handleLibraryClick}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        py: 0.5,
                        px: 2,
                        opacity: libraryOpen ? 1 : 0.6,
                        '&:hover': { opacity: 1 },
                        transition: 'opacity 0.2s',
                    }}
                >
                    <LibraryMusicIcon sx={{ fontSize: 26, color: isDark ? 'white' : '#1A0A0E' }} />
                    <Typography variant="caption" sx={{ 
                        fontSize: '0.55rem', 
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        mt: 0.3,
                    }}>
                        {t('bottomNav.library')}
                    </Typography>
                </Box>
            </Paper>

            {/* ===== МЕДИАТЕКА (ПОЛНОЭКРАННАЯ, КАК САЙДБАР) ===== */}
            {libraryOpen && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: { xs: '56px', md: 0 },
                        left: 0,
                        right: 0,
                        bottom: { xs: '56px', md: 0 },
                        zIndex: 1150,
                        bgcolor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        pt: { xs: 1, md: 2 },
                    }}
                >
                    {/* Шапка */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        px: 2,
                        pb: 1.5,
                        borderBottom: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LibraryMusicIcon sx={{ color: isDark ? 'white' : '#1A0A0E' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDark ? 'white' : '#1A0A0E' }}>
                                {t('sidebar.mediaLibrary')}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setLibraryOpen(false)}>
                            <CloseIcon sx={{ color: isDark ? 'white' : '#1A0A0E' }} />
                        </IconButton>
                    </Box>

                    {/* ===== КОНТЕНТ МЕДИАТЕКИ (КАК В САЙДБАРЕ) ===== */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {/* Все треки */}
                        <ListItemButton
                            sx={{
                                borderRadius: 1,
                                px: 1,
                                py: 1,
                                mb: 0.5,
                                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                            }}
                            onClick={handleAllTracksClick}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <PlaylistPlayIcon sx={{ color: isDark ? 'white' : '#1A0A0E' }} />
                            </ListItemIcon>
                            <Box>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        color: isDark ? 'white' : '#1A0A0E',
                                    }}
                                >
                                    {t('sidebar.allTracks')}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.7rem',
                                        display: 'block',
                                    }}
                                >
                                    {t('sidebar.playlist')}
                                </Typography>
                            </Box>
                        </ListItemButton>

                        <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />

                        {/* Исполнители */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
                            {t('sidebar.artists')}
                        </Typography>

                        {artistsData.slice(0, 20).map((artist) => {
                            const isPlayingNow = isArtistPlaying(artist);
                            const avatarUrl = getArtistAvatar(artist);

                            return (
                                <ListItemButton
                                    key={artist.name}
                                    sx={{
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.7,
                                        mb: 0.3,
                                        '&:hover': { 
                                            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        },
                                    }}
                                    onClick={() => handleArtistClick(artist)}
                                    onMouseEnter={() => setHoveredArtist(artist.name)}
                                    onMouseLeave={() => setHoveredArtist(null)}
                                >
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 38,
                                        }}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt={artist.name}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=621d3e&color=fff&size=36&font-size=0.5`;
                                            }}
                                        />
                                        {hoveredArtist === artist.name && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handlePlayArtist(artist, e)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    color: 'white',
                                                    padding: '2px',
                                                    backgroundColor: 'transparent',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        color: 'white',
                                                    },
                                                }}
                                            >
                                                {isPlayingNow && isPlaying ? (
                                                    <PauseIcon sx={{ fontSize: 24 }} />
                                                ) : (
                                                    <PlayArrowIcon sx={{ fontSize: 24 }} />
                                                )}
                                            </IconButton>
                                        )}
                                    </Box>

                                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                sx={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    color: isPlayingNow ? '#E91E63' : (isDark ? 'white' : '#1A0A0E'),
                                                }}
                                            >
                                                {artist.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    display: 'block',
                                                }}
                                            >
                                                {t('sidebar.artist')}
                                            </Typography>
                                        </Box>
                                        {isPlayingNow && isPlaying && (
                                            <VolumeUpIcon 
                                                sx={{ 
                                                    fontSize: 18, 
                                                    color: '#E91E63',
                                                    mr: 0.5,
                                                }} 
                                            />
                                        )}
                                    </Box>
                                </ListItemButton>
                            );
                        })}

                        {artistsData.length === 0 && (
                            <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                                {t('sidebar.noArtists')}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

            {/* ===== ПОИСК ===== */}
            {searchOpen && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: { xs: '56px', md: 0 },
                        left: 0,
                        right: 0,
                        bottom: { xs: '56px', md: 0 },
                        zIndex: 1200,
                        bgcolor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <IconButton onClick={() => {
                            setSearchOpen(false);
                            setQuery('');
                            setResults([]);
                        }}>
                            <CloseIcon sx={{ color: isDark ? 'white' : '#1A0A0E' }} />
                        </IconButton>
                        <TextField
                            fullWidth
                            autoFocus
                            placeholder={t('common.search')}
                            value={query}
                            onChange={handleSearch}
                            variant="standard"
                            sx={{
                                '& .MuiInput-root': {
                                    color: isDark ? 'white' : '#1A0A0E',
                                    fontSize: '1.2rem',
                                },
                                '& .MuiInput-underline:before': {
                                    borderBottomColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                },
                            }}
                        />
                    </Box>

                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        {results.length === 0 && query.trim().length > 0 && (
                            <Typography sx={{ textAlign: 'center', mt: 4, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                {t('common.noResults')}
                            </Typography>
                        )}
                        {results.map((item, index) => (
                            <ListItemButton
                                key={index}
                                onClick={() => handleItemClick(item)}
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    },
                                }}
                            >
                                <ListItemIcon>
                                    {item.type === 'artist' ? (
                                        <img
                                            src={item.avatar ? `${API_URL}${item.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=621d3e&color=fff&size=32`}
                                            alt={item.name}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                            }}
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=621d3e&color=fff&size=32`;
                                            }}
                                        />
                                    ) : (
                                        item.cover ? (
                                            <img
                                                src={`${API_URL}${item.cover}`}
                                                alt={item.name}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '4px',
                                                    objectFit: 'cover',
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            getTypeIcon(item.type)
                                        )
                                    )}
                                </ListItemIcon>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            color: isDark ? 'white' : '#1A0A0E',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {truncateText(item.name, 35)}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.7rem',
                                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                        }}
                                    >
                                        {item.type === 'artist' 
                                            ? getTypeLabel(item.type) 
                                            : `${getTypeLabel(item.type)} • ${item.artist || ''}`}
                                    </Typography>
                                </Box>
                            </ListItemButton>
                        ))}
                    </Box>
                </Box>
            )}
        </>
    );
}

export default BottomNav;