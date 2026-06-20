import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Homepage from './pages/Homepage';
import Librarypage from './pages/Librarypage';
import Artistpage from './pages/Artistpage';
import Albumpage from './pages/Albumpage';
import PlayerBar from './components/Playerbar';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UploadModal from './components/UploadModal';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

function App() {
    // ===== СОСТОЯНИЯ ПЛЕЕРА (ГЛОБАЛЬНЫЕ) =====
    const [tracks, setTracks] = useState([]);
    const [filteredTracks, setFilteredTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(() => {
        const saved = localStorage.getItem('selectedTrack');
        return saved ? JSON.parse(saved) : null;
    });
    const [isPlaying, setIsPlaying] = useState(() => {
        const saved = localStorage.getItem('isPlaying');
        return saved ? JSON.parse(saved) : false;
    });
    const [currentTime, setCurrentTime] = useState(() => {
        const saved = localStorage.getItem('currentTime');
        return saved ? JSON.parse(saved) : 0;
    });
    
    // ===== ДРУГИЕ СОСТОЯНИЯ =====
    const [loading, setLoading] = useState(true);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');

    // ===== ЭФФЕКТЫ ДЛЯ СОХРАНЕНИЯ В localStorage =====
    useEffect(() => {
        localStorage.setItem('selectedTrack', JSON.stringify(selectedTrack));
    }, [selectedTrack]);

    useEffect(() => {
        localStorage.setItem('isPlaying', JSON.stringify(isPlaying));
    }, [isPlaying]);

    useEffect(() => {
        localStorage.setItem('currentTime', JSON.stringify(currentTime));
    }, [currentTime]);

    useEffect(() => {
        localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    // ===== ЗАГРУЗКА ТРЕКОВ =====
    useEffect(() => {
        fetchTracks();
    }, []);

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

    // ===== ПОИСК =====
    const performSearch = async (query, genre) => {
        try {
            const params = new URLSearchParams();
            if (query && query.trim()) params.append('query', query.trim());
            if (genre && genre !== 'all') params.append('genre', genre);
            
            const response = await axios.get(`http://localhost:3000/api/tracks/search?${params.toString()}`);
            setFilteredTracks(response.data);
        } catch (error) {
            console.error('Ошибка поиска:', error);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        performSearch(query, selectedGenre);
    };

    const handleGenreSelect = (genre) => {
        setSelectedGenre(genre);
        performSearch(searchQuery, genre);
    };

    // ===== УПРАВЛЕНИЕ ПЛЕЕРОМ =====
    const handlePlay = (track) => {
        if (selectedTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            setSelectedTrack(track);
            setIsPlaying(true);
            setCurrentTime(0);
        }
    };

    const handleNext = () => {
        if (!selectedTrack || filteredTracks.length === 0) return;
        const currentIndex = filteredTracks.findIndex(t => t.id === selectedTrack.id);
        const nextIndex = (currentIndex + 1) % filteredTracks.length;
        setSelectedTrack(filteredTracks[nextIndex]);
        setCurrentTime(0);
    };

    const handlePrev = () => {
        if (!selectedTrack || filteredTracks.length === 0) return;
        const currentIndex = filteredTracks.findIndex(t => t.id === selectedTrack.id);
        const prevIndex = (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
        setSelectedTrack(filteredTracks[prevIndex]);
        setCurrentTime(0);
    };

    const handleUpload = async (formData) => {
        try {
            await axios.post('http://localhost:3000/api/tracks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchTracks();
            alert('Трек загружен!');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка загрузки');
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
        <BrowserRouter>
            {/* Хедер */}
            <Header 
                onUploadClick={() => setUploadModalOpen(true)} 
                onSearch={handleSearch}
            />
            
            {/* Сайдбар */}
            <Sidebar 
                tracks={tracks} 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
                onGenreSelect={handleGenreSelect}
                selectedGenre={selectedGenre}
            />
            
            {/* Страницы */}
            <Container sx={{ py: 4, pb: 12, ml: isSidebarOpen ? '300px' : '100px' }}>
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <Homepage 
                                onPlay={handlePlay} 
                                selectedTrack={selectedTrack} 
                                isPlaying={isPlaying} 
                            />
                        } 
                    />
                    <Route 
                        path="/library" 
                        element={
                            <Librarypage 
                                filteredTracks={filteredTracks}
                                onPlay={handlePlay}
                                selectedTrack={selectedTrack}
                                isPlaying={isPlaying}
                            />
                        } 
                    />
                    <Route 
                        path="/artist/:artistName" 
                        element={
                            <Artistpage 
                                onPlay={handlePlay} 
                                selectedTrack={selectedTrack} 
                                isPlaying={isPlaying} 
                            />
                        } 
                    />
                    <Route 
                        path="/album/:albumName" 
                        element={
                            <Albumpage 
                                onPlay={handlePlay} 
                                selectedTrack={selectedTrack} 
                                isPlaying={isPlaying} 
                            />
                        } 
                    />
                </Routes>
            </Container>
            
            {/* Плеер */}
            <PlayerBar 
                track={selectedTrack} 
                tracks={filteredTracks}
                onNext={handleNext}
                onPrev={handlePrev}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
            />
            
            {/* Модалка загрузки */}
            <UploadModal 
                open={uploadModalOpen} 
                onClose={() => setUploadModalOpen(false)} 
                onUpload={handleUpload} 
            />
        </BrowserRouter>
    );
}

export default App;