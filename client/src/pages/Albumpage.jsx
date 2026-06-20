import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CircularProgress from '@mui/material/CircularProgress';
import TrackCard from '../components/Trackcard';

function AlbumPage({ onPlay, selectedTrack, isPlaying }) {
    const { albumName } = useParams();
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlbumData();
    }, [albumName]);

    const fetchAlbumData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/tracks');
            const allTracks = response.data;
            
            const albumTracks = allTracks.filter(
                track => track.album && track.album.toLowerCase() === albumName.toLowerCase()
            );
            
            setTracks(albumTracks);
            
            if (albumTracks.length > 0) {
                setAlbum({
                    name: albumName,
                    artist: albumTracks[0].artist,
                    tracks: albumTracks.length,
                    cover: albumTracks[0].cover_url,
                });
            } else {
                setAlbum(null);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!album) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5">Альбом не найден</Typography>
            </Box>
        );
    }

    return (
        <>
            <Card sx={{ display: 'flex', mb: 4, bgcolor: 'background.paper' }}>
                <CardMedia
                    component="img"
                    sx={{ width: 200, height: 200, objectFit: 'cover' }}
                    image={album.cover ? `http://localhost:3000${album.cover}` : 'https://via.placeholder.com/200x200?text=No+Image'}
                    alt={album.name}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">Альбом</Typography>
                    <Typography variant="h4" gutterBottom>{album.name}</Typography>
                    <Typography variant="body1">{album.artist}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {album.tracks} треков
                    </Typography>
                </CardContent>
            </Card>

            <Typography variant="h5" gutterBottom>
                Треки
            </Typography>
            <Grid container spacing={3}>
                {tracks.map((track) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                        <TrackCard 
                            track={track} 
                            onPlay={onPlay} 
                            isActive={selectedTrack?.id === track.id} 
                            isPlaying={isPlaying} 
                        />
                    </Grid>
                ))}
            </Grid>
        </>
    );
}

export default AlbumPage;