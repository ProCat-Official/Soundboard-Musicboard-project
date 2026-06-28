import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation  } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SortIcon from '@mui/icons-material/Sort';
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useTheme } from '@mui/material/styles';
import API_URL from '../config';

function AlbumList({ onPlay, selectedTrack, isPlaying, setIsPlaying, setCurrentTime }) {
    const { t } = useTranslation();
    const { artistName } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [artist, setArtist] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredAlbum, setHoveredAlbum] = useState(null);
    const [hoveredTrack, setHoveredTrack] = useState(null);
    
    // Сортировка
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const [sortType, setSortType] = useState(() => {
        const saved = localStorage.getItem('albumList_sortType');
        return saved || 'date';
    });
    const [sortOrder, setSortOrder] = useState(() => {
        const saved = localStorage.getItem('albumList_sortOrder');
        return saved || 'desc';
    });
    const location = useLocation();

    const [filterType, setFilterType] = useState(() => {
        const params = new URLSearchParams(location.search);
        const filterParam = params.get('filter');
        if (filterParam && ['all', 'albums', 'singles'].includes(filterParam)) {
            return filterParam;
        }
        const saved = localStorage.getItem('albumList_filterType');
        return saved || 'all';
    });
    const [viewFormat, setViewFormat] = useState(() => {
        const saved = localStorage.getItem('albumList_viewFormat');
        return saved || 'grid';
    });

    // Фильтр (Все / Альбомы / Синглы и EP)
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    // Формат (Список / Сетка)
    const [formatAnchorEl, setFormatAnchorEl] = useState(null);

    // Сохраняем настройки при изменении
    useEffect(() => {
        localStorage.setItem('albumList_sortType', sortType);
    }, [sortType]);

    useEffect(() => {
        localStorage.setItem('albumList_sortOrder', sortOrder);
    }, [sortOrder]);

    useEffect(() => {
        localStorage.setItem('albumList_filterType', filterType);
    }, [filterType]);

    useEffect(() => {
        localStorage.setItem('albumList_viewFormat', viewFormat);
    }, [viewFormat]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const filterParam = params.get('filter');
        if (filterParam && ['all', 'albums', 'singles'].includes(filterParam) && filterParam !== filterType) {
            setFilterType(filterParam);
        }
    }, [location.search]);

    useEffect(() => {
        fetchAlbumData();
    }, [artistName]);

    const fetchAlbumData = async () => {
        setLoading(true);
        try {
            const artistResponse = await axios.get(`${API_URL}/api/artist/${encodeURIComponent(artistName)}`);
            const artistData = artistResponse.data;

            const tracksResponse = await axios.get(`${API_URL}/api/tracks`);
            const allTracks = tracksResponse.data;
            
            const artistTracks = allTracks.filter(
                track => track.artist && track.artist.toLowerCase() === artistName.replace(/_/g, ' ').toLowerCase()
            );

            const albumMap = {};
            artistTracks.forEach(track => {
                if (track.album) {
                    if (!albumMap[track.album]) {
                        albumMap[track.album] = {
                            name: track.album,
                            artist: track.artist,
                            cover: track.cover_url,
                            tracks: [],
                            year: track.release_year || '',
                            isSingle: track.album.toLowerCase().includes('single') || track.album.length < 10,
                        };
                    }
                    albumMap[track.album].tracks.push(track);
                }
            });

            const albumList = Object.values(albumMap);
            setAlbums(albumList);
            setArtist({
                name: artistData.name || artistName.replace(/_/g, ' '),
                avatar: `${API_URL}${artistData.avatar_url || '/static/artists/default.jpg'}`,
            });
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArtistClick = () => {
        if (artist?.name) {
            navigate(`/artist/${encodeURIComponent(artist.name)}`);
        }
    };

    const handleAlbumClick = (albumName) => {
        navigate(`/album/${encodeURIComponent(albumName)}`);
    };

    const handleAlbumPlay = (album, event) => {
        event.stopPropagation();
        if (album.tracks.length > 0) {
            const isAlbumPlaying = selectedTrack && album.tracks.some(t => t.id === selectedTrack.id);
            if (isAlbumPlaying) {
                setIsPlaying(!isPlaying);
            } else {
                onPlay(album.tracks[0]);
                setIsPlaying(true);
            }
        }
    };

    const isAlbumPlaying = (album) => {
        return selectedTrack && album.tracks.some(t => t.id === selectedTrack.id);
    };

    // Фильтр
    const handleFilterOpen = (event) => setFilterAnchorEl(event.currentTarget);
    const handleFilterClose = () => setFilterAnchorEl(null);
    const handleFilterChange = (type) => {
        setFilterType(type);
        handleFilterClose();
    };

    // Сортировка
    const handleSortOpen = (event) => setSortAnchorEl(event.currentTarget);
    const handleSortClose = () => setSortAnchorEl(null);
    const handleSortChange = (type) => {
        setSortType(type);
        handleSortClose();
    };
    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    };

    // Формат
    const handleFormatOpen = (event) => setFormatAnchorEl(event.currentTarget);
    const handleFormatClose = () => setFormatAnchorEl(null);
    const handleFormatChange = (format) => {
        setViewFormat(format);
        handleFormatClose();
    };

    // Фильтрация альбомов
    const filteredAlbums = albums.filter(album => {
        if (filterType === 'albums') return !album.isSingle;
        if (filterType === 'singles') return album.isSingle;
        return true;
    });

    // Сортировка
    const sortedAlbums = [...filteredAlbums].sort((a, b) => {
        if (sortType === 'name') {
            return sortOrder === 'desc' 
                ? b.name.localeCompare(a.name) 
                : a.name.localeCompare(b.name);
        } else {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return sortOrder === 'desc' ? yearB - yearA : yearA - yearB;
        }
    });

    const isDark = theme.palette.mode === 'dark';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!artist || albums.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5">{t('albumList.notFound')}</Typography>
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
        my: { xs: 3, md: 5 },
        width: { xs: '100vw', md: '104%' },
        maxWidth: { xs: '100vw', md: 'none' },
        position: { xs: 'relative', md: 'static' },
        left: { xs: -307, md: 'auto' },
        right: { xs: 0, md: 'auto' },
        p: { xs: 2, md: 3 },
        pb: { xs: 12, md: 3 },  
        minHeight: { xs: '100vh', md: 'auto' },  
    }}
