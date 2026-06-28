import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';
import AlbumIcon from '@mui/icons-material/Album';
import CardItem from '../components/Carditem';
import API_URL from '../config';

// Лимит карточек в каждой секции
const SECTION_LIMIT = 9;

// EmptyState с MUI иконками
function EmptyState({ type, height = 150 }) {
    const getIcon = () => {
        switch (type) {
            case 'artist': return <PersonIcon sx={{ fontSize: 48, color: 'text.disabled' }} />;
            case 'album':  return <AlbumIcon  sx={{ fontSize: 48, color: 'text.disabled' }} />;
            default:       return <MusicNoteIcon sx={{ fontSize: 48, color: 'text.disabled' }} />;
        }
    };
    return (
        <Box sx={{
            width: '100%',
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
        }}>
            {getIcon()}
        </Box>
    );
}

// Секция с горизонтальным скроллом
function Section({ title, items, renderItem, onShowAll }) {
    const { t } = useTranslation();
    if (!items || items.length === 0) return null;

    const limited = items.slice(0, SECTION_LIMIT);
    const hasMore = items.length > SECTION_LIMIT;

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {title}
                </Typography>
                <Button
                    variant="text"
                    onClick={onShowAll}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.8rem', md: '0.85rem' },
                        p: 0,
                        color: 'primary.main',
                        '&:hover': { color: 'primary.dark' },
                    }}
                >
                    {t('common.showAll')} →
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: { xs: 'nowrap', md: 'nowrap' },
                    overflowX: { xs: 'auto', md: 'hidden' },
                    overflowY: 'hidden',
                    pb: { xs: 1, md: 0 },
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { height: '4px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(128,128,128,0.3)',
                        borderRadius: '4px',
                    },
                }}
            >
                {limited.map((item) => renderItem(item))}
            </Box>
        </Box>
    );
}

