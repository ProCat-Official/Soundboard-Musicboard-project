import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import API_URL from '../config';

function PlayerBar({ 
    track, 
    tracks, 
    onNext, 
    onPrev, 
    isPlaying, 
    setIsPlaying,
    currentTime,     
    setCurrentTime   
}) {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('playerVolume');
        return saved !== null ? parseInt(saved) : 50;
    });
    const [muted, setMuted] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const audioRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [localTime, setLocalTime] = useState(0);

    useEffect(() => {
        let interval;
        if (isPlaying && audioRef.current) {
            interval = setInterval(() => {
                if (audioRef.current) {
                    setLocalTime(audioRef.current.currentTime);
                    setCurrentTime(audioRef.current.currentTime);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, setCurrentTime]);

    useEffect(() => {
        const savedVolume = localStorage.getItem('playerVolume');
        if (savedVolume !== null) {
            setVolume(parseInt(savedVolume));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('playerVolume', volume);
    }, [volume]);

    useEffect(() => {
        if (track && audioRef.current) {
            const audio = audioRef.current;
            audio.src = `${API_URL}/api/stream/${track.id}`;
            audio.load();
            audio.currentTime = currentTime || 0;
            
            if (isPlaying) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => setIsPlaying(false));
                }
            }
            setIsLoading(false);
        }
    }, [track]);

    useEffect(() => {
        if (audioRef.current && track && !isLoading) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => setIsPlaying(false));
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, isLoading]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume / 100;
        }
    }, [volume, muted]);

    useEffect(() => {
        if (audioRef.current && track) {
            const diff = Math.abs(audioRef.current.currentTime - currentTime);
            if (diff > 1.0) {
                audioRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime, track]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
        }
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
            if (currentTime > 0) {
                audioRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime]);

    const handleSeek = useCallback((event, newValue) => {
        if (audioRef.current) {
            audioRef.current.currentTime = newValue;
            setCurrentTime(newValue);
            setLocalTime(newValue);
        }
    }, [setCurrentTime]);

    const handleVolumeChange = useCallback((event, newValue) => {
        setVolume(newValue);
        if (newValue > 0 && muted) setMuted(false);
    }, [muted]);

    const toggleMute = useCallback(() => setMuted(!muted), [muted]);
    
    const togglePlay = useCallback(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch(() => {});
                }
            }
        }
    }, [isPlaying, setIsPlaying]);

    const handleArtistClick = useCallback(() => {
        if (track?.artist) {
            navigate(`/artist/${encodeURIComponent(track.artist)}`);
            setFullscreenOpen(false);
        }
    }, [track, navigate]);

    const handleTitleClick = useCallback(() => {
        if (track?.album) {
            navigate(`/album/${encodeURIComponent(track.album)}`);
            setFullscreenOpen(false);
        }
    }, [track, navigate]);

    const formatTime = useCallback((seconds) => {
        if (isNaN(seconds) || !seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }, []);

    const InfoRow = useMemo(() => ({ label, value }) => (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'rgba(255,255,255,0.05)',
        }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '140px' }}>
                {label}
            </Typography>
            <Typography 
                variant="body2" 
                color="text.primary"
                sx={{ 
                    textAlign: 'right',
                    wordBreak: 'break-word',
                    maxWidth: '60%',
                }}
            >
                {value}
            </Typography>
        </Box>
    ), []);

    if (!track) {
        return (
            <Paper 
                elevation={3}
                sx={{ 
                    position: 'fixed', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    p: 2, 
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    zIndex: 1000, 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography align="center" color="text.secondary">
                    {t('player.selectTrack')}
                </Typography>
            </Paper>
        );
    }

    return (
        <>
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    onNext();
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

{/* ===== ПЛЕЕР ===== */}
<Box
    sx={{
        position: "fixed",
        bottom: { xs: 60, md: 0 },
        left: { xs: 8, md: 0 },
        right: { xs: 8, md: 0 },
        height: { xs: 64, md: 'auto' },
        bgcolor: { 
            xs: theme.palette.mode === "dark" ? "#2d2d2d" : "#ffffff", 
            md: 'background.paper' 
        },
        borderRadius: { xs: "14px", md: 0 },
        display: "flex",
        alignItems: "center",
        px: { xs: 1.5, md: 2 },
        zIndex: 1200,
        boxShadow: { 
            xs: "0 8px 30px rgba(0,0,0,.25)", 
            md: '0 -2px 10px rgba(0,0,0,0.1)' 
        },
        borderTop: { xs: 'none', md: '1px solid' },
        borderColor: { xs: 'none', md: 'divider' },
        cursor: { xs: 'pointer', md: 'default' },
        transition: "all 0.2s ease",
        display: { xs: 'flex', md: 'none' },
    }}
    onClick={(e) => {
        if (window.innerWidth < 600) {
            const target = e.target;
            const isPlayButton = target.closest && target.closest('button[data-play-button]');
            const isIconButton = target.closest && target.closest('.MuiIconButton-root');
            
            if (!isPlayButton && !isIconButton) {
                setFullscreenOpen(true);
            }
        }
    }}
>
{/* Полоска прогресса */}
<Box
    sx={{
        position: "absolute",
        bottom: 0,
        left: 10,
        right: 10,
        height: "3px",
        bgcolor: "rgba(255,255,255,0.1)",
        borderRadius: "0 0 14px 14px",
        overflow: "hidden",
    }}
>
    <Box
        sx={{
            width: `${((localTime || currentTime) / (duration || 1)) * 100}%`,
            height: "100%",
            bgcolor: "primary.main",
            transition: "width 0.3s ease",
        }}
    />
</Box>

    {/* Обложка */}
    <Box
        component="img"
        src={track.cover_url || 'https://via.placeholder.com/48'}
        sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            objectFit: "cover",
            flexShrink: 0,
        }}
    />

    {/* Название и исполнитель */}
    <Box
        sx={{
            flex: 1,
            ml: 1.5,
            overflow: "hidden",
        }}
    >
        <Typography
            noWrap
            sx={{
                color: theme.palette.mode === "dark" ? "white" : "#1A0A0E",
                fontSize: 15,
                fontWeight: 600,
            }}
        >
            {track.title}
        </Typography>

        <Typography
            noWrap
            sx={{
                color: theme.palette.mode === "dark" ? "#b3b3b3" : "#666",
                fontSize: 13,
            }}
        >
            {track.artist}
        </Typography>
    </Box>

    {/* Кнопка Play/Pause */}
    <IconButton
        data-play-button="true"
        onClick={(e) => {
            e.stopPropagation();
            togglePlay();
        }}
        sx={{
            color: theme.palette.mode === "dark" ? "white" : "#1A0A0E",
            ml: 1,
            transition: "0.2s",
            "&:hover": {
                transform: "scale(1.08)",
            },
        }}
    >
        {isPlaying ? 
            <PauseIcon sx={{ fontSize: 32 }} /> : 
            <PlayArrowIcon sx={{ fontSize: 32 }} />
        }
    </IconButton>
</Box>

{/* ===== ПК ПЛЕЕР (ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ) ===== */}
<Paper 
    elevation={3}
    sx={{ 
        position: 'fixed', 
        bottom: { xs: '56px', md: 0 },
        left: { xs: '50%', md: 0 },
        right: { xs: 'auto', md: 0 },
        transform: { xs: 'translateX(-50%)', md: 'none' },
        width: { xs: '94%', md: '100%' },
        maxWidth: { xs: '480px', md: 'none' },
        borderRadius: { xs: '16px 16px 0 0', md: 0 },
        p: { xs: 0.3, md: 2 },
        bgcolor: 'background.paper',
        color: 'text.primary',
        zIndex: 1000, 
        borderTop: '1px solid',
        borderColor: 'divider',
        cursor: { xs: 'pointer', md: 'default' },
        boxShadow: { xs: '0 -4px 20px rgba(0,0,0,0.15)', md: '0 -2px 10px rgba(0,0,0,0.1)' },
        // ТОЛЬКО ДЛЯ ПК
        display: { xs: 'none', md: 'flex' },
    }}
    onClick={(e) => {
        if (window.innerWidth < 600) {
            const target = e.target;
            const isSlider = target.closest && target.closest('.MuiSlider-root');
            const isPlayButton = target.closest && target.closest('button[data-play-button]');
            const isIconButton = target.closest && target.closest('.MuiIconButton-root');
            
            if (isSlider) {
                return;
            }
            
            if (!isPlayButton && !isIconButton) {
                setFullscreenOpen(true);
            }
        }
    }}
>
    {/* Весь старый контент ПК плеера */}
    <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 0.5, md: 2 }, 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        width: '100%',
    }}>
        {/* Обложка и название для ПК */}
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 2 },
            flex: { xs: 1, md: 'none' },
            minWidth: { xs: 0, md: '120px' },
            width: { xs: '100%', md: 'auto' },
        }}>
            <Box
                component="img"
                src={track.cover_url || 'https://via.placeholder.com/50'}
                alt="cover"
                onClick={() => setFullscreenOpen(true)}
                sx={{
                    width: { xs: '36px', md: '56px' },
                    height: { xs: '36px', md: '56px' },
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    flexShrink: 0,
                }}
            />  
            <Box sx={{ 
                display: { xs: 'flex', sm: 'flex' },
                flexDirection: 'column',
                minWidth: { xs: '50px', sm: '100px' },
                maxWidth: { xs: '100px', sm: '200px' },
                flex: 1,
            }}>
                <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ 
                        cursor: { xs: 'default', md: track.album ? 'pointer' : 'default' },
                        fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.95rem' },
                        '&:hover': { 
                            color: { xs: 'text.primary', md: 'primary.main' },
                        },
                        overflow: 'hidden',
                        color: 'text.primary',
                    }}
                    onClick={(e) => {
                        if (window.innerWidth >= 600) {
                            handleTitleClick();
                        }
                    }}
                >
                    <strong>{track.title}</strong>
                </Typography>
                <Typography 
                    variant="caption" 
                    noWrap 
                    color="text.secondary"
                    sx={{ 
                        cursor: { xs: 'default', md: 'pointer' },
                        fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                        '&:hover': { 
                            color: { xs: 'text.secondary', md: 'primary.main' },
                        },
                        overflow: 'hidden',
                    }}
                    onClick={(e) => {
                        if (window.innerWidth >= 600) {
                            handleArtistClick();
                        }
                    }}
                >
                    {track.artist}
                </Typography>
            </Box>
        </Box>

        {/* Контролы для ПК */}
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, md: 1 },
            flexShrink: 0,
            order: { xs: 2, md: 0 },
        }}>
            <IconButton 
                onClick={onPrev} 
                sx={{ 
                    color: 'text.primary', 
                    padding: { xs: 0.3, md: 0.5 },
                }}
            >
                <SkipPreviousIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </IconButton>
            
            <IconButton 
                data-play-button="true"
                onClick={togglePlay} 
                sx={{ 
                    color: 'common.white',
                    bgcolor: 'primary.main',
                    width: { xs: 36, md: 40 }, 
                    height: { xs: 36, md: 40 },
                    '&:hover': { bgcolor: 'primary.dark' },
                    marginLeft: { xs: '8px', md: 0 },
                    marginRight: { xs: '4px', md: 0 },
                }}
            >
                {isPlaying ? 
                    <PauseIcon sx={{ fontSize: { xs: 20, md: 24 } }} /> : 
                    <PlayArrowIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
                }
            </IconButton>
            
            <IconButton 
                onClick={onNext} 
                sx={{ 
                    color: 'text.primary', 
                    padding: { xs: 0.3, md: 0.5 },
                }}
            >
                <SkipNextIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </IconButton>
        </Box>

        {/* Прогресс + громкость для ПК */}
        <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center', 
            gap: 1,
            flex: 1,
        }}>
            <Typography variant="caption" sx={{ minWidth: '35px', fontSize: '0.9rem' }}>
                {formatTime(localTime || currentTime)}
            </Typography>
            <Slider
                value={localTime || currentTime}
                max={duration || 1}
                onChange={handleSeek}
                sx={{ 
                    flex: 1, 
                    color: 'primary.main',
                    '& .MuiSlider-track': { color: 'primary.main' },
                    '& .MuiSlider-thumb': { 
                        color: 'primary.main',
                        width: 16,
                        height: 16,
                        '&:hover': {
                            boxShadow: '0 0 0 8px rgba(233,30,99,0.16)',
                        },
                    },
                }}
            />
            <Typography variant="caption" sx={{ minWidth: '35px', fontSize: '0.9rem' }}>
                {formatTime(duration)}
            </Typography>

            {/* Громкость */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                ml: 1,
            }}>
                <IconButton onClick={toggleMute} sx={{ color: 'text.primary', padding: 0.5 }}>
                    {muted || volume === 0 ? <VolumeOffIcon sx={{ fontSize: 24 }} /> : <VolumeUpIcon sx={{ fontSize: 24 }} />}
                </IconButton>
                <Slider
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={100}
                    sx={{ 
                        width: '80px',
                        color: 'primary.main',
                    }}
                />
                <Typography 
                    variant="caption" 
                    sx={{ 
                        minWidth: '30px',
                        fontSize: '0.7rem',
                    }}
                >
                    {muted ? 0 : volume}%
                </Typography>
            </Box>
        </Box>
    </Box>
