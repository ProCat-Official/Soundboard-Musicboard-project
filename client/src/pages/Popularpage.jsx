import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import AlbumIcon from '@mui/icons-material/Album';
import CardItem from '../components/Carditem';
import API_URL from '../config';

const SECTION_LIMIT = 9;

// Компонент для отображения ОДНОЙ секции (ряда) с карточками — БЕЗ ЗАГОЛОВКА
const Section = React.memo(({ items, renderItem }) => {
    if (!items || items.length === 0) return null;

    return (
        <Box sx={{ mb: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: { xs: 'nowrap', md: 'nowrap' },
                    overflowX: { xs: 'auto', md: 'hidden' },
                    overflowY: 'hidden',
                    pb: { xs: 1, md: 0 },
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { height: '4px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderRadius: '4px',
                    },
                }}
            >
                {items.map(renderItem)}
            </Box>
        </Box>
    );
});

function PopularPage({ onPlay, selectedTrack, isPlaying, setIsPlaying }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [tracks, setTracks] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredId, setHoveredId] = useState(null);

    // Фильтр по типу
    const [filterType, setFilterType] = useState(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('type');
        if (typeParam && ['tracks', 'albums', 'artists'].includes(typeParam)) {
            return typeParam;
        }
        return 'tracks';
    });

    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('type');
        if (typeParam && ['tracks', 'albums', 'artists'].includes(typeParam) && typeParam !== filterType) {
            setFilterType(typeParam);
        }
    }, [location.search]);

    useEffect(() => {
        fetchPopular();
    }, []);

    const fetchPopular = async () => {
        setLoading(true);
        try {
            const tracksResponse = await axios.get(`${API_URL}/api/tracks/popular`);
            const tracksData = tracksResponse.data || [];
            setTracks(tracksData);

            const albumsResponse = await axios.get(`${API_URL}/api/albums/popular`);
            const albumsData = albumsResponse.data || [];
            setAlbums(albumsData);

            const artistsResponse = await axios.get(`${API_URL}/api/artists/popular`);
            const artistsData = artistsResponse.data || [];
            setArtists(artistsData);

        } catch (error) {
            console.error('Ошибка загрузки популярного:', error);
            
            try {
                const tracksResponse = await axios.get(`${API_URL}/api/tracks/popular`);
                const tracksData = tracksResponse.data || [];
                setTracks(tracksData);

                const albumMap = {};
                tracksData.forEach(track => {
                    if (track.album) {
                        if (!albumMap[track.album]) {
                            albumMap[track.album] = {
                                id: `album-${track.album}`,
                                title: track.album,
                                artist: track.artist,
                                cover_url: track.cover_url,
                                tracks_count: 0,
                                release_year: track.release_year || '',
                            };
                        }
                        albumMap[track.album].tracks_count++;
                    }
                });
                setAlbums(Object.values(albumMap));

                const artistMap = {};
                tracksData.forEach(track => {
                    if (track.artist) {
                        if (!artistMap[track.artist]) {
                            artistMap[track.artist] = {
                                id: `artist-${track.artist}`,
                                name: track.artist,
                                tracks_count: 0,
                            };
                        }
                        artistMap[track.artist].tracks_count++;
                    }
                });
                setArtists(Object.values(artistMap));
            } catch (fallbackError) {
                console.error('Fallback ошибка:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTrackClick = (track) => {
        if (selectedTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            onPlay(track);
            setIsPlaying(true);
        }
    };

    const handleFilterOpen = (event) => setFilterAnchorEl(event.currentTarget);
    const handleFilterClose = () => setFilterAnchorEl(null);
    const handleFilterChange = (type) => {
        setFilterType(type);
        handleFilterClose();
    };

    const isDark = theme.palette.mode === 'dark';

    const getFilterLabel = () => {
        switch (filterType) {
            case 'albums': return t('homepage.albums');
            case 'artists': return t('homepage.artists');
            default: return t('homepage.tracks');
        }
    };

    const getFilterIcon = () => {
        switch (filterType) {
            case 'albums': return <AlbumIcon sx={{ fontSize: 18, color: '#E91E63' }} />;
            case 'artists': return <PersonIcon sx={{ fontSize: 18, color: '#E91E63' }} />;
            default: return <MusicNoteIcon sx={{ fontSize: 18, color: '#E91E63' }} />;
        }
    };

    // ─── Рендер трека ───────────────────────────────────────────────────────────
    const renderTrack = useCallback((track) => {
        const isActive = selectedTrack?.id === track.id;
        const isHovered = hoveredId === `track-${track.id}`;
        const subtitle = `${track.artist || ''} • ${t('homepage.track')} • ${track.release_year || ''}`;

        return (
            <Box key={track.id} sx={{ flexShrink: 0, width: { xs: '140px', sm: '160px', md: '150px' } }}>
                <CardItem
                    id={track.id}
                    title={track.title}
                    subtitle={subtitle}
                    image={track.cover_url ? `${API_URL}${track.cover_url}` : null}
                    type="track"
                    isPlaying={isPlaying}
                    isActive={isActive}
                    isHovered={isHovered}
                    onPlay={() => handleTrackClick(track)}
                    onNavigate={() => {
                        if (track.album) {
                            navigate(`/album/${encodeURIComponent(track.album)}`);
                        }
                    }}
                    onHover={(h) => setHoveredId(h ? `track-${track.id}` : null)}
                    width="100%"
                    imageHeight={150}
                    borderRadius={2}
                    showPlayButton
                />
            </Box>
        );
    }, [selectedTrack, isPlaying, hoveredId, t, navigate]);

    // ─── Рендер альбома ─────────────────────────────────────────────────────────
    const renderAlbum = useCallback((album) => {
        const isHovered = hoveredId === `album-${album.id}`;
        const subtitle = `${album.artist || ''} • ${t('homepage.album')} • ${album.release_year || ''}`;

        return (
            <Box key={album.id} sx={{ flexShrink: 0, width: { xs: '140px', sm: '160px', md: '150px' } }}>
                <CardItem
                    id={album.id}
                    title={album.title}
                    subtitle={subtitle}
                    image={album.cover_url ? `${API_URL}${album.cover_url}` : null}
                    type="album"
                    isPlaying={false}
                    isActive={false}
                    isHovered={isHovered}
                    onNavigate={() => navigate(`/album/${encodeURIComponent(album.title)}`)}
                    onHover={(h) => setHoveredId(h ? `album-${album.id}` : null)}
                    width="100%"
                    imageHeight={150}
                    borderRadius={2}
                    showPlayButton={false}
                />
            </Box>
        );
    }, [hoveredId, t, navigate]);

    // ─── Рендер артиста ─────────────────────────────────────────────────────────
    const renderArtist = useCallback((artist) => {
        const isHovered = hoveredId === `artist-${artist.id}`;
        const subtitle = `${artist.tracks_count || 0} ${t('homepage.tracks')}`;

        return (
            <Box key={artist.id} sx={{ flexShrink: 0, width: { xs: '140px', sm: '160px', md: '150px' } }}>
                <CardItem
                    id={artist.id}
                    title={artist.name}
                    subtitle={subtitle}
                    image={artist.avatar_url ? `${API_URL}${artist.avatar_url}` : null}
                    type="artist"
                    isPlaying={false}
                    isActive={false}
                    isHovered={isHovered}
                    onNavigate={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                    onHover={(h) => setHoveredId(h ? `artist-${artist.id}` : null)}
                    width="100%"
                    imageHeight={150}
                    borderRadius={2}
                    imageVariant="circle"
                    showPlayButton={false}
                />
            </Box>
        );
    }, [hoveredId, t, navigate]);

    // Если загрузка - показываем спиннер
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // ✅ Функция для разбиения массива на чанки по SECTION_LIMIT
    const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const renderContent = () => {
        let items = [];
        let renderFn = null;

        switch (filterType) {
            case 'albums':
                items = albums;
                renderFn = renderAlbum;
                break;
            case 'artists':
                items = artists;
                renderFn = renderArtist;
                break;
            default:
                items = tracks;
                renderFn = renderTrack;
                break;
        }

        if (!items || items.length === 0) return null;

        // Разбиваем на чанки по SECTION_LIMIT
        const chunks = chunkArray(items, SECTION_LIMIT);

        return chunks.map((chunk, index) => (
            <Section
                key={`section-${index}`}
                items={chunk}
                renderItem={renderFn}
            />
        ));
    };

    const hasContent = tracks.length > 0 || albums.length > 0 || artists.length > 0;

    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                borderRadius: { xs: 0, md: 4 },
                overflow: { xs: 'visible', md: 'hidden' },
                boxShadow: { xs: 0, md: 3 },
                mx: { xs: -2, sm: -3, md: -5 },
                my: { xs: 5, md: 5 },
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
            {/* Заголовок + Фильтр */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                    {t('homepage.popularSection')}
                </Typography>

                <Button
                    variant="outlined"
                    onClick={handleFilterOpen}
                    endIcon={<ArrowDropDownIcon />}
                    size="small"
                    sx={{
                        textTransform: 'none',
                        color: 'text.primary',
                        borderColor: 'divider',
                        borderRadius: '20px',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                        },
                        fontSize: { xs: '0.7rem', md: '0.8rem' },
                    }}
                >
                    {getFilterIcon()}
                    <Typography sx={{ ml: 0.5, fontWeight: 'bold', color: '#E91E63', fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                        {getFilterLabel()}
                    </Typography>
                </Button>
                <Menu
                    anchorEl={filterAnchorEl}
                    open={Boolean(filterAnchorEl)}
                    onClose={handleFilterClose}
                >
                    <MenuItem onClick={() => handleFilterChange('tracks')}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <MusicNoteIcon sx={{ color: filterType === 'tracks' ? '#E91E63' : 'text.secondary' }} />
                            <Typography sx={{ fontWeight: filterType === 'tracks' ? 'bold' : 400, color: filterType === 'tracks' ? '#E91E63' : 'text.primary' }}>
                                {t('homepage.tracks')}
                            </Typography>
                            {filterType === 'tracks' && <Typography sx={{ color: '#E91E63' }}>✓</Typography>}
                        </Box>
                    </MenuItem>
                    <MenuItem onClick={() => handleFilterChange('albums')}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AlbumIcon sx={{ color: filterType === 'albums' ? '#E91E63' : 'text.secondary' }} />
                            <Typography sx={{ fontWeight: filterType === 'albums' ? 'bold' : 400, color: filterType === 'albums' ? '#E91E63' : 'text.primary' }}>
                                {t('homepage.albums')}
                            </Typography>
                            {filterType === 'albums' && <Typography sx={{ color: '#E91E63' }}>✓</Typography>}
                        </Box>
                    </MenuItem>
                    <MenuItem onClick={() => handleFilterChange('artists')}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PersonIcon sx={{ color: filterType === 'artists' ? '#E91E63' : 'text.secondary' }} />
                            <Typography sx={{ fontWeight: filterType === 'artists' ? 'bold' : 400, color: filterType === 'artists' ? '#E91E63' : 'text.primary' }}>
                                {t('homepage.artists')}
                            </Typography>
                            {filterType === 'artists' && <Typography sx={{ color: '#E91E63' }}>✓</Typography>}
                        </Box>
                    </MenuItem>
                </Menu>
            </Box>

            {/* Кнопка назад */}
            <Typography 
                variant="body2" 
                sx={{ 
                    color: 'primary.main', 
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                    mb: 2,
                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                }}
                onClick={() => navigate(-1)}
            >
                {t('underConstruction.back')}
            </Typography>

            {/* Контент */}
            {hasContent ? (
                renderContent()
            ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <MusicNoteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {t('homepage.noPopular') || 'Нет популярных релизов'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default PopularPage;