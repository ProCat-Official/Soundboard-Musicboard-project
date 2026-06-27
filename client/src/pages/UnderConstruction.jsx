import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

function UnderConstruction({ isSidebarOpen }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: '75vh', md: '90vh' },
                textAlign: 'center',
                // ✅ ФИКСИРУЕМ ПОЗИЦИЮ — НЕ ДВИГАЕТСЯ
                position: { md: 'fixed' },
                top: { md: '48%' },
                left: { md: '49%' },
                transform: { md: 'translate(-50%, -50%)' },
                width: '100%',
                maxWidth: { xs: '100%', md: '700px' },
                p: { xs: 2, md: 3 },
                boxSizing: 'border-box',
                ml: { xs: 0, md: 0 },
                transition: 'none',
                width: { 
                    xs: '100%',
                    md: '700px'
                },
                margin: { md: 0 },
            }}
        > 
            <Box
                component="img"
                src="/engineer/Engineer TF2.png"
                alt="Engineer"
                sx={{
                    width: { xs: '180px', md: '250px' },
                    height: 'auto',
                    objectFit: 'contain',
                    mb: 0
                }}
                onError={(e) => {
                    e.target.src = 'https://wiki.teamfortress.com/w/images/thumb/7/7d/Engineer_emblem_RED.png/200px-Engineer_emblem_RED.png';
                }}
            />

            <Typography 
                variant="h4" 
                sx={{ 
                    fontWeight: 'bold', 
                    mb: 2, 
                    color: 'text.primary', 
                    width: '100%',
                    whiteSpace: { xs: 'normal', md: 'nowrap' },
                    fontSize: { xs: '1.1rem', md: '2rem' },
                    px: { xs: 1, md: 0 },
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                }}
            >
                {t('underConstruction.title')}
            </Typography>

            <Typography 
                variant="body1" 
                sx={{ 
                    color: 'text.secondary', 
                    mb: 3,
                    fontSize: { xs: '0.85rem', md: '1rem' },
                    px: { xs: 1, md: 0 },
                }}
            >
                {t('underConstruction.subtitle')}
            </Typography>

            <Typography 
                variant="body2" 
                sx={{ 
                    color: 'primary.main', 
                    cursor: 'pointer',
                    mr: { xs: 0, md: 3 },
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => navigate(-1)}
            >
                {t('underConstruction.back')}
            </Typography>
        </Box>
    );
}

export default UnderConstruction;