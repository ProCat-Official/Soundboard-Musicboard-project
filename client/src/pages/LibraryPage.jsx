import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TrackCard from '../components/TrackCard';

function LibraryPage({ filteredTracks, onPlay, selectedTrack, isPlaying }) {
    return (
        <>
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
                                onPlay={onPlay} 
                                isActive={selectedTrack?.id === track.id} 
                                isPlaying={isPlaying} 
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </>
    );
}

export default LibraryPage;
