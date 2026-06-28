import Box from '@mui/material/Box';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import AlbumIcon from '@mui/icons-material/Album';

function EmptyState({ type, size = 200, borderRadius = '50%', height = '100%' }) {
    const getIcon = () => {
        let iconSize = 60;
        if (typeof size === 'number') {
            iconSize = size > 100 ? 60 : 40;
        }
        if (typeof size === 'object' && size.xs) {
            iconSize = size.xs > 100 ? 60 : 40;
        }

        switch (type) {
            case 'artist':
                return <PersonIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
            case 'album':
                return <AlbumIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
            case 'track':
            default:
                return <MusicNoteIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
        }
    };

    // Определяем ширину
    const getWidth = () => {
        if (typeof size === 'number') return size;
        if (typeof size === 'object' && size.xs !== undefined) return '100%';
        return '100%';
    };

    // Определяем высоту
    const getHeight = () => {
        if (typeof height === 'number') return height;
        if (typeof height === 'object' && height.xs !== undefined) return '100%';
        if (typeof height === 'string') return height;
        return '100%';
    };

    return (
        <Box
            sx={{
                width: getWidth(),
                height: getHeight(),
                minHeight: 0, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                borderRadius: borderRadius,
                border: '2px dashed',
                borderColor: 'divider',
            }}
        >
            {getIcon()}
        </Box>
    );
}

export default EmptyState;
