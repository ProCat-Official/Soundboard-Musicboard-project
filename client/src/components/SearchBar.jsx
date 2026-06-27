import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import AlbumIcon from '@mui/icons-material/Album';   
import MusicNoteIcon from '@mui/icons-material/MusicNote'; 
import axios from 'axios';

function SearchBar({ onSearch }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [hoveredHistoryItem, setHoveredHistoryItem] = useState(null);
    const searchRef = useRef(null);

    // Загрузка истории
    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHistory(parsed);
            } catch (e) {
                console.error('Ошибка загрузки истории:', e);
            }
        }
    }, []);

    const saveToHistory = (term) => {
        if (!term.trim()) return;
        const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    const removeFromHistory = (term, event) => {
        event.stopPropagation();
        const newHistory = history.filter(h => h !== term);
        setHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    // Закрытие при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Поиск
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (query.trim().length === 0) {
                setResults([]);
                return;
            }

            try {
                const response = await axios.get(`http://localhost:3000/api/tracks/search?query=${encodeURIComponent(query.trim())}`);
                const tracksData = response.data;

                const combinedResults = [];

                // Исполнители
                const artistNames = [...new Set(tracksData.map(t => t.artist).filter(Boolean))];
                for (const name of artistNames) {
                    let avatarUrl = '';
                    try {
                        const artistRes = await axios.get(`http://localhost:3000/api/artist/${encodeURIComponent(name)}`);
                        avatarUrl = artistRes.data.avatar_url || '';
                    } catch (e) {
                        avatarUrl = `/static/artists/${name.toLowerCase().replace(/ /g, '_')}.jpg`;
                    }
                    combinedResults.push({
                        type: 'artist',
                        name: name,
                        avatar: avatarUrl,
                    });
                }

                // Альбомы
                const albumsMap = {};
                tracksData.forEach(t => {
                    if (t.album && !albumsMap[t.album]) {
                        let cover = t.cover_url || '';
                        if (!cover) {
                            const trackWithCover = tracksData.find(t2 => t2.album === t.album && t2.cover_url);
                            if (trackWithCover) cover = trackWithCover.cover_url;
                        }
                        albumsMap[t.album] = {
                            name: t.album,
                            cover: cover,
                            artist: t.artist,
                        };
                    }
                });
                Object.values(albumsMap).forEach(album => {
                    combinedResults.push({
                        type: 'album',
                        name: album.name,
                        cover: album.cover,
                        artist: album.artist,
                    });
                });

                // Треки
                tracksData.slice(0, 5).forEach(track => {
                    combinedResults.push({
                        type: 'track',
                        name: track.title,
                        cover: track.cover_url || '',
                        id: track.id,
                        album: track.album,
                        artist: track.artist,
                        duration: track.duration,
                    });
                });

                setResults(combinedResults);
                setIsOpen(true);
            } catch (error) {
                console.error('Ошибка поиска:', error);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [query]);

    const handleSearch = (term) => {
        setQuery(term);
        saveToHistory(term);
        onSearch(term);
        setIsOpen(false);
    };

    const handleItemClick = (item) => {
        saveToHistory(query);
        setIsOpen(false);
        
        if (item.type === 'artist') {
            navigate(`/artist/${encodeURIComponent(item.name)}`);
        } else if (item.type === 'album') {
            navigate(`/album/${encodeURIComponent(item.name)}`);
        } else if (item.type === 'track') {
            if (item.album) {
                navigate(`/album/${encodeURIComponent(item.album)}`);
            }
        }
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const showDropdown = isOpen && (query.trim().length > 0 || history.length > 0);

    const getTypeLabel = (type) => {
        switch (type) {
            case 'artist': return t('search.artist');
            case 'album': return t('search.album');
            case 'track': return t('search.track');
            default: return '';
        }
    };

    const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    let truncated = text.slice(0, maxLength);
    let lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) truncated = truncated.slice(0, lastSpace);
    return truncated + '...';
};

    return (
        <Box 
            key={i18n.language}
            ref={searchRef} 
            sx={{ position: 'relative', width: '100%', maxWidth: '400px' }}
        >
            <TextField
                fullWidth
                placeholder={t('common.search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                    setIsOpen(true);
                    if (query.trim().length === 0) {
                        setResults([]);
                    }
                }}
                size="small"
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '20px',
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                        '& fieldset': { borderColor: 'divider' },
                    },
                }}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: query && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setQuery('')}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {showDropdown && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        maxHeight: '400px',
                        overflow: 'auto',
                        zIndex: 2000,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                    }}
                >
                    {query.trim().length === 0 ? (
                        // ===== ИСТОРИЯ =====
                        <>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                    {t('search.recentQueries')}
                                </Typography>
                                {history.length > 0 && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ cursor: 'pointer', color: 'primary.main' }} 
                                        onClick={clearHistory}
                                    >
                                        {t('search.clearAll')}
                                    </Typography>
                                )}
                            </Box>
                            <List dense>
                                {history.length === 0 ? (
                                    <ListItemButton>
                                        <ListItemText primary={t('search.historyEmpty')} sx={{ color: 'text.secondary' }} />
                                    </ListItemButton>
                                ) : (
                                    history.map((item, index) => (
                                        <ListItemButton
                                            key={index}
                                            onClick={() => handleSearch(item)}
                                            onMouseEnter={() => setHoveredHistoryItem(index)}
                                            onMouseLeave={() => setHoveredHistoryItem(null)}
                                            sx={{ pr: 4 }}
                                        >
                                            <ListItemIcon>
                                                <HistoryIcon fontSize="small" color="action" />
                                            </ListItemIcon>
                                            <ListItemText primary={item} />
                                            {hoveredHistoryItem === index && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => removeFromHistory(item, e)}
                                                    sx={{ position: 'absolute', right: 8 }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </ListItemButton>
                                    ))
                                )}
                            </List>
                        </>
                    ) : (
                        // ===== РЕЗУЛЬТАТЫ =====
                        <List dense>
                            {results.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('common.noResults')}
                                    </Typography>
                                </Box>
                            ) : (
                                results.map((item, index) => {
                                    let iconContent = null;
                                    if (item.type === 'artist') {
                                        iconContent = (
                                            <img
                                                src={item.avatar ? `http://localhost:3000${item.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=621d3e&color=fff&size=32`}
                                                alt={item.name}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=621d3e&color=fff&size=32`;
                                                }}
                                            />
                                        );
                                    } else if (item.type === 'album' || item.type === 'track') {
                                        const coverUrl = item.cover || item.cover_url;
                                        if (coverUrl) {
                                            iconContent = (
                                                <img
                                                    src={`http://localhost:3000${coverUrl}`}
                                                    alt={item.name}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '4px',
                                                        objectFit: 'cover',
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            );
                                        } else {
                                            iconContent = item.type === 'album' ? (
                                                <AlbumIcon fontSize="small" color="action" />
                                            ) : (
                                                <MusicNoteIcon fontSize="small" color="action" />
                                            );
                                        }
                                    }

                                    const typeLabel = getTypeLabel(item.type);
                                    const subtitle = item.artist 
                                        ? `${typeLabel} • ${item.artist}` 
                                        : typeLabel;

return (
    <ListItemButton 
        key={index} 
        onClick={() => handleItemClick(item)}
        sx={{ zIndex: 2100 }}
    >
        <ListItemIcon>{iconContent}</ListItemIcon>
        <ListItemText
primary={
    <Typography
        variant="body1"
        sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '280px',
            fontSize: '0.95rem',
        }}
    >
        {truncateText(item.name, 40)}
    </Typography>
}
            secondary={
                <Typography
                    variant="body2"
                    sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '280px',
                    }}
                >
                    {subtitle}
                </Typography>
            }
        />
    </ListItemButton>
);
                                })
                            )}
                        </List>
                    )}
                </Paper>
            )}
        </Box>
    );
}

export default SearchBar;
