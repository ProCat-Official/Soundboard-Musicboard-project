import { useState, useEffect } from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import TrackCard from './Trackcard';
import PlayerBar from './Playerbar';
import Header from './Header';
import UploadModal from './UploadModal';
import Sidebar from './Sidebar';

function TrackList() {
    const [tracks, setTracks] = useState([]);
    const [filteredTracks, setFilteredTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [genres, setGenres] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    useEffect(() => {
        fetchTracks();
        fetchGenres();
    }, []);

    // Поиск при изменении запроса или жанра
    useEffect(() => {
        performSearch();
    }, [searchQuery, selectedGenre]);

    const fetchTracks = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/tracks');
            setTracks(response.data);
            setFilteredTracks(response.data);
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGenres = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/genres');
            setGenres(response.data);
        } catch (error) {
            console.error('Ошибка загрузки жанров:', error);
        }
    };

    const performSearch = async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('query', searchQuery.trim());
            if (selectedGenre !== 'all') params.append('genre', selectedGenre);
            
            const response = await axios.get(`http://localhost:3000/api/tracks/search?${params.toString()}`);
            setFilteredTracks(response.data);
        } catch (error) {
            console.error('Ошибка поиска:', error);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleGenreSelect = (genre) => {
        setSelectedGenre(genre);
    };

    const handleNext = () => {
        if (!selectedTrack || tracks.length === 0) return;
        const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        setSelectedTrack(tracks[nextIndex]);
    };

    const handlePrev = () => {
        if (!selectedTrack || tracks.length === 0) return;
        const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        setSelectedTrack(tracks[prevIndex]);
    };

    const handleUpload = async (formData) => {
        try {
            await axios.post('http://localhost:3000/api/tracks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchTracks();
            fetchGenres();
            alert('Трек загружен!');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка загрузки');
        }
    };

    const handlePlay = (track) => {
        if (selectedTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            setSelectedTrack(track);
            setIsPlaying(true);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Header 
                onUploadClick={() => setUploadModalOpen(true)} 
                onSearch={handleSearch}
            />
            <Sidebar 
                tracks={tracks} 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
                onGenreSelect={handleGenreSelect}
                genres={genres}
                selectedGenre={selectedGenre}
            />
            <Container sx={{ py: 4, pb: 12, ml: isSidebarOpen ? '300px' : '100px' }}>
                <Typography variant="h4" gutterBottom>
                    Библиотека ({filteredTracks.length})
                </Typography>
                
                {filteredTracks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="text.secondary">
                            Ничего не найдено 😕
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Попробуй изменить поисковый запрос или сбросить фильтры
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {filteredTracks.map((track) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                                <TrackCard 
                                    track={track} 
                                    onPlay={handlePlay} 
                                    isActive={selectedTrack?.id === track.id} 
                                    isPlaying={isPlaying} 
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
            
            <PlayerBar 
                track={selectedTrack} 
                tracks={tracks}
                onNext={handleNext}
                onPrev={handlePrev}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
            />
            
            <UploadModal 
                open={uploadModalOpen} 
                onClose={() => setUploadModalOpen(false)} 
                onUpload={handleUpload} 
            />
        </>
    );
}

export default TrackList;
