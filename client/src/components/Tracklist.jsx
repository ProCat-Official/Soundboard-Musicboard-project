import { useState, useEffect } from 'react';
import axios from 'axios';

function TrackList() {
    // Состояния
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrack, setSelectedTrack] = useState(null);
    
    // Форма загрузки
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Получить все треки с сервера
    const fetchTracks = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/tracks');
            setTracks(response.data);
        } catch (error) {
            console.error('Ошибка загрузки треков:', error);
        } finally {
            setLoading(false);
        }
    };

    // Загружаем список треков при запуске
    useEffect(() => {
        fetchTracks();
    }, []);

    // Загрузить новый трек
    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!audioFile) {
            alert('Выберите аудиофайл!');
            return;
        }
        
        setUploading(true);
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('author', author);
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);
        
        try {
            await axios.post('http://localhost:3000/api/tracks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Очищаем форму
            setTitle('');
            setAuthor('');
            setAudioFile(null);
            setCoverFile(null);
            
            // Обновляем список
            fetchTracks();
            
            alert('Трек успешно загружен!');
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            alert('Ошибка при загрузке трека');
        } finally {
            setUploading(false);
        }
    };

    // Показываем загрузку
    if (loading) {
        return <div>Загрузка треков...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Musicboard</h1>
            
            {/* ФОРМА ЗАГРУЗКИ */}
            <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '30px', borderRadius: '8px' }}>
                <h2>Загрузить новый трек</h2>
                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Название трека"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={{ padding: '8px', width: '200px', marginRight: '10px' }}
                        />
                        <input
                            type="text"
                            placeholder="Исполнитель"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            required
                            style={{ padding: '8px', width: '200px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Аудиофайл (MP3): </label>
                        <input
                            type="file"
                            accept="audio/mp3,audio/mpeg"
                            onChange={(e) => setAudioFile(e.target.files[0])}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Обложка (картинка): </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverFile(e.target.files[0])}
                        />
                    </div>
                    <button type="submit" disabled={uploading}>
                        {uploading ? 'Загрузка...' : 'Загрузить трек'}
                    </button>
                </form>
            </div>
            
            {/* СПИСОК ТРЕКОВ */}
            <h2>Библиотека треков ({tracks.length})</h2>
            {tracks.length === 0 ? (
                <p>Нет треков. Загрузите первый!</p>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {tracks.map((track) => (
                        <div key={track.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* Обложка */}
                            {track.cover_url ? (
                                <img 
                                    src={`http://localhost:3000${track.cover_url}`} 
                                    alt="cover" 
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                            ) : (
                                <div style={{ width: '60px', height: '60px', background: '#333', borderRadius: '4px' }}></div>
                            )}
                            
                            {/* Информация */}
                            <div style={{ flex: 1 }}>
                                <strong>{track.title}</strong> — {track.author}
                            </div>
                            
                            {/* Кнопка воспроизведения */}
                            <button onClick={() => setSelectedTrack(track)}>
                                ▶ Воспроизвести
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* АУДИОПЛЕЕР */}
            {selectedTrack && (
                <div style={{ 
                    position: 'fixed', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: '#222', 
                    color: 'white', 
                    padding: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div>
                        <strong>Сейчас играет:</strong> {selectedTrack.title} — {selectedTrack.author}
                    </div>
                    <audio 
                        controls 
                        autoPlay 
                        src={`http://localhost:3000/api/stream/${selectedTrack.id}`}
                        style={{ flex: 1 }}
                    />
                    <button onClick={() => setSelectedTrack(null)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px' }}>
                        ✕ Закрыть
                    </button>
                </div>
            )}
        </div>
    );
}

export default TrackList;