>
            {/* Шапка */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                    }}
                    onClick={handleArtistClick}
                >
                    {artist.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Фильтр: Все / Альбомы / Синглы и EP */}
                    <Button
                        variant="text"
                        onClick={handleFilterOpen}
                        endIcon={<ArrowDropDownIcon />}
                        size="small"
                        sx={{
                            textTransform: 'none',
                            color: 'text.primary',
                            fontWeight: 'bold',
                        }}
                    >
                        {filterType === 'all' ? t('albumList.all') : filterType === 'albums' ? t('albumList.albums') : t('albumList.singles')}
                    </Button>
                    <Menu
                        anchorEl={filterAnchorEl}
                        open={Boolean(filterAnchorEl)}
                        onClose={handleFilterClose}
                    >
                        <MenuItem 
                            onClick={() => handleFilterChange('all')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: filterType === 'all' ? 'bold' : 400,
                                        color: filterType === 'all' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.all')}
                                </Typography>
                                {filterType === 'all' && (
                                    <Typography sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                        
                        <MenuItem 
                            onClick={() => handleFilterChange('albums')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: filterType === 'albums' ? 'bold' : 400,
                                        color: filterType === 'albums' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.albums')}
                                </Typography>
                                {filterType === 'albums' && (
                                    <Typography sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                        
                        <MenuItem 
                            onClick={() => handleFilterChange('singles')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: filterType === 'singles' ? 'bold' : 400,
                                        color: filterType === 'singles' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.singles')}
                                </Typography>
                                {filterType === 'singles' && (
                                    <Typography sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                    </Menu>

                    {/* Сортировка */}
                    <Button
                        variant="text"
                        onClick={handleSortOpen}
                        endIcon={<SortIcon />}
                        size="small"
                        sx={{
                            textTransform: 'none',
                            color: 'text.primary',
                        }}
                    >
                        {sortType === 'date' ? t('albumList.date') : t('albumList.name')}
                        {sortOrder === 'desc' ? 
                            <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.primary' }} /> : 
                            <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.primary' }} />
                        }
                    </Button>
                    <Menu
                        anchorEl={sortAnchorEl}
                        open={Boolean(sortAnchorEl)}
                        onClose={handleSortClose}
                    >
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary">{t('albumList.sortBy')}</Typography>
                        </Box>
                        
                        <MenuItem 
                            onClick={() => {
                                if (sortType === 'date') {
                                    toggleSortOrder();
                                } else {
                                    handleSortChange('date');
                                }
                            }}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: sortType === 'date' ? 'bold' : 400,
                                        color: sortType === 'date' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.date')}
                                </Typography>
                            </Box>
                            {sortType === 'date' && (
                                <IconButton 
                                    size="small" 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        toggleSortOrder(); 
                                    }}
                                    sx={{ color: '#E91E63' }}
                                >
                                    {sortOrder === 'desc' ? 
                                        <ArrowDownwardIcon fontSize="small" /> : 
                                        <ArrowUpwardIcon fontSize="small" />
                                    }
                                </IconButton>
                            )}
                        </MenuItem>
                        
                        <MenuItem 
                            onClick={() => {
                                if (sortType === 'name') {
                                    toggleSortOrder();
                                } else {
                                    handleSortChange('name');
                                }
                            }}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: sortType === 'name' ? 'bold' : 400,
                                        color: sortType === 'name' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.name')}
                                </Typography>
                            </Box>
                            {sortType === 'name' && (
                                <IconButton 
                                    size="small" 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        toggleSortOrder(); 
                                    }}
                                    sx={{ color: '#E91E63' }}
                                >
                                    {sortOrder === 'desc' ? 
                                        <ArrowDownwardIcon fontSize="small" /> : 
                                        <ArrowUpwardIcon fontSize="small" />
                                    }
                                </IconButton>
                            )}
                        </MenuItem>
                        
                        <Divider />
                        
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary">{t('albumList.libraryFormat')}</Typography>
                        </Box>
                        
                        <MenuItem 
                            onClick={() => handleFormatChange('list')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ViewListIcon sx={{ color: viewFormat === 'list' ? '#E91E63' : 'text.secondary' }} />
                                <Typography 
                                    sx={{ 
                                        fontWeight: viewFormat === 'list' ? 'bold' : 400,
                                        color: viewFormat === 'list' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.list')}
                                </Typography>
                                {viewFormat === 'list' && (
                                    <Typography sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                        
                        <MenuItem 
                            onClick={() => handleFormatChange('grid')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ViewModuleIcon sx={{ color: viewFormat === 'grid' ? '#E91E63' : 'text.secondary' }} />
                                <Typography 
                                    sx={{ 
                                        fontWeight: viewFormat === 'grid' ? 'bold' : 400,
                                        color: viewFormat === 'grid' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    {t('albumList.grid')}
                                </Typography>
                                {viewFormat === 'grid' && (
                                    <Typography sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Контент */}
            {viewFormat === 'grid' ? (
                <Grid container spacing={3}>
                    {sortedAlbums.map((album) => {
                        const isHovered = hoveredAlbum === album.name;
                        const isPlayingNow = isAlbumPlaying(album);
                        return (
                            <Grid item xs={12} sm={6} md={4} key={album.name}>
                                <Box
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                                        backgroundColor: isHovered ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
                                        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                    }}
                                    onMouseEnter={() => setHoveredAlbum(album.name)}
                                    onMouseLeave={() => setHoveredAlbum(null)}
                                    onClick={() => handleAlbumClick(album.name)}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={album.cover ? `${API_URL}${album.cover}` : 'https://via.placeholder.com/300x200?text=No+Cover'}
                                            alt={album.name}
                                            style={{
                                                width: '100%',
                                                height: '200px',
                                                objectFit: 'cover',
                                            }}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Cover';
                                            }}
                                        />
                                        {isHovered && (
                                            <IconButton
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 12,
                                                    right: 12,
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    width: 48,
                                                    height: 48,
                                                    '&:hover': {
                                                        bgcolor: 'primary.dark',
                                                        transform: 'scale(1.05)',
                                                    },
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (album.tracks.length > 0) {
                                                        const firstTrack = album.tracks[0];
                                                        if (selectedTrack?.id === firstTrack.id) {
                                                            if (isPlaying) {
                                                                setIsPlaying(false);
                                                            } else {
                                                                setIsPlaying(true);
                                                            }
                                                        } else {
                                                            onPlay(firstTrack);
                                                            setIsPlaying(true);
                                                        }
                                                    }
                                                }}
                                            >
                                                {isPlayingNow && isPlaying ? (
                                                    <PauseIcon sx={{ fontSize: 28 }} />
                                                ) : (
                                                    <PlayArrowIcon sx={{ fontSize: 28 }} />
                                                )}
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Box sx={{ p: 2, textAlign: 'left' }}>
                                        <Typography variant="body1" noWrap sx={{ fontWeight: 'bold' }}>
                                            {album.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {t('albumList.albumType')} • {album.year || ''} • {t('albumList.tracksCount', { count: album.tracks.length })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                // Список
                <Box>
                    {sortedAlbums.map((album) => (
                        <Box
                            key={album.name}
                            sx={{
                                mb: 5,
                                pb: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <img
                                    src={album.cover ? `${API_URL}${album.cover}` : 'https://via.placeholder.com/60x60?text=No+Cover'}
                                    alt={album.name}
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/60x60?text=No+Cover';
                                    }}
                                />
                                <Box>
                                    <Typography 
                                        variant="h5" 
                                        sx={{ 
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '3rem',  
                                            '&:hover': { 
                                                color: 'primary.main',
                                                textDecoration: 'underline' 
                                            }
                                        }}
                                        onClick={() => handleAlbumClick(album.name)}
                                    >
                                        {album.name}
                                    </Typography>
                                    <Typography 
                                        variant="body1"  
                                        color="text.secondary"
                                        sx={{
                                            fontSize: '1rem', 
                                        }}
                                    >
                                        {t('albumList.albumType')} • {album.year || ''} • {t('albumList.tracksCount', { count: album.tracks.length })}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        sx={{ 
                                            padding: 2,
                                            mt: 1.5,
                                            bgcolor: isDark ? 'white' : 'black',  
                                            color: isDark ? 'black' : 'white',  
                                            '&:hover': {
                                                bgcolor: isDark ? '#f0f0f0' : '#333',
                                            },
                                            width: 28,
                                            height: 28,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (album.tracks.length > 0) {
                                                const firstTrack = album.tracks[0];
                                                onPlay(firstTrack, true);
                                                setIsPlaying(true);
                                            }
                                        }}
                                    >
                                        <PlayArrowIcon sx={{ fontSize: 24 }} />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Список треков в альбоме */}
                            <Box sx={{ ml: 0, mt: 1 }}>
                                {/* ===== ЗАГОЛОВОК ТРЕКОВ ===== */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        py: 1,
                                        px: 2,
                                        borderBottom: '2px solid',
                                        borderColor: 'divider',
                                        mb: 0.5,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, ml: 1, fontSize: '0.95rem', fontWeight: 'bold' }}>
                                            #
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                                            {t('albumList.trackName')}
                                        </Typography>
                                    </Box>
                                    <AccessTimeIcon sx={{ fontSize: 21, color: 'text.secondary' }} />
                                </Box>

                                {/* Треки */}
                                {album.tracks.map((track, index) => {
                                    const isTrackPlaying = selectedTrack?.id === track.id;
                                    return (
                                        <Box
                                            key={track.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                py: 1.5,
                                                px: 2,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                            onMouseEnter={() => setHoveredTrack(track.id)}
                                            onMouseLeave={() => setHoveredTrack(null)}
                                            onClick={() => {
                                                if (isTrackPlaying) {
                                                    setIsPlaying(!isPlaying);
                                                } else {
                                                    onPlay(track);
                                                    setIsPlaying(true);
                                                }
                                            }}
                                        >
                                            {/* Левая часть: номер + название + исполнитель */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                {/* Цифра Play/Pause */}
                                                <Box sx={{ minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {hoveredTrack === track.id ? (
                                                        <IconButton 
                                                            size="small" 
                                                            sx={{ padding: 0 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isTrackPlaying) {
                                                                    setIsPlaying(!isPlaying);
                                                                } else {
                                                                    onPlay(track);
                                                                    setIsPlaying(true);
                                                                }
                                                            }}
                                                        >
                                                            {isTrackPlaying && isPlaying ? (
                                                                <PauseIcon sx={{ fontSize: 21 }} />
                                                            ) : (
                                                                <PlayArrowIcon sx={{ fontSize: 21 }} />
                                                            )}
                                                        </IconButton>
                                                    ) : (
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                textAlign: 'center',
                                                                color: isTrackPlaying ? '#E91E63' : 'text.secondary',
                                                                fontWeight: isTrackPlaying ? 'bold' : 400,
                                                                fontSize: '0.95rem',
                                                                minWidth: 32,
                                                            }}
                                                        >
                                                            {index + 1}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                
                                                {/* Название и исполнитель */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                    <Typography 
                                                        variant="body1" 
                                                        sx={{
                                                            color: isTrackPlaying ? '#E91E63' : 'text.primary',
                                                            fontWeight: isTrackPlaying ? 'bold' : 400,
                                                            fontSize: '1rem',
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {track.title}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        color="text.secondary"
                                                        sx={{
                                                            fontSize: '0.80rem',
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

                                            {/* Длительность */}
                                            <Typography 
                                                variant="body2" 
                                                sx={{
                                                    fontSize: '0.9rem',
                                                    color: isTrackPlaying ? '#E91E63' : 'text.secondary',
                                                    minWidth: 50,
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {track.duration ? formatTime(track.duration) : '--:--'}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
};

export default AlbumList;