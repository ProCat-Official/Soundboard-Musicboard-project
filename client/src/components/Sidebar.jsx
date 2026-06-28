import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import axios from 'axios';
import API_URL from '../config'

function Sidebar({ tracks, isOpen, onToggle, onPlay, selectedTrack, isPlaying, setIsPlaying }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [artistsData, setArtistsData] = useState([]);
    const [hoveredArtist, setHoveredArtist] = useState(null);

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

    const handleArtistClick = (artist) => {
        navigate(`/artist/${encodeURIComponent(artist.name)}`);
    };

    const handlePlayArtist = (artist, event) => {
        event.stopPropagation();
        if (!isOpen) return;
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
        navigate('/under-construction');
    };

    const sidebarWidth = isOpen ? 260 : 60;

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                top: 70,
                left: 16,
                width: sidebarWidth,
                maxHeight: 'calc(100vh - 160px)',
                overflow: 'auto',
                bgcolor: 'background.paper',
                borderRadius: 2,
                zIndex: 100,
                transition: 'width 0.25s ease, box-shadow 0.2s ease',
                // ✅ СКРЫВАЕМ САЙДБАР НА ТЕЛЕФОНАХ
                display: { xs: 'none', md: 'block' }, // ← ГЛАВНОЕ ИЗМЕНЕНИЕ
                '&::-webkit-scrollbar': {
                    width: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'primary.main',
                    borderRadius: '3px',
                },
                '&:hover': {
                    boxShadow: 6,
                }
            }}
        >
            <Box
                sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'space-between' : 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                {isOpen && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LibraryMusicIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                            {t('sidebar.mediaLibrary')}
                        </Typography>
                    </Box>
                )}
                <IconButton
                    onClick={onToggle}
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                    }}
                >
                    {isOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
            </Box>

            <Box sx={{ p: isOpen ? 1.5 : 0.5 }}>
                <List dense>
                    {/* Все треки */}
                    <ListItemButton
                        sx={{
                            borderRadius: 1,
                            justifyContent: isOpen ? 'flex-start' : 'center',
                            px: isOpen ? 1 : 0.5,
                            py: isOpen ? 0.8 : 0.5,
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={handleAllTracksClick}
                    >
                        <ListItemIcon sx={{ minWidth: isOpen ? 36 : 32 }}>
                            <PlaylistPlayIcon fontSize="small" />
                        </ListItemIcon>
                        {isOpen && (
                            <Box>
                                <Typography
                                    variant="body1"
                                    noWrap
                                    sx={{
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        color: 'text.primary',
                                    }}
                                >
                                    {t('sidebar.allTracks')}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.75rem',
                                        display: 'block',
                                    }}
                                >
                                    {t('sidebar.playlist')}
                                </Typography>
                            </Box>
                        )}
                    </ListItemButton>

                    {isOpen && <Divider sx={{ my: 1.5 }} />}

                    {/* Исполнители */}
                    {artistsData.slice(0, isOpen ? 15 : 5).map((artist) => {
                        const isPlayingNow = isArtistPlaying(artist);
                        const avatarUrl = artist.avatar_url
                            ? (artist.avatar_url.startsWith('http') ? artist.avatar_url : `${API_URL}${artist.avatar_url}`)
                            : `/static/artists/${artist.name.toLowerCase().replace(/ /g, '_')}.jpg`;

                        return (
                            <ListItemButton
                                key={artist.name}
                                sx={{
                                    borderRadius: 1,
                                    justifyContent: isOpen ? 'flex-start' : 'center',
                                    px: isOpen ? 0 : 0,
                                    py: 0.7,
                                    '&:hover': { 
                                        bgcolor: 'action.hover',
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
                                        minWidth: isOpen ? 38 : 34,
                                    }}
                                >
                                    <img
                                        src={avatarUrl}
                                        alt={artist.name}
                                        style={{
                                            width: isOpen ? '55px' : '50px',
                                            height: isOpen ? '55px' : '50px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                        }}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=621d3e&color=fff&size=36&font-size=0.5`;
                                        }}
                                    />
                                    {isOpen && hoveredArtist === artist.name && (
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
                                                <PauseIcon sx={{ fontSize: isOpen ? 28 : 26 }} />
                                            ) : (
                                                <PlayArrowIcon sx={{ fontSize: isOpen ? 28 : 26 }} />
                                            )}
                                        </IconButton>
                                    )}
                                </Box>

                                {isOpen && (
                                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                sx={{
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold',
                                                    color: isPlayingNow ? '#E91E63' : 'text.primary',
                                                }}
                                            >
                                                {artist.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: '0.80rem',
                                                    display: 'block',
                                                }}
                                            >
                                                {t('sidebar.artist')}
                                            </Typography>
                                        </Box>
                                        {isPlayingNow && isPlaying && (
                                            <VolumeUpIcon 
                                                sx={{ 
                                                    fontSize: 21, 
                                                    color: '#E91E63',
                                                    mr: 1,
                                                }} 
                                            />
                                        )}
                                    </Box>
                                )}
                            </ListItemButton>
                        );
                    })}
                    {!isOpen && artistsData.length > 5 && (
                        <ListItemButton
                            sx={{
                                borderRadius: 1,
                                justifyContent: 'center',
                                px: 0.5,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <Typography variant="caption" color="text.secondary">+{artistsData.length - 5}</Typography>
                            </ListItemIcon>
                        </ListItemButton>
                    )}
                    {isOpen && artistsData.length === 0 && (
                        <ListItemButton>
                            <ListItemText primary={t('sidebar.noArtists')} sx={{ color: 'text.secondary' }} />
                        </ListItemButton>
                    )}
                </List>
            </Box>
        </Paper>
    );
}

export default Sidebar;
