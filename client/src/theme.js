import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#1db954' },
        background: { default: '#121212', paper: '#1e1e1e' },
        text: { primary: '#ffffff', secondary: '#b3b3b3' },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#181818',
                    '&:hover': { backgroundColor: '#282828' },
                },
            },
        },
    },
});

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1db954' },
        background: { default: '#f5f5f5', paper: '#ffffff' },
        text: { primary: '#000000', secondary: '#666666' },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff',
                    '&:hover': { backgroundColor: '#f0f0f0' },
                },
            },
        },
    },
});