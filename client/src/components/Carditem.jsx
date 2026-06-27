import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function CardItem({
    id,
    title,
    subtitle,
    image,
    type,
    isPlaying,
    isActive,
    onPlay,
    onNavigate,
    onHover,
    isHovered = false,
    width = 200,
    imageHeight = 200,
    borderRadius = 3,
    imageVariant = 'cover',
    showPlayButton = true,
    showStatus = false,
    canDelete = false,
    onDelete = null,
    deleteType = 'track',
    deleteName = '',
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [menuAnchor, setMenuAnchor] = useState(null);

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        handleMenuClose();
        if (onDelete) {
            onDelete();
        }
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        onPlay?.();
    };

    const handleCardClick = () => {
        if (onNavigate) {
            onNavigate();
        }
    };

    const handleHover = (hover) => {
        if (onHover) {
            onHover(hover);
        }
    };

    const getImageStyle = () => {
        if (imageVariant === 'circle') {
            return {
                borderRadius: '50%',
                objectFit: 'cover',
                width: '100%',
                height: imageHeight,
            };
        }
        return {
            objectFit: 'cover',
            width: '100%',
            height: imageHeight,
        };
    };

    const getPlaceholder = () => {
        if (type === 'artist') {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=621d3e&color=fff&size=200`;
        }
        if (type === 'album') {
            return 'https://via.placeholder.com/200x200?text=No+Album+Art';
        }
        return 'https://via.placeholder.com/200x200?text=No+Track+Art';
    };

    const getPlaceholderIcon = () => {
        if (type === 'artist') {
            return null;
        }
        if (type === 'album') {
            return null;
        }
        return <MusicNoteIcon sx={{ fontSize: 48, color: 'text.disabled' }} />;
    };

    const getDeleteLabel = () => {
        switch (deleteType) {
            case 'track': return t('delete.track');
            case 'album': return t('delete.album');
            case 'artist': return t('delete.artist');
            default: return t('delete.item');
        }
    };

    const handleTitleClick = (e) => {
        e.stopPropagation();
        if (onNavigate) {
            onNavigate();
        }
    };

    const handleArtistClick = (e) => {
        e.stopPropagation();
        if ((type === 'track' || type === 'album') && subtitle) {
            const artist = subtitle.split(' • ')[0];
            if (artist) {
                navigate(`/artist/${encodeURIComponent(artist)}`);
            }
        }
    };

    const getSubtitleParts = () => {
        if (!subtitle) return { artist: '', rest: '' };
        const parts = subtitle.split(' • ');
        return { artist: parts[0] || '', rest: parts.slice(1).join(' • ') };
    };

    const { artist, rest } = getSubtitleParts();

    return (
        <Card
            sx={{
                width: width,
                borderRadius: borderRadius,
                cursor: 'pointer',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border 0.25s ease',
                bgcolor: 'background.paper',
                position: 'relative',
                overflow: 'hidden',
                border: isActive ? '2px solid #E91E63' : 'none',
                '&:hover': {
                    transform: 'scale(1.04)',
                    boxShadow: 8,
                },
            }}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
            onClick={handleCardClick}
        >
            <Box sx={{ position: 'relative' }}>
                {image ? (
                    <CardMedia
                        component="img"
                        height={imageHeight}
                        image={image}
                        alt={title}
                        sx={{
                            ...getImageStyle(),
                            backgroundColor: 'action.hover',
                        }}
                        onError={(e) => {
                            e.target.src = getPlaceholder();
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            height: imageHeight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'action.hover',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        {getPlaceholderIcon()}
                        <Typography variant="caption" color="text.disabled">
                            {type === 'track' && 'No Cover'}
                            {type === 'album' && 'No Cover'}
                            {type === 'artist' && 'No Avatar'}
                        </Typography>
                    </Box>
                )}
                
                {showPlayButton && isHovered && (
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
                            width: 44,
                            height: 44,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                                transform: 'scale(1.08)',
                            },
                        }}
                        onClick={handlePlayClick}
                    >
                        {isActive && isPlaying ? (
                            <PauseIcon sx={{ color: 'white', fontSize: 24 }} />
                        ) : (
                            <PlayArrowIcon sx={{ color: 'white', fontSize: 24 }} />
                        )}
                    </Box>
                )}

                {canDelete && onDelete && (
                    <IconButton
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            width: 32,
                            height: 32,
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)',
                            },
                            zIndex: 5,
                        }}
                        onClick={handleMenuOpen}
                    >
                        <MoreVertIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                )}

                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MenuItem 
                        onClick={handleDeleteClick}
                        sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light', color: 'error.dark' }
                        }}
                    >
                        {t('common.delete')} {getDeleteLabel()}
                    </MenuItem>
                </Menu>

                {showStatus && isActive && (
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            color: '#E91E63',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.7rem',
                        }}
                    >
                        {isPlaying ? '● Сейчас играет' : '● На паузе'}
                    </Typography>
                )}
            </Box>

            <CardContent
                sx={{
                    p: 2,
                    pb: '12px !important',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                }}
            >
                {/* НАЗВАНИЕ */}
                <Typography
                    variant="body1"
                    noWrap
                    sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        lineHeight: 1.3,
                        color: isActive ? '#E91E63' : 'text.primary',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                            color: '#E91E63',
                            textDecoration: 'underline',
                        },
                    }}
                    onClick={handleTitleClick}
                >
                    {title}
                </Typography>

                {/* ИСПОЛНИТЕЛЬ */}
                {artist && (type === 'track' || type === 'album') && (
                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            fontSize: '0.8rem',
                            color: isActive ? '#E91E63' : 'text.secondary',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease, text-decoration 0.2s ease',
                            '&:hover': {
                                color: '#E91E63',
                                textDecoration: 'underline',
                            },
                        }}
                        onClick={handleArtistClick}
                    >
                        {artist}
                    </Typography>
                )}

                {/* ДЛЯ ИСПОЛНИТЕЛЯ */}
                {type === 'artist' && (
                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            fontSize: '0.8rem',
                            color: isActive ? '#E91E63' : 'text.secondary',
                            opacity: 0.8,
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {/* ТРЕК/АЛЬБОМ • ГОД */}
                {(type === 'track' || type === 'album') && rest && (
                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            fontSize: '0.7rem',
                            color: isActive ? '#E91E63' : 'text.secondary',
                            opacity: 0.5,
                        }}
                    >
                        {rest}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default CardItem;