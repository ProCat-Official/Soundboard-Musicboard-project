import { useState, useRef, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';

function PlayerBar({ track, tracks, onClose, onNext, onPrev }) {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(80);
    const [muted, setMuted] = useState(false);
    const audioRef = useRef(null);

    // Загружаем сохранённую громкость при первом запуске
    useEffect(() => {
        const savedVolume = localStorage.getItem('playerVolume');
        if (savedVolume !== null) {
            setVolume(parseInt(savedVolume));
        }
    }, []);

    // Сохраняем громкость при её изменении
    useEffect(() => {
        localStorage.setItem('playerVolume', volume);
    }, [volume]);

    // Когда меняется трек
    useEffect(() => {
        if (track && audioRef.current) {
            audioRef.current.load();
            audioRef.current.play();
            setPlaying(true);
        }
    }, [track]);

    // Применяем громкость
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume / 100;
        }
    }, [volume, muted]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
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
        if (newValue > 0 && muted) {
            setMuted(false);
        }
    };

    const toggleMute = () => {
        setMuted(!muted);
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (playing) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setPlaying(!playing);
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    };

    if (!track) {
        return (
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: '#1a1a1a', color: 'white', zIndex: 1000 }}>
                <Typography align="center">🎵 Выберите трек для воспроизведения</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: '#1a1a1a', color: 'white', zIndex: 1000 }}>
            <audio
                ref={audioRef}
                src={`http://localhost:3000/api/stream/${track.id}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setPlaying(false)}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Обложка */}
                <img 
                    src={track.cover_url ? `http://localhost:3000${track.cover_url}` : 'https://via.placeholder.com/50'} 
                    alt="cover"
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                />
                
                {/* Информация о треке */}
                <Box sx={{ minWidth: '150px' }}>
                    <Typography variant="body2" noWrap><strong>{track.title}</strong></Typography>
                    <Typography variant="caption" noWrap>{track.artist}</Typography>
                </Box>
                
                <IconButton onClick={onPrev} sx={{ color: 'white' }} disabled={!tracks?.length}>
                <SkipPreviousIcon />
                </IconButton>

                {/* Кнопка Play/Pause */}
                <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                    {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                <IconButton onClick={onNext} sx={{ color: 'white' }} disabled={!tracks?.length}>
                <SkipNextIcon />
                </IconButton>
                
                {/* Полоса прогресса */}
                <Typography variant="body2">{formatTime(currentTime)}</Typography>
                <Slider
                    value={currentTime}
                    max={duration}
                    onChange={handleSeek}
                    sx={{ width: '200px', color: '#ffffff' }}
                />
                <Typography variant="body2">{formatTime(duration)}</Typography>
                
                {/* РЕГУЛИРОВКА ГРОМКОСТИ */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px' }}>
                    <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                        {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>
                    <Slider
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        min={0}
                        max={100}
                        step={1}
                        sx={{ width: '100px', color: '#ffffff' }}
                    />
                    <Typography variant="caption" sx={{ minWidth: '35px' }}>
                        {muted ? 0 : volume}%
                    </Typography>
                </Box>
                
                {/* Кнопка закрытия */}
                <IconButton onClick={onClose} sx={{ color: 'white', ml: 'auto' }}>
                    <CloseIcon />
                </IconButton>
            </Box>
        </Paper>
    );
}

export default PlayerBar;