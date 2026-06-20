import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

function TrackCard({ track, onPlay, isActive, isPlaying }) {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handlePlayClick = (e) => {
        e.stopPropagation();
        onPlay(track);
    };

    const handleCoverClick = () => {
        if (track.album) {
            navigate(`/album/${encodeURIComponent(track.album)}`);
        }
    };

    const handleArtistClick = (e) => {
        e.stopPropagation();
        if (track.artist) {
            navigate(`/artist/${encodeURIComponent(track.artist)}`);
        }
    };

    const handleTitleClick = () => {
        if (track.album) {
            navigate(`/album/${encodeURIComponent(track.album)}`);
        }
    };

    return (
        <Card 
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 6,
                    cursor: 'pointer'
                },
                border: isActive ? '2px solid #1db954' : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Обложка — клик на альбом */}
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={track.cover_url ? `http://localhost:3000${track.cover_url}` : 'https://via.placeholder.com/300x200?text=No+Cover'}
                    alt={track.title}
                    sx={{ 
                        objectFit: 'cover',
                        cursor: track.album ? 'pointer' : 'default'
                    }}
                    onClick={handleCoverClick}
                />
                
                {/* Кнопка Play/Pause (только по кнопке!) */}
                {(isHovered || isActive) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isActive ? '#1db954' : 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                        }}
                    >
                        <IconButton 
                            sx={{ color: 'white' }}
                            onClick={handlePlayClick}
                        >
                            {isActive && isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                    </Box>
                )}
            </Box>
            
            <CardContent>
                {/* Название трека — клик на альбом */}
                <Typography 
                    variant="h6" 
                    noWrap 
                    sx={{ 
                        cursor: track.album ? 'pointer' : 'default',
                        '&:hover': { 
                            color: 'primary.main',
                            textDecoration: 'underline'
                        }
                    }}
                    onClick={handleTitleClick}
                    title={track.title}
                >
                    {track.title}
                </Typography>
                
                {/* Исполнитель — клик на исполнителя */}
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    noWrap
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
                
                {isActive && (
                    <Typography variant="caption" color="#1db954">
                        ● Сейчас играет
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default TrackCard;