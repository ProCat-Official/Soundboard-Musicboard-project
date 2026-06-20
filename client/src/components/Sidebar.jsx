import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PersonIcon from '@mui/icons-material/Person';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';

function Sidebar({ tracks, isOpen, onToggle, onGenreSelect }) {
    // Собираем исполнителей
    const artists = [...new Set(tracks.map(t => t.artist))].filter(Boolean);

    // Ширина панели
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
            {/* Заголовок с кнопкой переключения */}
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
                            Медиатека
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

            {/* Контент панели */}
            <Box sx={{ p: isOpen ? 1.5 : 0.5 }}>
                {/* Плейлисты */}
                {isOpen && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Плейлисты
                    </Typography>
                )}
                <List dense>
                    <ListItem
                        button
                        sx={{
                            borderRadius: 1,
                            justifyContent: isOpen ? 'flex-start' : 'center',
                            px: isOpen ? 1 : 0.5,
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: isOpen ? 36 : 32 }}>
                            <PlaylistPlayIcon fontSize="small" />
                        </ListItemIcon>
                        {isOpen && <ListItemText primary="Все треки" secondary={`${tracks.length}`} />}
                    </ListItem>
                </List>

                {isOpen && <Divider sx={{ my: 1.5 }} />}

                {/* Исполнители */}
                {isOpen && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Исполнители
                    </Typography>
                )}
                
                <List dense>
                    {artists.slice(0, isOpen ? 15 : 5).map((artist) => (
                        <ListItem
                            key={artist}
                            button
                            sx={{
                                borderRadius: 1,
                                justifyContent: isOpen ? 'flex-start' : 'center',
                                px: isOpen ? 1 : 0.5,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: isOpen ? 36 : 32 }}>
                                <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            {isOpen && <ListItemText primary={artist} />}
                        </ListItem>
                    ))}
                    {!isOpen && artists.length > 5 && (
                        <ListItem
                            button
                            sx={{
                                borderRadius: 1,
                                justifyContent: 'center',
                                px: 0.5,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <Typography variant="caption" color="text.secondary">+{artists.length - 5}</Typography>
                            </ListItemIcon>
                        </ListItem>
                    )}
                    {isOpen && artists.length === 0 && (
                        <ListItem>
                            <ListItemText primary="Нет исполнителей" sx={{ color: 'text.secondary' }} />
                        </ListItem>
                    )}
                </List>
            </Box>
        </Paper>
    );
}

export default Sidebar;