function Homepage({ onPlay, selectedTrack, isPlaying, setIsPlaying, currentUserId, isAdmin }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [recentTracks, setRecentTracks] = useState([]);
    const [recentAlbums, setRecentAlbums] = useState([]);
    const [recentArtists, setRecentArtists] = useState([]);
    const [popularTracks, setPopularTracks] = useState([]);
    const [popularAlbums, setPopularAlbums] = useState([]);
    const [popularArtists, setPopularArtists] = useState([]);

    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rtRes, raRes, rArRes, ptRes, paRes, pArRes] = await Promise.all([
                axios.get(`${API_URL}/api/tracks/recent-user`),
                axios.get(`${API_URL}/api/albums/recent-user`),
                axios.get(`${API_URL}/api/artists/recent-user`),
                axios.get(`${API_URL}/api/tracks/popular`),
                axios.get(`${API_URL}/api/albums/popular`),
                axios.get(`${API_URL}/api/artists/popular`),
            ]);
            setRecentTracks(rtRes.data || []);
            setRecentAlbums(raRes.data || []);
            setRecentArtists(rArRes.data || []);
            setPopularTracks(ptRes.data || []);
            setPopularAlbums(paRes.data || []);
            setPopularArtists(pArRes.data || []);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTrackClick = (track) => {
        if (selectedTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            onPlay(track);
            setIsPlaying(true);
        }
    };

    // ===== УДАЛЕНИЕ С ПЕРЕВОДАМИ =====
    const handleDeleteTrack = async (track) => {
        if (!window.confirm(t('delete.confirmTrack', { title: track.title }))) return;
        try {
            await axios.delete(`${API_URL}/api/tracks/${track.id}`, {
                headers: { 'x-user-id': currentUserId }
            });
            await fetchData();
            if (selectedTrack?.id === track.id) {
                const allTracks = [...recentTracks, ...popularTracks];
                const remainingTracks = allTracks.filter(t => t.id !== track.id);
                if (remainingTracks.length > 0) {
                    onPlay(remainingTracks[0]);
                    setIsPlaying(true);
                } else {
                    setIsPlaying(false);
                }
            }
            alert(t('delete.successTrack'));
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert(error.response?.data?.error || t('delete.errorTrack'));
        }
    };

    const handleDeleteAlbum = async (album) => {
        if (!window.confirm(t('delete.confirmAlbum', { title: album.title }))) return;
        try {
            await axios.delete(`${API_URL}/api/albums/${album.id}`, {
                headers: { 'x-user-id': currentUserId }
            });
            await fetchData();
            alert(t('delete.successAlbum'));
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert(error.response?.data?.error || t('delete.errorAlbum'));
        }
    };

    const handleDeleteArtist = async (artist) => {
        if (!window.confirm(t('delete.confirmArtist', { name: artist.name }))) return;
        try {
            await axios.delete(`${API_URL}/api/artists/${artist.id}`, {
                headers: { 'x-user-id': currentUserId }
            });
            await fetchData();
            alert(t('delete.successArtist'));
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert(error.response?.data?.error || t('delete.errorArtist'));
        }
    };

    // Для недавних релизов → NewReleasesPage
    const goToNewReleases = (type) => {
        navigate(`/new-releases?type=${type}`);
    };

    // Для популярных релизов → PopularPage
    const goToPopular = (type) => {
        navigate(`/popular?type=${type}`);
    };

    // ─── Рендер трека ───────────────────────────────────────────────────────────
    const renderTrack = (track) => {
        const isActive = selectedTrack?.id === track.id;
        const isHovered = hoveredId === `track-${track.id}`;
        const canDelete = isAdmin || (track.user_id === currentUserId && track.is_official === 0);
 
        const subtitle = `${track.artist || ''} • ${t('homepage.track')} • ${track.release_year || ''}`;

        return (
            <Box key={track.id} sx={{ flexShrink: 0, width: { xs: '140px', sm: '160px', md: '150px' } }}>
                <CardItem
                    id={track.id}
                    title={track.title}
                    subtitle={subtitle}
                    image={track.cover_url ? `${API_URL}${track.cover_url}` : null}
                    type="track"
                    isPlaying={isPlaying}
                    isActive={isActive}
                    isHovered={isHovered}
                    onPlay={() => handleTrackClick(track)}
                    onNavigate={() => {
                        if (track.album) {
                            navigate(`/album/${encodeURIComponent(track.album)}`);
                        }
                    }}
                    onHover={(h) => setHoveredId(h ? `track-${track.id}` : null)}
                    width="100%"
                    imageHeight={150}
                    borderRadius={2}
                    showPlayButton
                    canDelete={canDelete}
                    onDelete={() => handleDeleteTrack(track)}
                    deleteType="track"
                    deleteName={track.title}
                />
            </Box>
        );
    };

    // ─── Рендер альбома ─────────────────────────────────────────────────────────
    const renderAlbum = (album) => {
        const isHovered = hoveredId === `album-${album.id}`;
        const canDelete = isAdmin || (album.user_id === currentUserId);

        const subtitle = `${album.artist || ''} • ${t('homepage.album')} • ${album.release_year || ''}`;

        return (
            <Box key={album.id} sx={{ flexShrink: 0, width: { xs: '140px', sm: '160px', md: '150px' } }}>
                <CardItem
                    id={album.id}
                    title={album.title}
                    subtitle={subtitle}
                    image={album.cover_url ? `${API_URL}${album.cover_url}` : null}
                    type="album"
                    isPlaying={false}
                    isActive={false}
                    isHovered={isHovered}
                    onNavigate={() => navigate(`/album/${encodeURIComponent(album.title)}`)}
                    onHover={(h) => setHoveredId(h ? `album-${album.id}` : null)}
                    width="100%"
                    imageHeight={150}
                    borderRadius={2}
                    showPlayButton={false}
                    canDelete={canDelete}
                    onDelete={() => handleDeleteAlbum(album)}
                    deleteType="album"
                    deleteName={album.title}
                />
            </Box>
        );
    };

    // ─── Рендер артиста ─────────────────────────────────────────────────────────
    const renderArtist = (artist) => {
        const isHovered = hoveredId === `artist-${artist.id}`;
        const canDelete = isAdmin || (artist.user_id === currentUserId);

        const subtitle = `${artist.tracks_count || 0} ${t('homepage.tracks')}`;

        return (
            <Box key={artist.id} sx={{ flexShrink: 0, width: { xs: '140px', sm: '160px', md: '150px' } }}>
                <CardItem
                    id={artist.id}
                    title={artist.name}
                    subtitle={subtitle}
                    image={artist.avatar_url ? `${API_URL}${artist.avatar_url}` : null}
                    type="artist"
                    isPlaying={false}
                    isActive={false}
                    isHovered={isHovered}
                    onNavigate={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
                    onHover={(h) => setHoveredId(h ? `artist-${artist.id}` : null)}
                    width="100%"
                    imageHeight={150}
                    borderRadius={2}
                    imageVariant="circle"
                    showPlayButton={false}
                    canDelete={canDelete}
                    onDelete={() => handleDeleteArtist(artist)}
                    deleteType="artist"
                    deleteName={artist.name}
                />
            </Box>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const hasRecent = recentTracks.length > 0 || recentAlbums.length > 0 || recentArtists.length > 0;
    const hasPopular = popularTracks.length > 0 || popularAlbums.length > 0 || popularArtists.length > 0;
    const isEmpty = !hasRecent && !hasPopular;

    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                borderRadius: { xs: 0, md: 4 },
                overflow: { xs: 'visible', md: 'hidden' },
                boxShadow: { xs: 0, md: 3 },
                mx: { xs: -2, sm: -3, md: -5 },
                my: { xs: 3, md: -3 },
                width: { xs: '100vw', md: '104%' },
                maxWidth: { xs: '100vw', md: 'none' },
                position: { xs: 'relative', md: 'static' },
                left: { xs: -307, md: 'auto' },
                right: { xs: 0, md: 'auto' },
                p: { xs: 2, md: 3 },
                pb: { xs: 2, md: 3 },
                minHeight: { xs: '100vh', md: 'auto' },
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {t('homepage.title')}
            </Typography>

            <Section
                title={t('homepage.recentTracks')}
                items={recentTracks}
                renderItem={renderTrack}
                onShowAll={() => goToNewReleases('tracks', 'recent')}
            />

            <Section
                title={t('homepage.recentAlbums')}
                items={recentAlbums}
                renderItem={renderAlbum}
                onShowAll={() => goToNewReleases('albums', 'recent')}
            />

            <Section
                title={t('homepage.recentArtists')}
                items={recentArtists}
                renderItem={renderArtist}
                onShowAll={() => goToNewReleases('artists', 'recent')}
            />

            {hasRecent && hasPopular && (
                <Box sx={{ my: 4, borderTop: '2px solid', borderColor: 'divider', pt: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                        {t('homepage.popularSection')}
                    </Typography>
                </Box>
            )}

            <Section
                title={t('homepage.popularTracks')}
                items={popularTracks}
                renderItem={renderTrack}
                onShowAll={() => goToPopular('tracks', 'popular')}
            />

            <Section
                title={t('homepage.popularAlbums')}
                items={popularAlbums}
                renderItem={renderAlbum}
                onShowAll={() => goToPopular('albums', 'popular')}
            />

            <Section
                title={t('homepage.popularArtists')}
                items={popularArtists}
                renderItem={renderArtist}
                onShowAll={() => goToPopular('artists', 'popular')}
            />

            {isEmpty && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <MusicNoteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {t('homepage.noContent')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default Homepage;
