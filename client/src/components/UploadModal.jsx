import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MIN_IMAGE_DIMENSION = 200;
const MAX_IMAGE_DIMENSION = 2000;
const MAX_TEXT_LENGTH = 100;
const MIN_YEAR = 1700;
const MAX_YEAR = new Date().getFullYear();
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
};

// ✅ ДОБАВЛЕН currentUserId
function UploadModal({ open, onClose, onUpload, currentUserId }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [genre, setGenre] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Состояния для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const genreKeys = ['rock', 'pop', 'hiphop', 'electronic', 'jazz', 'classical', 'soundtrack', 'grunge', 'other'];

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > MAX_FILE_SIZE) {
            showMessage(t('upload.fileTooLarge'), 'error');
            e.target.value = '';
            return;
        }
        
        if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
            showMessage(t('upload.invalidAudioFormat'), 'error');
            e.target.value = '';
            return;
        }
        
        setAudioFile(file);
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > MAX_IMAGE_SIZE) {
            showMessage(t('upload.coverTooLarge'), 'error');
            e.target.value = '';
            return;
        }
        
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showMessage(t('upload.invalidImageFormat'), 'error');
            e.target.value = '';
            return;
        }
        
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            
            if (img.width < MIN_IMAGE_DIMENSION || img.height < MIN_IMAGE_DIMENSION) {
                showMessage(t('upload.imageTooSmall'), 'error');
                e.target.value = '';
                return;
            }
            
            if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
                showMessage(t('upload.imageTooLarge'), 'error');
                e.target.value = '';
                return;
            }
            
            setCoverFile(file);
        };
        img.onerror = () => {
            showMessage(t('upload.invalidImageFile'), 'error');
            e.target.value = '';
        };
        img.src = objectUrl;
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > MAX_IMAGE_SIZE) {
            showMessage(t('upload.avatarTooLarge'), 'error');
            e.target.value = '';
            return;
        }
        
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showMessage(t('upload.invalidImageFormat'), 'error');
            e.target.value = '';
            return;
        }
        
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            
            if (img.width < MIN_IMAGE_DIMENSION || img.height < MIN_IMAGE_DIMENSION) {
                showMessage(t('upload.imageTooSmall'), 'error');
                e.target.value = '';
                return;
            }
            
            if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
                showMessage(t('upload.imageTooLarge'), 'error');
                e.target.value = '';
                return;
            }
            
            setAvatarFile(file);
        };
        img.onerror = () => {
            showMessage(t('upload.invalidImageFile'), 'error');
            e.target.value = '';
        };
        img.src = objectUrl;
    };

    const handleRemoveCover = () => {
        setCoverFile(null);
        const fileInput = document.querySelector('input[accept=".jpg,.jpeg,.png,.webp,image/*"]');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        const fileInput = document.querySelector('input[accept=".jpg,.jpeg,.png,.webp,image/*"]');
        if (fileInput) fileInput.value = '';
    };

    // ===== ПРОВЕРКА ПОЛЕЙ ПЕРЕД ОТПРАВКОЙ =====
    const validateFields = () => {
        if (!audioFile) {
            showMessage(t('upload.noAudioError'), 'error');
            return false;
        }
        
        if (title.length > MAX_TEXT_LENGTH) {
            showMessage(t('upload.titleTooLong'), 'error');
            return false;
        }
        
        if (artist.length > MAX_TEXT_LENGTH) {
            showMessage(t('upload.artistTooLong'), 'error');
            return false;
        }
        
        if (album && album.length > MAX_TEXT_LENGTH) {
            showMessage(t('upload.albumTooLong'), 'error');
            return false;
        }
        
        if (releaseYear) {
            const year = parseInt(releaseYear);
            if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
                showMessage(t('upload.yearError', { currentYear: MAX_YEAR }), 'error');
                return false;
            }
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateFields()) {
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('artist', artist.trim());
        formData.append('album', album.trim());
        formData.append('genre', genre);
        formData.append('release_year', releaseYear);
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);
        if (avatarFile) formData.append('avatar', avatarFile);

        try {
            // ✅ ПЕРЕДАЁМ currentUserId В onUpload
            const result = await onUpload(formData, currentUserId);
            
            // Показываем сообщения об успехе
            if (result) {
                let successMessage = t('upload.uploadSuccess');
                
                if (result.avatarAdded) {
                    successMessage += ` ${t('upload.avatarAdded', { artist: result.artist })}`;
                } else if (result.avatarExists) {
                    successMessage += ` ${t('upload.avatarExists')}`;
                }
                
                if (result.coverAdded) {
                    successMessage += ` ${t('upload.coverAdded', { album: result.album })}`;
                } else if (result.coverExists) {
                    successMessage += ` ${t('upload.coverExists')}`;
                }
                
                showMessage(successMessage, 'success');
            }
            
            // Очищаем форму
            setTitle('');
            setArtist('');
            setAlbum('');
            setGenre('');
            setReleaseYear('');
            setAudioFile(null);
            setCoverFile(null);
            setAvatarFile(null);
            setUploading(false);
            onClose();
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            
            const errorMessage = error.response?.data?.error || t('upload.uploadError');
            showMessage(errorMessage, 'error');
            setUploading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{t('upload.title')}</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label={t('upload.titleLabel')} 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TEXT_LENGTH))} 
                                required 
                                inputProps={{ maxLength: MAX_TEXT_LENGTH }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label={t('upload.artistLabel')} 
                                value={artist} 
                                onChange={(e) => setArtist(e.target.value.slice(0, MAX_TEXT_LENGTH))} 
                                required 
                                inputProps={{ maxLength: MAX_TEXT_LENGTH }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label={t('upload.albumLabel')} 
                                value={album} 
                                onChange={(e) => setAlbum(e.target.value.slice(0, MAX_TEXT_LENGTH))} 
                                inputProps={{ maxLength: MAX_TEXT_LENGTH }}
                            />
                        </Grid>
                        
                        <Grid item xs={6}>
                            <FormControl fullWidth size="medium" variant="outlined">
                                <Select
                                    displayEmpty
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    sx={{
                                        height: '56px',
                                        '& .MuiSelect-select': {
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: '16.5px 14px',
                                            color: genre ? 'text.primary' : 'text.secondary',
                                            fontStyle: 'normal',
                                        }
                                    }}
                                >
                                    <MenuItem value="" disabled sx={{ fontStyle: 'normal' }}>
                                        {t('upload.genreLabel')}
                                    </MenuItem>
                                    {genreKeys.map((key) => (
                                        <MenuItem 
                                            key={key} value={key}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontStyle: 'normal',
                                            }}
                                        >
                                            <Typography 
                                                sx={{ 
                                                    fontWeight: genre === key ? 'bold' : 400,
                                                    color: genre === key ? '#E91E63' : 'text.primary',
                                                    fontStyle: 'normal',
                                                }}
                                            >
                                                {t(`genres.${key}`)}
                                            </Typography>
                                            {genre === key && (
                                                <Typography sx={{ color: '#E91E63', fontSize: '1.2rem', ml: 2 }}>✓</Typography>
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={6}>
                            <TextField 
                                fullWidth 
                                label={t('upload.yearLabel')} 
                                type="number" 
                                value={releaseYear} 
                                onChange={(e) => setReleaseYear(e.target.value.slice(0, 4))} 
                                inputProps={{ 
                                    maxLength: 4, 
                                    min: MIN_YEAR, 
                                    max: MAX_YEAR 
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Button fullWidth variant="outlined" component="label">
                                {t('upload.selectAudio')}
                                <input 
                                    type="file" 
                                    accept=".mp3,.wav,.ogg,.flac,audio/*"
                                    hidden 
                                    onChange={handleAudioChange}
                                />
                            </Button>
                            {audioFile && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.main' }}>
                                    ✅ {audioFile.name} ({Math.round(audioFile.size / 1024)} KB)
                                </Typography>
                            )}
                        </Grid>
                        
                        <Grid item xs={12}>
                            {coverFile ? (
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    color="error"
                                    onClick={handleRemoveCover}
                                >
                                    {t('upload.removeCover')}
                                </Button>
                            ) : (
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    component="label"
                                >
                                    {t('upload.selectCover')}
                                    <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.webp,image/*"
                                        hidden 
                                        onChange={handleCoverChange}
                                    />
                                </Button>
                            )}
                            {coverFile && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.main' }}>
                                    ✅ {coverFile.name} ({Math.round(coverFile.size / 1024)} KB)
                                </Typography>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            {avatarFile ? (
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    color="error"
                                    onClick={handleRemoveAvatar}
                                >
                                    {t('upload.removeAvatar')}
                                </Button>
                            ) : (
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    component="label"
                                >
                                    {t('upload.selectAvatar')}
                                    <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.webp,image/*"
                                        hidden 
                                        onChange={handleAvatarChange}
                                    />
                                </Button>
                            )}
                            {avatarFile && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.main' }}>
                                    ✅ {avatarFile.name} ({Math.round(avatarFile.size / 1024)} KB)
                                </Typography>
                            )}
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" type="submit" disabled={uploading}>
                                {uploading ? t('upload.uploading') : t('upload.upload')}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
                
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={5000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Modal>
    );
}

export default UploadModal;