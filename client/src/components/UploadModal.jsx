import { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

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

function UploadModal({ open, onClose, onUpload }) {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [genre, setGenre] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!audioFile) {
            alert('Выберите аудиофайл!');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('album', album);
        formData.append('genre', genre);
        formData.append('release_year', releaseYear);
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);

        await onUpload(formData);
        
        // Очищаем форму
        setTitle('');
        setArtist('');
        setAlbum('');
        setGenre('');
        setReleaseYear('');
        setAudioFile(null);
        setCoverFile(null);
        setUploading(false);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Загрузить трек</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Исполнитель" value={artist} onChange={(e) => setArtist(e.target.value)} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Альбом" value={album} onChange={(e) => setAlbum(e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Жанр" value={genre} onChange={(e) => setGenre(e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Год" type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                            <Button fullWidth variant="outlined" component="label">
                                Выбрать MP3
                                <input type="file" accept="audio/*" hidden onChange={(e) => setAudioFile(e.target.files[0])} />
                            </Button>
                            {audioFile && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{audioFile.name}</Typography>}
                        </Grid>
                        <Grid item xs={12}>
                            <Button fullWidth variant="outlined" component="label">
                                Выбрать обложку
                                <input type="file" accept="image/*" hidden onChange={(e) => setCoverFile(e.target.files[0])} />
                            </Button>
                            {coverFile && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{coverFile.name}</Typography>}
                        </Grid>
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" type="submit" disabled={uploading}>
                                {uploading ? 'Загрузка...' : 'Загрузить'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
}

export default UploadModal;