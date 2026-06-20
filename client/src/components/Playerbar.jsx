import { useState, useRef, useEffect } from 'react';
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
    const theme = useTheme();
    const navigate = useNavigate();
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(80);
    const [muted, setMuted] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const audioRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    // Загружаем громкость
    useEffect(() => {
        const savedVolume = localStorage.getItem('playerVolume');
        if (savedVolume !== null) {
            setVolume(parseInt(savedVolume));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('playerVolume', volume);
    }, [volume]);

    // Когда меняется трек
    useEffect(() => {
        if (track && audioRef.current) {
            const audio = audioRef.current;
            audio.src = `http://localhost:3000/api/stream/${track.id}`;
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

    // Синхронизация паузы/воспроизведения
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

    // Громкость
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume / 100;
        }
    }, [volume, muted]);

    // Обработчики
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
            if (currentTime > 0) {
                audioRef.current.currentTime = currentTime;
            }
        }
    };

    const handleSeek = (event, newValue) => {
        if (audioRef.current) {
            audioRef.current.currentTime = newValue;
            setCurrentTime(newValue);
        }
    };

    const handleVolumeChange = (event, newValue) => {
        setVolume(newValue);
        if (newValue > 0 && muted) setMuted(false);
    };

    const toggleMute = () => setMuted(!muted);
    
    const togglePlay = () => {
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
    };

    const handleArtistClick = () => {
        if (track?.artist) {
            navigate(`/artist/${encodeURIComponent(track.artist)}`);
        }
    };

    const handleTitleClick = () => {
        if (track?.album) {
            navigate(`/album/${encodeURIComponent(track.album)}`);
        }
    };

    const handleCoverClick = () => {
        setFullscreenOpen(true);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    };

    // Компонент для отображения строки информации (ТОЛЬКО ОДИН РАЗ!)
    const InfoRow = ({ label, value }) => (
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
    );

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
                    Выберите трек для воспроизведения
                </Typography>
            </Paper>
        );
    }

    return (
        <>
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <img 
                        src={track.cover_url ? `http://localhost:3000${track.cover_url}` : 'https://via.placeholder.com/50'} 
                        alt="cover"
                        style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: 'cover', 
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer'
                        }}
                        onClick={handleCoverClick}
                    />
                    
                    <Box sx={{ minWidth: '120px' }}>
                        <Typography 
                            variant="body2" 
                            noWrap
                            sx={{ 
                                cursor: track.album ? 'pointer' : 'default',
                                '&:hover': { 
                                    color: 'primary.main',
                                    textDecoration: 'underline'
                                }
                            }}
                            onClick={handleTitleClick}
                        >
                            <strong>{track.title}</strong>
                        </Typography>
                        <Typography 
                            variant="caption" 
                            noWrap 
                            color="text.secondary"
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': { 
                                    color: 'primary.main',
                                    textDecoration: 'underline'
                                }
                            }}
                            onClick={handleArtistClick}
                        >
                            {track.artist}
                        </Typography>
                    </Box>
                    
                    <IconButton onClick={onPrev} sx={{ color: 'text.primary' }}>
                        <SkipPreviousIcon />
                    </IconButton>
                    <IconButton 
                        onClick={togglePlay} 
                        sx={{ 
                            color: 'common.white',
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                        }}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <IconButton onClick={onNext} sx={{ color: 'text.primary' }}>
                        <SkipNextIcon />
                    </IconButton>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: '150px' }}>
                        <Typography variant="caption">{formatTime(currentTime)}</Typography>
                        <Slider
                            value={currentTime}
                            max={duration || 1}
                            onChange={handleSeek}
                            sx={{ 
                                flex: 1, 
                                color: 'primary.main',
                                '& .MuiSlider-track': { color: 'primary.main' },
                                '& .MuiSlider-thumb': { color: 'primary.main' },
                            }}
                        />
                        <Typography variant="caption">{formatTime(duration)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px' }}>
                        <IconButton onClick={toggleMute} sx={{ color: 'text.primary' }}>
                            {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                        <Slider
                            value={muted ? 0 : volume}
                            onChange={handleVolumeChange}
                            min={0}
                            max={100}
                            sx={{ 
                                width: '80px',
                                color: 'primary.main',
                                '& .MuiSlider-track': { color: 'primary.main' },
                                '& .MuiSlider-thumb': { color: 'primary.main' },
                            }}
                        />
                        <Typography variant="caption" sx={{ minWidth: '30px' }}>
                            {muted ? 0 : volume}%
                        </Typography>
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
        bgcolor: 'rgba(0,0,0,0.92)',
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
        {/* Градиентный фон */}
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, #1a1a3e 0%, rgba(0,0,0,0.85) 60%, #0a0a0a 100%)',
            zIndex: 0,
        }} />

        {/* Кнопка закрытия */}
        <IconButton
            onClick={() => setFullscreenOpen(false)}
            sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 10,
            }}
        >
            <CloseIcon />
        </IconButton>

        {/* ===== СКРОЛЛ-КОНТЕЙНЕР ===== */}
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
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
            },
        }}>
            {/* ===== ВЕРХНЯЯ ЧАСТЬ — СТРОГО ПО ЦЕНТРУ ЭКРАНА ===== */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',  // <-- ВАЖНО: занимает весь экран
                px: { xs: 2, sm: 4, md: 6 },
                py: 4,
            }}>
                {/* Обложка */}
                <img
                    src={track.cover_url ? `http://localhost:3000${track.cover_url}` : 'https://via.placeholder.com/400x400?text=No+Cover'}
                    alt={track.title}
                    style={{
                        width: '100%',
                        maxWidth: '240px',
                        aspectRatio: '1/1',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        marginBottom: '28px',
                    }}
                />

                {/* Информация */}
                <Box sx={{ 
                    textAlign: 'center',
                    color: 'white',
                    width: '100%',
                    maxWidth: '600px',
                }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 300 }}>
                        {track.album || 'Сингл'}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {track.title}
                    </Typography>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            color: 'text.secondary',
                            cursor: 'pointer',
                            '&:hover': { 
                                color: 'primary.main',
                                textDecoration: 'underline'
                            }
                        }}
                        onClick={handleArtistClick}
                    >
                        {track.artist}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        {track.release_year || ''} • {track.genre || ''} • {formatTime(duration)}
                    </Typography>
                </Box>

                {/* Плеер */}
                <Box sx={{
                    width: '100%',
                    maxWidth: '500px',
                    mt: 4,
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 2,
                        mb: 1,
                    }}>
                        <IconButton onClick={onPrev} sx={{ color: 'white' }}>
                            <SkipPreviousIcon sx={{ fontSize: 32 }} />
                        </IconButton>
                        <IconButton 
                            onClick={togglePlay} 
                            sx={{ 
                                color: 'white',
                                bgcolor: 'primary.main',
                                width: 64,
                                height: 64,
                                '&:hover': { bgcolor: 'primary.dark' },
                            }}
                        >
                            {isPlaying ? <PauseIcon sx={{ fontSize: 36 }} /> : <PlayArrowIcon sx={{ fontSize: 36 }} />}
                        </IconButton>
                        <IconButton onClick={onNext} sx={{ color: 'white' }}>
                            <SkipNextIcon sx={{ fontSize: 32 }} />
                        </IconButton>
                    </Box>

                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        width: '100%',
                    }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '45px' }}>
                            {formatTime(currentTime)}
                        </Typography>
                        <Slider
                            value={currentTime}
                            max={duration || 1}
                            onChange={handleSeek}
                            sx={{ 
                                flex: 1, 
                                color: 'primary.main',
                                '& .MuiSlider-track': { color: 'primary.main' },
                                '& .MuiSlider-thumb': { color: 'primary.main' },
                            }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '45px' }}>
                            {formatTime(duration)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ===== ИНФОРМАЦИЯ (только при скролле) ===== */}
            <Box sx={{ 
                width: '100%', 
                maxWidth: '850px',
                mx: 'auto',
                px: { xs: 2, sm: 4, md: 6 },
                py: 6,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 4, md: 6 },
            }}>
                <Box>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                        Об исполнителе
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: '1.05rem' }}>
                        {track.artist} — исполнитель трека "{track.title}". 
                        {track.album && ` Альбом: "${track.album}"`}.
                        {track.release_year && ` Год выпуска: ${track.release_year}.`}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                        Сведения
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <InfoRow label="Основной Исполнитель" value={track.artist} />
                        {track.album && <InfoRow label="Альбом" value={track.album} />}
                        {track.release_year && <InfoRow label="Год выпуска" value={track.release_year} />}
                        {track.genre && <InfoRow label="Жанр" value={track.genre} />}
                        <InfoRow label="Длительность" value={formatTime(duration)} />
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