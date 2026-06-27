import { createTheme } from '@mui/material/styles';

// Розово-фиолетовая палитра для акцентов
const accentColor = '#E91E63';      // Розовый
const accentLight = '#F48FB1';      // Светло-розовый
const accentDark = '#AD1457';       // Тёмно-розовый
const accentPurple = '#9C27B0';     // Фиолетовый

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: accentColor,
            light: accentLight,
            dark: accentDark,
        },
        secondary: {
            main: accentPurple,
            light: '#CE93D8',
            dark: '#6A1B9A',
        },
        background: {
            default: '#121212',      // Тёмно-серый (как Spotify)
            paper: '#1E1E1E',        // Чуть светлее
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B3B3B3',
        },
        divider: 'rgba(255,255,255,0.1)',
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#181818',
                    '&:hover': {
                        backgroundColor: '#282828',
                        boxShadow: '0 8px 24px rgba(233, 30, 99, 0.2)',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#121212',
                    borderBottom: '1px solid rgba(233, 30, 99, 0.15)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                contained: {
                    backgroundColor: accentColor,
                    '&:hover': {
                        backgroundColor: accentDark,
                    },
                },
                outlined: {
                    borderColor: accentColor,
                    color: accentColor,
                    '&:hover': {
                        backgroundColor: 'rgba(233, 30, 99, 0.1)',
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(233, 30, 99, 0.15)',
                    },
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: accentColor,
                },
                track: {
                    color: accentColor,
                },
                thumb: {
                    color: accentColor,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderColor: accentColor,
                    color: accentColor,
                },
            },
        },
    },
});

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: accentColor,
            light: accentLight,
            dark: accentDark,
        },
        secondary: {
            main: accentPurple,
            light: '#CE93D8',
            dark: '#6A1B9A',
        },
        background: {
            default: '#F5F5F5',      // Светло-серый
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1A1A1A',
            secondary: '#666666',
        },
        divider: 'rgba(0,0,0,0.08)',
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: '#F8F8F8',
                        boxShadow: '0 8px 24px rgba(233, 30, 99, 0.12)',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                    borderBottom: '1px solid rgba(233, 30, 99, 0.12)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                contained: {
                    backgroundColor: accentColor,
                    color: '#FFFFFF',
                    '&:hover': {
                        backgroundColor: accentDark,
                    },
                },
                outlined: {
                    borderColor: accentColor,
                    color: accentColor,
                    '&:hover': {
                        backgroundColor: 'rgba(233, 30, 99, 0.08)',
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(233, 30, 99, 0.1)',
                    },
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: accentColor,
                },
                track: {
                    color: accentColor,
                },
                thumb: {
                    color: accentColor,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderColor: accentColor,
                    color: accentColor,
                },
            },
        },
    },
});