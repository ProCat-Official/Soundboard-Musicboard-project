// components/CardItem.jsx
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
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import AlbumIcon from '@mui/icons-material/Album';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';

function CardItem({
    id,
    title,
    subtitle,
    image,
    fallbackIcon = 'music', // 'music' | 'artist' | 'album'
    type = 'track', // 'track' | 'artist' | 'album'
    isPlaying = false,
    isActive = false,
    isHovered = false,
    onPlay,
    onNavigate,
    onHover,
    width = '100%',
    imageHeight = 150,
    borderRadius = 2,
    imageVariant = 'square', // 'square' | 'circle'
    showPlayButton = false,
    canDelete = false,
    onDelete,
    deleteType,
    deleteName,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMouseEnter = () => {
        setHover(true);
        if (onHover) onHover(true);
    };

    const handleMouseLeave = () => {
        setHover(false);
        if (onHover) onHover(false);
    };

    const handleClick = () => {
        if (onNavigate) onNavigate();
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (onPlay) onPlay();
    };

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        handleMenuClose();
        if (onDelete) onDelete();
    };

    // ✅ Получаем иконку в зависимости от типа
    const getFallbackIcon = () => {
        switch (fallbackIcon) {
            case 'album':
                return <AlbumIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
            case 'artist':
                return <PersonIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
            case 'music':
            default:
                return <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
        }
    };

    const hasImage = image;

    return (
        <Card
            sx={{
                width: width,
                borderRadius: borderRadius,
                cursor: onNavigate ? 'pointer' : 'default',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isHovered || hover
                    ? 'rgba(255,255,255,0.06)'
                    : 'transparent !important',
                border: isActive ? '2px solid #E91E63' : 'none',
                '&:hover': {
                    transform: 'scale(1.04)',
                    boxShadow: 8,
                },
            }}
            elevation={0}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <Box sx={{ position: 'relative' }}>
                {hasImage ? (
                    <Box
                        component="img"
                        src={image}
                        alt={title}
                        sx={{
                            width: '100%',
                            height: imageHeight,
                            objectFit: 'cover',
                            borderRadius: imageVariant === 'circle' ? '50%' : 0,
                            backgroundColor: 'action.hover',
                        }}
                    />
                ) : (
                    // ✅ Показываем иконку-заглушку
                    <Box
                        sx={{
                            width: '100%',
                            height: imageHeight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'action.hover',
                            borderRadius: imageVariant === 'circle' ? '50%' : 0,
                        }}
                    >
                        {getFallbackIcon()}
                    </Box>
                )}

                {/* Кнопка Play (для треков) */}
                {showPlayButton && onPlay && (isHovered || hover || isActive) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isActive ? '#E91E63' : 'rgba(0,0,0,0.7)',
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

                {/* ✅ Кнопка меню (для удаления) */}
                {canDelete && (isHovered || hover) && (
                    <IconButton
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)',
                            },
                        }}
                        onClick={handleMenuOpen}
                    >
                        <MoreVertIcon />
                    </IconButton>
                )}
            </Box>

            <CardContent
                sx={{
                    p: 1.5,
                    pb: '12px !important',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                }}
            >
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
                        cursor: onNavigate ? 'pointer' : 'default',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                            color: onNavigate ? 'primary.main' : 'text.primary',
                            textDecoration: onNavigate ? 'underline' : 'none',
                        },
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigate) onNavigate();
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        display: 'block',
                        lineHeight: 1.3,
                        opacity: 0.8,
                        cursor: 'default',
                    }}
                >
                    {subtitle}
                </Typography>

                {isActive && isPlaying && (
                    <Typography variant="caption" color="#E91E63" sx={{ fontSize: '0.7rem' }}>
                        ● {t('homepage.playing')}
                    </Typography>
                )}
            </CardContent>

            {/* ✅ Меню удаления */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>
                        {t('delete.delete')} {deleteType ? t(`delete.${deleteType}`) : ''}
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Card>
    );
}

export default CardItem;