</Paper>

            {/* ===== ПОЛНОЭКРАННЫЙ РЕЖИМ ===== */}
            <Modal
                open={fullscreenOpen}
                onClose={() => setFullscreenOpen(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.95)',
                }}
            >
                <Box sx={{ 
                    width: '100vw', 
                    height: '100vh',
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                }}>
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(180deg, #1a1a3e 0%, rgba(0,0,0,0.85) 60%, #0a0a0a 100%)'
                            : 'linear-gradient(180deg, #fce4ec 0%, rgba(255,255,255,0.9) 60%, #f5f5f5 100%)',
                        zIndex: 0,
                    }} />

                    <IconButton
                        onClick={() => setFullscreenOpen(false)}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: theme.palette.mode === 'dark' ? 'white' : '#1A0A0E',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                            '&:hover': { 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                            },
                            zIndex: 10,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Box sx={{ 
                        flex: 1,
                        overflow: 'auto',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        '&::-webkit-scrollbar': {
                            width: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.2)' 
                                : 'rgba(233,30,99,0.2)',
                            borderRadius: '2px',
                        },
                    }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            px: { xs: 2, sm: 4, md: 6 },
                            py: 4,
                        }}>
                            <img
                                src={track.cover_url || 'https://via.placeholder.com/400x400?text=No+Cover'}
                                alt={track.title}
                                style={{
                                    width: '100%',
                                    maxWidth: '240px',
                                    aspectRatio: '1/1',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    boxShadow: theme.palette.mode === 'dark'
                                        ? '0 20px 60px rgba(0,0,0,0.6)'
                                        : '0 20px 60px rgba(233,30,99,0.15)',
                                    marginBottom: '28px',
                                }}
                            />

                            <Box sx={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 300, color: theme.palette.mode === 'dark' ? 'text.secondary' : '#880E4F' }}>
                                    {track.album || t('player.single')}
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.mode === 'dark' ? 'white' : '#1A0A0E' }}>
                                    {track.title}
                                </Typography>
                                <Typography variant="h5" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : '#880E4F', cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }} onClick={handleArtistClick}>
                                    {track.artist}
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1, color: theme.palette.mode === 'dark' ? 'text.secondary' : '#880E4F' }}>
                                    {track.release_year || ''} {track.genre ? `• ${t(`genres.${track.genre}`)}` : ''} • {formatTime(duration)}
                                </Typography>
                            </Box>

                            <Box sx={{ width: '100%', maxWidth: '500px', mt: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                                    <IconButton onClick={onPrev} sx={{ color: theme.palette.mode === 'dark' ? 'white' : '#1A0A0E' }}>
                                        <SkipPreviousIcon sx={{ fontSize: 32 }} />
                                    </IconButton>
                                    <IconButton onClick={togglePlay} sx={{ color: 'white', bgcolor: 'primary.main', width: 64, height: 64, '&:hover': { bgcolor: 'primary.dark' } }}>
                                        {isPlaying ? <PauseIcon sx={{ fontSize: 36 }} /> : <PlayArrowIcon sx={{ fontSize: 36 }} />}
                                    </IconButton>
                                    <IconButton onClick={onNext} sx={{ color: theme.palette.mode === 'dark' ? 'white' : '#1A0A0E' }}>
                                        <SkipNextIcon sx={{ fontSize: 32 }} />
                                    </IconButton>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : '#880E4F', minWidth: '45px' }}>
                                        {formatTime(localTime || currentTime)}
                                    </Typography>
                                    <Slider
                                        value={localTime || currentTime}
                                        max={duration || 1}
                                        onChange={handleSeek}
                                        sx={{ flex: 1, color: 'primary.main' }}
                                    />
                                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : '#880E4F', minWidth: '45px' }}>
                                        {formatTime(duration)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ width: '100%', maxWidth: '850px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 }, py: 6, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.mode === 'dark' ? 'text.primary' : '#1A0A0E' }}>
                                    {t('player.aboutArtist')}
                                </Typography>
                                <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.05rem', color: theme.palette.mode === 'dark' ? 'text.secondary' : '#555555' }}>
                                    {track.artist} — {t('player.artistOf')} "{track.title}". {track.album && ` ${t('player.albumLabel')}: "${track.album}"`}. {track.release_year && ` ${t('player.releaseYear')}: ${track.release_year}.`}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.mode === 'dark' ? 'text.primary' : '#1A0A0E' }}>
                                    {t('player.info')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <InfoRow label={t('player.mainArtist')} value={track.artist} />
                                    {track.album && <InfoRow label={t('player.albumLabel')} value={track.album} />}
                                    {track.release_year && <InfoRow label={t('player.releaseYear')} value={track.release_year} />}
                                    {track.genre && <InfoRow label={t('player.genre')} value={t(`genres.${track.genre}`)} />}
                                    <InfoRow label={t('player.duration')} value={formatTime(duration)} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </>
    );
}

export default PlayerBar;
