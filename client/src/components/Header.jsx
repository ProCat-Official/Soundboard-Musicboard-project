import { useState } from 'react';
import { useNavigate }from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useTheme } from '../context/ThemeContext';
import SearchBar from './Searchbar';

function Header({ onUploadClick }) {
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    
    const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
    const open = Boolean(languageAnchorEl);

    const handleLanguageOpen = (event) => {
        setLanguageAnchorEl(event.currentTarget);
    };

    const handleLanguageClose = () => {
        setLanguageAnchorEl(null);
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
        handleLanguageClose();
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    const logoSrc = theme === 'dark' ? '/logos/logoD.png' : '/logos/logoM.png';

    const currentLang = i18n.language || 'ua';
    const langDisplay = currentLang === 'ua' ? 'UA' : currentLang === 'en' ? 'EN' : 'RU';

    return (
        <AppBar 
            position="fixed"  // ← sticky → fixed
            color="primary" 
            elevation={0} 
            sx={{ 
                zIndex: 1100,
                top: 0,
                left: 0,
                right: 0,
                bgcolor: { 
                    xs: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    md: theme === 'dark' ? '#202020' : '#ffffff'
                },
                backdropFilter: { xs: 'blur(0.1px)', md: 'none' },
                borderBottom: { xs: '1px solid', md: 'none' },
                borderColor: { 
                    xs: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
                    md: 'transparent' 
                },
            }}
        >
            <Toolbar sx={{ gap: 1, justifyContent: 'space-between' }}>
                {/* Лого */}
                <Box
                    onClick={handleLogoClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.1,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': { opacity: 0.8 },
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={logoSrc}
                        alt="Musicboard"
                        style={{
                            height: '40px',
                            width: '60px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                        }}
                        onError={(e) => {
                            console.error('Логотип не загрузился');
                            e.target.style.display = 'none';
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            display: { xs: 'block', sm: 'block' },
                            fontWeight: 'bold',
                            color: 'inherit',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            mt: 0.5,
                        }}
                    >
                        Musicboard
                    </Typography>
                </Box>

                {/* Поиск по центру - скрываем на телефонах */}
                <Box sx={{ 
                    flex: 1, 
                    display: { xs: 'none', md: 'flex' }, 
                    justifyContent: 'center', 
                    mx: 2 
                }}>
                    <SearchBar key={i18n.language} onSearch={() => {}} />
                </Box>

                {/* Кнопки справа */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <Button
                        variant="text"
                        onClick={handleLanguageOpen}
                        endIcon={<ArrowDropDownIcon />}
                        size="small"
                        sx={{
                            textTransform: 'none',
                            color: 'text.primary',
                            fontWeight: 'bold',
                            minWidth: '40px',
                            fontSize: '1.1rem',
                        }}
                    >
                        {langDisplay}
                    </Button>
                    <Menu
                        anchorEl={languageAnchorEl}
                        open={open}
                        onClose={handleLanguageClose}
                    >
                        <MenuItem 
                            onClick={() => changeLanguage('ru')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: currentLang === 'ru' ? 'bold' : 400,
                                        color: currentLang === 'ru' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    RU
                                </Typography>
                                {currentLang === 'ru' && (
                                    <Typography component="span" sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                        
                        <MenuItem 
                            onClick={() => changeLanguage('ua')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: currentLang === 'ua' ? 'bold' : 400,
                                        color: currentLang === 'ua' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    UA
                                </Typography>
                                {currentLang === 'ua' && (
                                    <Typography component="span" sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                        
                        <MenuItem 
                            onClick={() => changeLanguage('en')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography 
                                    sx={{ 
                                        fontWeight: currentLang === 'en' ? 'bold' : 400,
                                        color: currentLang === 'en' ? '#E91E63' : 'text.primary',
                                    }}
                                >
                                    EN
                                </Typography>
                                {currentLang === 'en' && (
                                    <Typography component="span" sx={{ color: '#E91E63', fontSize: '1.2rem' }}>✓</Typography>
                                )}
                            </Box>
                        </MenuItem>
                    </Menu>

                    <IconButton color="inherit" onClick={toggleTheme}>
                        {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>

                    <IconButton color="inherit" onClick={onUploadClick}>
                        <AddIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;