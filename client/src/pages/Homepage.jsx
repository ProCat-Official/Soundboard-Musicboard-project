import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

function Homepage({ onPlay, selectedTrack, isPlaying }) {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/tracks');
            const tracks = response.data;
            
            // Группируем треки по альбомам
            const albumMap = {};
            tracks.forEach(track => {
                if (track.album) {
                    if (!albumMap[track.album]) {
                        albumMap[track.album] = {
                            name: track.album,
                            artist: track.artist,
                            cover: track.cover_url,
                            tracks: [],
                        };
                    }
                    albumMap[track.album].tracks.push(track);
                }
            });
            
            const albumList = Object.values(albumMap);
            // Перемешиваем и берём 6 случайных альбомов
            const shuffled = albumList.sort(() => 0.5 - Math.random());
            setAlbums(shuffled.slice(0, 6));
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAlbumClick = (album) => {
        navigate(`/album/${encodeURIComponent(album.name)}`);
        // Автозапуск первого трека альбома
        if (album.tracks.length > 0) {
            onPlay(album.tracks[0]);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Typography variant="h4" gutterBottom>
                🎵 Рекомендуем послушать сегодня
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Альбомы, которые могут вам понравиться
            </Typography>
            
            <Grid container spacing={3}>
                {albums.map((album) => (
                    <Grid item xs={12} sm={6} md={4} key={album.name}>
                        <Card 
                            sx={{ 
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: 6,
                                }
                            }}
                            onClick={() => handleAlbumClick(album)}
                        >
                            <CardMedia
                                component="img"
                                height="200"
                                image={album.cover ? `http://localhost:3000${album.cover}` : 'https://via.placeholder.com/300x200?text=No+Cover'}
                                alt={album.name}
                                sx={{ objectFit: 'cover' }}
                            />
                            <CardContent>
                                <Typography variant="h6" noWrap>
                                    {album.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {album.artist} • {album.tracks.length} треков
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
}

export default Homepage;