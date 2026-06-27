import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { darkTheme, lightTheme } from './theme';
import './i18n';

// Компонент-обёртка для применения темы MUI
function AppWithTheme() {
    const { theme } = useTheme();
    const muiTheme = theme === 'dark' ? darkTheme : lightTheme;

    return (
        <MuiThemeProvider theme={muiTheme}>
            <CssBaseline />
            <App />
        </MuiThemeProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <AppWithTheme />
        </ThemeProvider>
    </React.StrictMode>
);