import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Homepage from './pages/Homepage';
import Librarypage from './pages/Librarypage';
import Artistpage from './pages/Artistpage';
import Albumpage from './pages/Albumpage';
import PlayerBar from './components/Playerbar';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UploadModal from './components/UploadModal';
import BottomNav from './components/Bottomnav';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import UnderConstruction from './pages/UnderConstruction';
import AlbumList from './pages/Albumlist';
import NewReleasesPage from './pages/NewReleasesPage';
import Popularpage from './pages/Popularpage';
import API_URL from './config';
import i18n from './i18n';

function App() {
    const API_URL = import.meta.env.VITE_API_URL
    // ===== СОСТОЯНИЯ ПЛЕЕРА =====
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
    
    // ===== ДРУГИЕ СОСТОЯНИЯ ====
    const [loading, setLoading] = useState(true);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [currentUserId, setCurrentUserId] = useState(() => {
        const saved = localStorage.getItem('currentUserId');
        return saved ? parseInt(saved) : 1;
    });
    const [isAdmin, setIsAdmin] = useState(false);

    // ===== ЭФФЕКТЫ =====
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

    useEffect(() => {
        localStorage.setItem('currentUserId', currentUserId);
    }, [currentUserId]);

    // ===== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ =====
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/user`, {
                    headers: { 'x-user-id': currentUserId }
                });
                setIsAdmin(response.data.is_admin === 1);
            } catch (error) {
                console.error('Ошибка загрузки пользователя:', error);
                setIsAdmin(false);
            }
        };
        fetchUser();
    }, [currentUserId]);

    // ===== ЗАГРУЗКА ТРЕКОВ =====
    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/tracks`);
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
            
            const response = await axios.get(`${API_URL}/api/tracks/search?${params.toString()}`);
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
    const handlePlay = (track, resetTime = false) => {
        if (!track) return;
        
        if (selectedTrack?.id === track.id) {
            if (resetTime) {
                setCurrentTime(0);
                setIsPlaying(true);
            } else {
                setIsPlaying(!isPlaying);
            }
        } else {
            setSelectedTrack(track);
            setCurrentTime(0);
            setIsPlaying(true);
        }
    };

    const handleNext = () => {
        if (!selectedTrack || filteredTracks.length === 0) return;
        
        const sameArtistTracks = filteredTracks.filter(t => t.artist === selectedTrack.artist);
        const currentIndex = sameArtistTracks.findIndex(t => t.id === selectedTrack.id);
        
        if (sameArtistTracks.length > 1 && currentIndex < sameArtistTracks.length - 1) {
            setSelectedTrack(sameArtistTracks[currentIndex + 1]);
        } else if (sameArtistTracks.length === 1) {
            setSelectedTrack(sameArtistTracks[0]);
        } else {
            const globalIndex = filteredTracks.findIndex(t => t.id === selectedTrack.id);
            const globalNext = (globalIndex + 1) % filteredTracks.length;
            setSelectedTrack(filteredTracks[globalNext]);
        }
        setCurrentTime(0);
        setIsPlaying(true);
    };

    const handlePrev = () => {
        if (!selectedTrack || filteredTracks.length === 0) return;
        
        const sameArtistTracks = filteredTracks.filter(t => t.artist === selectedTrack.artist);
        const currentIndex = sameArtistTracks.findIndex(t => t.id === selectedTrack.id);
        
        if (sameArtistTracks.length > 1 && currentIndex > 0) {
            setSelectedTrack(sameArtistTracks[currentIndex - 1]);
        } else if (sameArtistTracks.length === 1) {
            setSelectedTrack(sameArtistTracks[0]);
        } else {
            const globalIndex = filteredTracks.findIndex(t => t.id === selectedTrack.id);
            const globalPrev = (globalIndex - 1 + filteredTracks.length) % filteredTracks.length;
            setSelectedTrack(filteredTracks[globalPrev]);
        }
        setCurrentTime(0);
        setIsPlaying(true);
    };

    // ===== ЗАГРУЗКА ТРЕКА =====
    const handleUpload = async (formData, userId) => {
        try {
            const response = await axios.post(`${API_URL}/api/tracks`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'x-user-id': userId || currentUserId
                }
            });
            
            fetchTracks();
            
            return {
                success: true,
                avatarAdded: response.data.avatarAdded || false,
                avatarExists: response.data.avatarExists || false,
                coverAdded: response.data.coverAdded || false,
                coverExists: response.data.coverExists || false,
                artist: response.data.artist,
                album: response.data.album
            };
        } catch (error) {
            console.error('Ошибка:', error);
            throw error;
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
            <Header 
                onUploadClick={() => setUploadModalOpen(true)} 
                onSearch={handleSearch}
                tracks={tracks}
            />
            
            <Sidebar 
                tracks={tracks} 
                isOpen={isSidebarOpen} 
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
                onGenreSelect={handleGenreSelect}
                selectedGenre={selectedGenre}
                onPlay={handlePlay}
                selectedTrack={selectedTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
            />
            
            <Container sx={{ 
                py: 4, 
                pb: 12, 
                ml: isSidebarOpen ? '300px' : '100px',
                transition: 'margin-left 0.25s ease, width 0.25s ease',
                width: isSidebarOpen ? 'calc(100% - 310px)' : 'calc(100% - 120px)',
                maxWidth: '104% !important',
                px: 3,
            }}>
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <Homepage 
                                onPlay={handlePlay} 
                                selectedTrack={selectedTrack} 
                                isPlaying={isPlaying} 
                                setIsPlaying={setIsPlaying}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                            />
                        } 
                    />
                    {/* ===== UNDERCONSTRUCTION — ОДИН РОУТ С УСЛОВНОЙ РЕНДЕРИНГ ===== */}
                    <Route 
                        path="/under-construction" 
                        element={
                            <>
                                {/* ПК версия */}
                                <Box sx={{ 
                                    display: { xs: 'none', md: 'flex' },
                                    width: '100%',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    px: { xs: 2, md: 0 },
                                }}>
                                    <UnderConstruction isSidebarOpen={isSidebarOpen} />
                                </Box>
                            </>
                        } 
                    />

                    <Route 
                        path="/new-releases" 
                        element={
                            <NewReleasesPage 
                                onPlay={handlePlay} 
                                selectedTrack={selectedTrack} 
                                isPlaying={isPlaying} 
                                setIsPlaying={setIsPlaying}
                            />
                        } 
                    />
                    <Route 
    path="/popular" 
    element={
        <Popularpage 
            onPlay={handlePlay} 
            selectedTrack={selectedTrack} 
            isPlaying={isPlaying} 
            setIsPlaying={setIsPlaying}
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
                                setIsPlaying={setIsPlaying}
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
                                setIsPlaying={setIsPlaying} 
                            />
                        } 
                    />
                    <Route 
                        path="/artist/:artistName/albums" 
                        element={
                            <AlbumList 
                                onPlay={handlePlay} 
                                selectedTrack={selectedTrack} 
                                isPlaying={isPlaying} 
                                setIsPlaying={setIsPlaying}
                                setCurrentTime={setCurrentTime}  
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
                                setIsPlaying={setIsPlaying}                                 
                            />
                        } 
                    />
                </Routes>
            </Container>
            
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
            
            <BottomNav 
                tracks={tracks}
                onPlay={handlePlay}
                selectedTrack={selectedTrack}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
            />
            
            <UploadModal 
                open={uploadModalOpen} 
                onClose={() => setUploadModalOpen(false)} 
                onUpload={handleUpload}
                currentUserId={currentUserId}
            />
        </BrowserRouter>
    );
}

export default App;
