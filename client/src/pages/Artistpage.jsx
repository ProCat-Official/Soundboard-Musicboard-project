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
import PersonIcon from '@mui/icons-material/Person';
import TrackCard from '../components/Trackcard';

function ArtistPage({ onPlay, selectedTrack, isPlaying }) {
    const { artistName } = useParams();
    const [artist, setArtist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArtistData();
    }, [artistName]);

    const fetchArtistData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/tracks');
            const allTracks = response.data;
            
            const artistTracks = allTracks.filter(
                track => track.artist.toLowerCase() === artistName.toLowerCase()
            );
            
            setTracks(artistTracks);
            
            if (artistTracks.length > 0) {
                setArtist({
                    name: artistName,
                    tracks: artistTracks.length,
                    cover: artistTracks[0].cover_url,
                });
            } else {
                setArtist(null);
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

    if (!artist) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5">Исполнитель не найден</Typography>
            </Box>
        );
    }

    return (
        <>
            <Card sx={{ display: 'flex', mb: 4, bgcolor: 'background.paper' }}>
                <CardMedia
                    component="img"
                    sx={{ width: 200, height: 200, objectFit: 'cover' }}
                    image={artist.cover ? `http://localhost:3000${artist.cover}` : 'https://via.placeholder.com/200x200?text=No+Image'}
                    alt={artist.name}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="caption" color="text.secondary">Исполнитель</Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>{artist.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {artist.tracks} треков
                    </Typography>
                </CardContent>
            </Card>

            <Typography variant="h5" gutterBottom>
                Все треки
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

export default ArtistPage;