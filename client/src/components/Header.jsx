import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { styled, alpha } from '@mui/material/styles';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '../context/ThemeContext';
import Box from '@mui/material/Box';

// Стилизованный поиск (как в Spotify)
const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: '20px',
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    maxWidth: '400px',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
    transition: 'all 0.3s ease',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    width: '100%',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '30ch',
        },
    },
}));

function Header({ onUploadClick, onSearch }) {
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearch(value);
    };

    return (
        <AppBar position="sticky" color="primary" elevation={0} sx={{ zIndex: 1100 }}>
            <Toolbar sx={{ gap: 1 }}>
                {/* Лого */}
                <IconButton edge="start" color="inherit">
                    <MusicNoteIcon />
                </IconButton>
                <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
                    Musicboard
                </Typography>
                
                {/* Поиск */}
                <Search>
                    <SearchIconWrapper>
                        <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                        placeholder="Поиск по трекам, исполнителям..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </Search>
                
                {/* Кнопки справа */}
                <Box sx={{ flexGrow: 1 }} />
                
                <IconButton color="inherit" onClick={toggleTheme}>
                    {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                
                <IconButton color="inherit" onClick={onUploadClick}>
                    <AddIcon />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}

export default Header;