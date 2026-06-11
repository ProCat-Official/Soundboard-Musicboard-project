import { useState } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

function TrackCard({ track, onPlay }) {
    const [isHovered, setIsHovered] = useState(false);

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
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Обложка с кнопкой поверх */}
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={track.cover_url ? `http://localhost:3000${track.cover_url}` : 'https://via.placeholder.com/300x200?text=No+Cover'}
                    alt={track.title}
                    sx={{ objectFit: 'cover' }}
                />
                
                {/* Полупрозрачная кнопка Play при наведении */}
                {isHovered && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            transition: 'all 0.3s'
                        }}
                    >
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlay(track);
                            }}
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                color: '#000000',
                                width: 60,
                                height: 60,
                                '&:hover': {
                                    bgcolor: 'white',
                                    transform: 'scale(1.05)',
                                }
                            }}
                        >
                            <PlayArrowIcon sx={{ fontSize: 40 }} />
                        </IconButton>
                    </Box>
                )}
            </Box>
            
            {/* Контент */}
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" noWrap title={track.title}>
                    {track.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {track.artist}
                </Typography>
                {track.album && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {track.album} • {track.release_year || ''}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default TrackCard;