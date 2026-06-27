const express = require("express")
const multer = require("multer");
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const db = require("./db.js")
const mm = require('music-metadata');

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MIN_YEAR = 1700;
const MAX_YEAR = new Date().getFullYear();

// ===== КОДЫ ОШИБОК (вместо текста) =====
const ERROR_CODES = {
    // Upload
    AUDIO_REQUIRED: 'AUDIO_REQUIRED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
    INVALID_YEAR: 'INVALID_YEAR',
    TEXT_TOO_LONG: 'TEXT_TOO_LONG',
    
    // Not found
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    TRACK_NOT_FOUND: 'TRACK_NOT_FOUND',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    ARTIST_NOT_FOUND: 'ARTIST_NOT_FOUND',
    ALBUM_NOT_FOUND: 'ALBUM_NOT_FOUND',
    
    // Auth
    UNAUTHORIZED: 'UNAUTHORIZED',
    
    // Permissions
    NO_PERMISSION_DELETE_TRACK: 'NO_PERMISSION_DELETE_TRACK',
    NO_PERMISSION_DELETE_OFFICIAL_TRACK: 'NO_PERMISSION_DELETE_OFFICIAL_TRACK',
    NO_PERMISSION_DELETE_ARTIST: 'NO_PERMISSION_DELETE_ARTIST',
    NO_PERMISSION_EDIT_ARTIST: 'NO_PERMISSION_EDIT_ARTIST',
    NO_PERMISSION_DELETE_ALBUM: 'NO_PERMISSION_DELETE_ALBUM',
    NO_PERMISSION_EDIT_ALBUM: 'NO_PERMISSION_EDIT_ALBUM',
    NO_PERMISSION_AVATAR: 'NO_PERMISSION_AVATAR',
    AVATAR_FILE_REQUIRED: 'AVATAR_FILE_REQUIRED',
    
    // Success
    SUCCESS_TRACK_UPLOADED: 'SUCCESS_TRACK_UPLOADED',
    SUCCESS_TRACK_DELETED: 'SUCCESS_TRACK_DELETED',
    SUCCESS_ARTIST_DELETED: 'SUCCESS_ARTIST_DELETED',
    SUCCESS_ARTIST_UPDATED: 'SUCCESS_ARTIST_UPDATED',
    SUCCESS_ALBUM_DELETED: 'SUCCESS_ALBUM_DELETED',
    SUCCESS_ALBUM_UPDATED: 'SUCCESS_ALBUM_UPDATED',
    SUCCESS_AVATAR_UPDATED: 'SUCCESS_AVATAR_UPDATED',
};

async function getOrCreateUser(username) {
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query('INSERT INTO users (username) VALUES (?)', [username]);
    return result.insertId;
}

async function getNextUsername() {
    const [users] = await db.query('SELECT username FROM users ORDER BY id');
    if (users.length === 0) {
        return 'user1';
    }
    const existingNumbers = users
        .map(u => {
            const match = u.username.match(/^user(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0)
        .sort((a, b) => a - b);
    let nextNumber = 1;
    for (const num of existingNumbers) {
        if (num === nextNumber) {
            nextNumber++;
        } else if (num > nextNumber) {
            break;
        }
    }
    if (nextNumber > 50) {
        throw new Error('Достигнут лимит пользователей (50)');
    }
    return `user${nextNumber}`;
}

// ===== 1. СОЗДАЁМ APP =====
const app = express();

// ===== 2. НАСТРОЙКИ =====
app.use(cors({
    origin: "*",
    allowedHeaders: "*",
    methods: "*"
}))

app.use("/static", express.static(path.join(__dirname, "static")))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// ===== 3. НАСТРОЙКА MULTER =====
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'audio') {
            cb(null, 'static/songs/')
        } else if (file.fieldname === 'cover') {
            cb(null, 'static/covers/')
        } else if (file.fieldname === 'avatar') {
            const dir = 'static/avatars/';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueName + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

// ===== 4. МАРШРУТЫ =====

// Проверочный
app.get("/", async (req, res) => {
    try {
        let [result, _] = await db.query("SHOW TABLES")
        res.status(200).json(result)
    } catch (error) {
        res.status(500).send(error.message)
        console.log(error)
    }
})

// Получить все треки
app.get('/api/tracks', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.title,
                a.name AS artist,
                al.title AS album,
                t.genre,
                t.duration,
                t.release_year,
                t.file_url,
                t.cover_url,
                t.plays_count,
                t.likes,
                t.created_at,
                t.album_id,
                t.is_official,
                t.user_id
            FROM tracks t
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums al ON t.album_id = al.id
            ORDER BY t.id DESC
        `
        const [tracks] = await db.query(query)
        res.status(200).json(tracks)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
})

// ===== ЗАГРУЗКА ТРЕКА =====
app.post('/api/tracks', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, artist, album, genre, release_year } = req.body;
        const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
        const coverFile = req.files['cover'] ? req.files['cover'][0] : null;
        const avatarFile = req.files['avatar'] ? req.files['avatar'][0] : null;
        
        if (!audioFile) {
            return res.status(400).json({ error: ERROR_CODES.AUDIO_REQUIRED });
        }
        
        if (audioFile.size > MAX_FILE_SIZE) {
            if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
            return res.status(400).json({ error: ERROR_CODES.FILE_TOO_LARGE });
        }
        
        if (coverFile && coverFile.size > MAX_IMAGE_SIZE) {
            if (fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);
            return res.status(400).json({ error: ERROR_CODES.IMAGE_TOO_LARGE });
        }
        
        if (avatarFile && avatarFile.size > MAX_IMAGE_SIZE) {
            if (fs.existsSync(avatarFile.path)) fs.unlinkSync(avatarFile.path);
            return res.status(400).json({ error: ERROR_CODES.IMAGE_TOO_LARGE });
        }

        if (release_year) {
            const year = parseInt(release_year);
            if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
                return res.status(400).json({ error: ERROR_CODES.INVALID_YEAR });
            }
        }

        const MAX_TEXT_LENGTH = 100;
        if (title && title.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ error: ERROR_CODES.TEXT_TOO_LONG });
        }
        if (artist && artist.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ error: ERROR_CODES.TEXT_TOO_LONG });
        }
        if (album && album.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ error: ERROR_CODES.TEXT_TOO_LONG });
        }
                
        const fileUrl = `/static/songs/${audioFile.filename}`;
        const coverUrl = coverFile ? `/static/covers/${coverFile.filename}` : null;
        
        let duration = null;
        try {
            const metadata = await mm.parseFile(audioFile.path);
            duration = Math.floor(metadata.format.duration);
        } catch (error) {
            console.warn('Не удалось получить длительность:', error.message);
        }
        
        // ===== ПОЛЬЗОВАТЕЛЬ =====
        let userId;
        let username;
        const providedUserId = req.headers['x-user-id'];
        const providedUsername = req.headers['x-username'] || req.body.username;

        if (providedUserId) {
            const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [providedUserId]);
            if (users.length > 0) {
                userId = users[0].id;
                username = users[0].username;
            } else {
                username = providedUsername || await getNextUsername();
                userId = await getOrCreateUser(username);
            }
        } else if (providedUsername) {
            username = providedUsername;
            userId = await getOrCreateUser(username);
        } else {
            username = await getNextUsername();
            userId = await getOrCreateUser(username);
        }

        console.log(`📝 Пользователь: ${username} (ID: ${userId})`);
        
        // ===== ИСПОЛНИТЕЛЬ =====
        let artistId = null;
        let artistName = artist.trim();
        
        const [existingArtist] = await db.query('SELECT id, name FROM artists WHERE LOWER(name) = LOWER(?)', [artistName]);
        if (existingArtist.length > 0) {
            artistId = existingArtist[0].id;
            artistName = existingArtist[0].name;
        } else {
            const [result] = await db.query('INSERT INTO artists (name) VALUES (?)', [artistName]);
            artistId = result.insertId;
        }
        
        // ===== АВАТАРКА =====
        const [artistCheck] = await db.query('SELECT avatar_url FROM artists WHERE id = ?', [artistId]);
        
        if (!artistCheck[0].avatar_url && avatarFile) {
            const avatarUrl = `/static/avatars/${avatarFile.filename}`;
            await db.query('UPDATE artists SET avatar_url = ? WHERE id = ?', [avatarUrl, artistId]);
            console.log('✅ Аватарка добавлена исполнителю:', artistName);
        } else if (avatarFile) {
            if (fs.existsSync(avatarFile.path)) {
                fs.unlinkSync(avatarFile.path);
                console.log('🗑️ Аватарка удалена (у исполнителя уже есть):', avatarFile.filename);
            }
        }
        
        // ===== АЛЬБОМ =====
        let albumId = null;
        let albumName = album ? album.trim() : null;
        let finalCoverUrl = coverUrl;
        
        if (albumName) {
            const [existingAlbum] = await db.query(
                'SELECT id, title, cover_url FROM albums WHERE LOWER(title) = LOWER(?) AND artist_id = ?', 
                [albumName, artistId]
            );
            if (existingAlbum.length > 0) {
                albumId = existingAlbum[0].id;
                albumName = existingAlbum[0].title;
                
                if (existingAlbum[0].cover_url) {
                    finalCoverUrl = existingAlbum[0].cover_url;
                    if (coverFile && fs.existsSync(coverFile.path)) {
                        fs.unlinkSync(coverFile.path);
                        console.log('🗑️ Обложка удалена (у альбома уже есть):', coverFile.filename);
                    }
                } else {
                    if (coverFile) {
                        finalCoverUrl = coverUrl;
                        await db.query('UPDATE albums SET cover_url = ? WHERE id = ?', [coverUrl, albumId]);
                        console.log('✅ Обложка добавлена к альбому:', albumName);
                    }
                }
            } else {
                const [result] = await db.query(
                    'INSERT INTO albums (title, artist_id, cover_url, release_year, is_single) VALUES (?, ?, ?, ?, 0)',
                    [albumName, artistId, coverUrl, release_year || null]
                );
                albumId = result.insertId;
                finalCoverUrl = coverUrl;
                console.log('✅ Создан новый альбом:', albumName);
            }
        }
        
        // ===== ДОБАВЛЯЕМ ТРЕК =====
        const query = `INSERT INTO tracks 
            (title, artist_id, album_id, genre, release_year, duration, file_url, cover_url, is_official, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`;
        
        const [result] = await db.query(query, [
            title.trim(), 
            artistId, 
            albumId, 
            genre || null, 
            release_year || null, 
            duration, 
            fileUrl,
            finalCoverUrl,
            userId
        ]);
        
        res.status(201).json({ 
            message: ERROR_CODES.SUCCESS_TRACK_UPLOADED, 
            id: result.insertId,
            fileUrl: fileUrl,
            coverUrl: coverUrl,
            duration: duration,
            artist: artistName,
            album: albumName,
            username: username,
            userId: userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ===== СТРИМИНГ =====
app.get('/api/stream/:id', async (req, res) => {
    try {
        const trackId = req.params.id
        const [tracks] = await db.query('SELECT file_url FROM tracks WHERE id = ?', [trackId])
        
        if (tracks.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.TRACK_NOT_FOUND })
        }
        
        const filePath = path.join(__dirname, tracks[0].file_url)
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: ERROR_CODES.FILE_NOT_FOUND })
        }
        
        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        const range = req.headers.range
        
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            const chunksize = (end - start) + 1
            
            const file = fs.createReadStream(filePath, { start, end })
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
            })
            file.pipe(res)
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
            })
            fs.createReadStream(filePath).pipe(res)
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
})

// ===== ПОИСК =====
app.get('/api/tracks/search', async (req, res) => {
    try {
        const { query, genre } = req.query;
        let sql = `
            SELECT 
                t.id,
                t.title,
                a.name AS artist,
                al.title AS album,
                t.genre,
                t.duration,
                t.release_year,
                t.file_url,
                t.cover_url,
                t.is_official,
                t.user_id
            FROM tracks t
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums al ON t.album_id = al.id
            WHERE 1=1
        `;
        const params = [];
        
        if (query && query.trim() !== '') {
            sql += ' AND (t.title LIKE ? OR a.name LIKE ? OR al.title LIKE ?)';
            const searchTerm = `%${query.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (genre && genre !== 'all') {
            sql += ' AND t.genre = ?';
            params.push(genre);
        }
        
        sql += ' ORDER BY t.id DESC LIMIT 20';
        
        const [tracks] = await db.query(sql, params);
        res.status(200).json(tracks);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/genres', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DISTINCT genre FROM tracks WHERE genre IS NOT NULL AND genre != "" ORDER BY genre');
        const genres = rows.map(row => row.genre);
        res.status(200).json(genres);
    } catch (error) {
        console.error('Ошибка получения жанров:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== НЕДАВНО ВЫПУЩЕННЫЕ =====
app.get('/api/tracks/recent', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.title,
                a.name AS artist,
                al.title AS album,
                t.genre,
                t.duration,
                t.release_year,
                t.file_url,
                t.cover_url,
                t.created_at,
                t.is_official,
                t.user_id
            FROM tracks t
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums al ON t.album_id = al.id
            WHERE t.is_official = 0
            ORDER BY t.id DESC
            LIMIT 10
        `
        const [tracks] = await db.query(query)
        res.status(200).json(tracks)
    } catch (error) {
        console.error('Ошибка получения новых релизов:', error)
        res.status(500).json({ error: error.message })
    }
})

// ===== УДАЛИТЬ ТРЕК =====
app.delete('/api/tracks/:id', async (req, res) => {
    try {
        const trackId = req.params.id;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'Необходима авторизация' });
        }
        
        const [userRows] = await db.query('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        const user = userRows[0];
        
        // ✅ ПОЛУЧАЕМ ИНФОРМАЦИЮ О ТРЕКЕ (ВКЛЮЧАЯ ALBUM_ID)
        const [tracks] = await db.query(
            'SELECT id, user_id, file_url, cover_url, is_official, album_id FROM tracks WHERE id = ?', 
            [trackId]
        );
        
        if (tracks.length === 0) {
            return res.status(404).json({ error: 'Трек не найден' });
        }
        
        const track = tracks[0];
        const albumId = track.album_id;
        
        // Проверка прав
        if (user.is_admin === 1) {
            // Админ может удалить всё
        } else {
            if (track.is_official === 1) {
                return res.status(403).json({ error: 'Нельзя удалить официальный трек' });
            }
            if (track.user_id !== parseInt(userId)) {
                return res.status(403).json({ error: 'Вы не можете удалить этот трек' });
            }
        }
        
        // 1. УДАЛЯЕМ ФАЙЛ ТРЕКА
        const filePath = path.join(__dirname, track.file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Файл трека удален:', track.file_url);
        }
        
        // 2. УДАЛЯЕМ ОБЛОЖКУ ТРЕКА (ЕСЛИ ЕСТЬ)
        if (track.cover_url) {
            const coverPath = path.join(__dirname, track.cover_url);
            if (fs.existsSync(coverPath)) {
                fs.unlinkSync(coverPath);
                console.log('🗑️ Обложка трека удалена:', track.cover_url);
            }
        }
        
        // 3. УДАЛЯЕМ ТРЕК ИЗ БД
        await db.query('DELETE FROM tracks WHERE id = ?', [trackId]);
        console.log('🗑️ Трек удален из БД, ID:', trackId);
        
        // 4. ✅ ПРОВЕРЯЕМ, ОСТАЛИСЬ ЛИ ТРЕКИ В АЛЬБОМЕ
        if (albumId) {
            const [remainingTracks] = await db.query(
                'SELECT id FROM tracks WHERE album_id = ?', 
                [albumId]
            );
            
            // 5. ✅ ЕСЛИ ТРЕКОВ НЕ ОСТАЛОСЬ — УДАЛЯЕМ АЛЬБОМ И ЕГО ОБЛОЖКУ
            if (remainingTracks.length === 0) {
                // Получаем информацию об альбоме
                const [albums] = await db.query(
                    'SELECT cover_url FROM albums WHERE id = ?', 
                    [albumId]
                );
                
                if (albums.length > 0 && albums[0].cover_url) {
                    // Удаляем обложку альбома
                    const albumCoverPath = path.join(__dirname, albums[0].cover_url);
                    if (fs.existsSync(albumCoverPath)) {
                        fs.unlinkSync(albumCoverPath);
                        console.log('🗑️ Обложка альбома удалена:', albums[0].cover_url);
                    }
                }
                
                // Удаляем альбом из БД
                await db.query('DELETE FROM albums WHERE id = ?', [albumId]);
                console.log('🗑️ Альбом удален (не осталось треков), ID:', albumId);
            } else {
                console.log(`✅ В альбоме осталось ${remainingTracks.length} треков, обложка сохранена`);
            }
        }
        
        res.status(200).json({ message: 'Трек удалён' });
    } catch (error) {
        console.error('Ошибка удаления трека:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ =====
app.get('/api/user', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        }
        
        const [users] = await db.query('SELECT id, username FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.USER_NOT_FOUND });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ПОЛУЧИТЬ ВСЕХ ИСПОЛНИТЕЛЕЙ =====
app.get('/api/artists', async (req, res) => {
    try {
        const query = 'SELECT * FROM artists ORDER BY name'
        const [artists] = await db.query(query)
        res.status(200).json(artists)
    } catch (error) {
        console.error('Ошибка получения исполнителей:', error)
        res.status(500).json({ error: error.message })
    }
})

// ===== ПОЛУЧИТЬ ВСЕ АЛЬБОМЫ =====
app.get('/api/albums', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.*,
                ar.name AS artist_name
            FROM albums a
            LEFT JOIN artists ar ON a.artist_id = ar.id
            ORDER BY a.created_at DESC
        `
        const [albums] = await db.query(query)
        res.status(200).json(albums)
    } catch (error) {
        console.error('Ошибка получения альбомов:', error)
        res.status(500).json({ error: error.message })
    }
})

// ===== ПОЛУЧИТЬ БИОГРАФИЮ ИСПОЛНИТЕЛЯ =====
app.get('/api/artist/:name/bio', async (req, res) => {
    try {
        const artistName = decodeURIComponent(req.params.name);
        const lang = req.query.lang || 'ua';
        
        const query = `
            SELECT 
                a.id,
                a.name,
                ab.bio
            FROM artists a
            LEFT JOIN artist_bios ab ON a.id = ab.artist_id AND ab.language_code = ?
            WHERE LOWER(a.name) = LOWER(?)
        `;
        
        const [rows] = await db.query(query, [lang, artistName]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.ARTIST_NOT_FOUND });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Ошибка получения биографии:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ПОЛУЧИТЬ ДАННЫЕ ОБ ИСПОЛНИТЕЛЕ =====
app.get('/api/artist/:name', async (req, res) => {
    try {
        const artistName = decodeURIComponent(req.params.name);
        
        const query = `
            SELECT 
                id,
                name,
                avatar_url
            FROM artists
            WHERE LOWER(name) = LOWER(?)
        `;
        
        const [rows] = await db.query(query, [artistName]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.ARTIST_NOT_FOUND });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Ошибка получения исполнителя:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== УДАЛЕНИЕ ИСПОЛНИТЕЛЯ =====
app.delete('/api/artists/:id', async (req, res) => {
    try {
        const artistId = req.params.id;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        }
        
        const [userRows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.USER_NOT_FOUND });
        }
        const user = userRows[0];
        
        const [tracks] = await db.query('SELECT id, user_id, file_url, cover_url, is_official FROM tracks WHERE artist_id = ?', [artistId]);
        
        const isAdmin = user.is_admin === 1;
        const isOwner = tracks.every(t => t.user_id === parseInt(userId));
        const hasOfficial = tracks.some(t => t.is_official === 1);
        
        if (!isAdmin && (!isOwner || hasOfficial)) {
            return res.status(403).json({ error: ERROR_CODES.NO_PERMISSION_DELETE_ARTIST });
        }
        
        for (const track of tracks) {
            if (track.file_url) {
                const filePath = path.join(__dirname, track.file_url);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            if (track.cover_url) {
                const coverPath = path.join(__dirname, track.cover_url);
                if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
            }
        }
        
        await db.query('DELETE FROM tracks WHERE artist_id = ?', [artistId]);
        await db.query('DELETE FROM albums WHERE artist_id = ?', [artistId]);
        
        const [artist] = await db.query('SELECT avatar_url FROM artists WHERE id = ?', [artistId]);
        if (artist.length > 0 && artist[0].avatar_url) {
            const avatarPath = path.join(__dirname, artist[0].avatar_url);
            if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
        }
        
        await db.query('DELETE FROM artists WHERE id = ?', [artistId]);
        
        res.status(200).json({ message: ERROR_CODES.SUCCESS_ARTIST_DELETED });
    } catch (error) {
        console.error('Ошибка удаления исполнителя:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== РЕДАКТИРОВАНИЕ ИСПОЛНИТЕЛЯ =====
app.put('/api/artists/:id', async (req, res) => {
    try {
        const artistId = req.params.id;
        const { name, bio } = req.body;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        }
        
        const [userRows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.USER_NOT_FOUND });
        }
        const user = userRows[0];
        
        const [tracks] = await db.query('SELECT user_id, is_official FROM tracks WHERE artist_id = ?', [artistId]);
        const isOwner = tracks.every(t => t.user_id === parseInt(userId));
        const hasOfficial = tracks.some(t => t.is_official === 1);
        const isAdmin = user.is_admin === 1;
        
        if (!isAdmin && (!isOwner || hasOfficial)) {
            return res.status(403).json({ error: ERROR_CODES.NO_PERMISSION_EDIT_ARTIST });
        }
        
        await db.query('UPDATE artists SET name = ?, bio = ? WHERE id = ?', [name, bio || null, artistId]);
        
        res.status(200).json({ message: ERROR_CODES.SUCCESS_ARTIST_UPDATED });
    } catch (error) {
        console.error('Ошибка обновления исполнителя:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== УДАЛЕНИЕ АЛЬБОМА =====
app.delete('/api/albums/:id', async (req, res) => {
    try {
        const albumId = req.params.id;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        }
        
        const [userRows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.USER_NOT_FOUND });
        }
        const user = userRows[0];
        
        const [albumRows] = await db.query('SELECT * FROM albums WHERE id = ?', [albumId]);
        if (albumRows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.ALBUM_NOT_FOUND });
        }
        
        const [tracks] = await db.query('SELECT id, user_id, file_url, cover_url, is_official FROM tracks WHERE album_id = ?', [albumId]);
        const isOwner = tracks.every(t => t.user_id === parseInt(userId));
        const hasOfficial = tracks.some(t => t.is_official === 1);
        const isAdmin = user.is_admin === 1;
        
        if (!isAdmin && (!isOwner || hasOfficial)) {
            return res.status(403).json({ error: ERROR_CODES.NO_PERMISSION_DELETE_ALBUM });
        }
        
        for (const track of tracks) {
            if (track.file_url) {
                const filePath = path.join(__dirname, track.file_url);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            if (track.cover_url) {
                const coverPath = path.join(__dirname, track.cover_url);
                if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
            }
        }
        await db.query('DELETE FROM tracks WHERE album_id = ?', [albumId]);
        
        if (albumRows[0].cover_url) {
            const coverPath = path.join(__dirname, albumRows[0].cover_url);
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }
        
        await db.query('DELETE FROM albums WHERE id = ?', [albumId]);
        
        res.status(200).json({ message: ERROR_CODES.SUCCESS_ALBUM_DELETED });
    } catch (error) {
        console.error('Ошибка удаления альбома:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== РЕДАКТИРОВАНИЕ АЛЬБОМА =====
app.put('/api/albums/:id', async (req, res) => {
    try {
        const albumId = req.params.id;
        const { title, release_year } = req.body;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        }
        
        const [userRows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.USER_NOT_FOUND });
        }
        const user = userRows[0];
        
        const [tracks] = await db.query('SELECT user_id, is_official FROM tracks WHERE album_id = ?', [albumId]);
        const isOwner = tracks.every(t => t.user_id === parseInt(userId));
        const hasOfficial = tracks.some(t => t.is_official === 1);
        const isAdmin = user.is_admin === 1;
        
        if (!isAdmin && (!isOwner || hasOfficial)) {
            return res.status(403).json({ error: ERROR_CODES.NO_PERMISSION_EDIT_ALBUM });
        }
        
        await db.query('UPDATE albums SET title = ?, release_year = ? WHERE id = ?', [title, release_year || null, albumId]);
        
        res.status(200).json({ message: ERROR_CODES.SUCCESS_ALBUM_UPDATED });
    } catch (error) {
        console.error('Ошибка обновления альбома:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== ДОБАВЛЕНИЕ АВАТАРКИ =====
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'static/avatars/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});
const avatarUpload = multer({ 
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }
});

app.post('/api/artists/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
    try {
        const artistId = req.params.id;
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: ERROR_CODES.UNAUTHORIZED });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: ERROR_CODES.AVATAR_FILE_REQUIRED });
        }
        
        const [userRows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: ERROR_CODES.USER_NOT_FOUND });
        }
        const user = userRows[0];
        
        const [artistRows] = await db.query('SELECT * FROM artists WHERE id = ?', [artistId]);
        if (artistRows.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: ERROR_CODES.ARTIST_NOT_FOUND });
        }
        
        const [tracks] = await db.query('SELECT user_id, is_official FROM tracks WHERE artist_id = ?', [artistId]);
        const isOwner = tracks.every(t => t.user_id === parseInt(userId));
        const hasOfficial = tracks.some(t => t.is_official === 1);
        const isAdmin = user.is_admin === 1;
        
        if (!isAdmin && (!isOwner || hasOfficial)) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: ERROR_CODES.NO_PERMISSION_AVATAR });
        }
        
        if (artistRows[0].avatar_url) {
            const oldPath = path.join(__dirname, artistRows[0].avatar_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        
        const avatarUrl = `/static/avatars/${req.file.filename}`;
        await db.query('UPDATE artists SET avatar_url = ? WHERE id = ?', [avatarUrl, artistId]);
        
        res.status(200).json({ message: ERROR_CODES.SUCCESS_AVATAR_UPDATED, avatar_url: avatarUrl });
    } catch (error) {
        console.error('Ошибка загрузки аватарки:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// НОВЫЕ МАРШРУТЫ ДЛЯ HOMEPAGE
// ============================================

// 1. НЕДАВНИЕ ТРЕКИ (только от юзеров, не админов)
app.get('/api/tracks/recent-user', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.title,
                a.name AS artist,
                al.title AS album,
                t.genre,
                t.duration,
                t.release_year,
                t.file_url,
                t.cover_url,
                t.created_at,
                t.is_official,
                t.user_id,
                u.username
            FROM tracks t
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums al ON t.album_id = al.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.is_official = 0 
                AND t.user_id != 1
                AND t.user_id IS NOT NULL
            ORDER BY t.id DESC
            LIMIT 20
        `;
        const [tracks] = await db.query(query);
        res.status(200).json(tracks);
    } catch (error) {
        console.error('Ошибка получения недавних треков юзеров:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. НЕДАВНИЕ АЛЬБОМЫ (только от юзеров)
app.get('/api/albums/recent-user', async (req, res) => {
    try {
        const query = `
            SELECT 
                al.id,
                al.title,
                al.cover_url,
                al.release_year,
                al.created_at,
                ar.name AS artist,
                COUNT(t.id) AS tracks_count,
                MAX(t.user_id) AS user_id
            FROM albums al
            LEFT JOIN artists ar ON al.artist_id = ar.id
            LEFT JOIN tracks t ON t.album_id = al.id
            WHERE t.is_official = 0 
                AND t.user_id != 1
                AND t.user_id IS NOT NULL
            GROUP BY al.id
            ORDER BY al.id DESC
            LIMIT 20
        `;
        const [albums] = await db.query(query);
        res.status(200).json(albums);
    } catch (error) {
        console.error('Ошибка получения недавних альбомов юзеров:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. НЕДАВНИЕ ИСПОЛНИТЕЛИ (только от юзеров)
app.get('/api/artists/recent-user', async (req, res) => {
    try {
        const query = `
            SELECT 
                ar.id,
                ar.name,
                ar.avatar_url,
                ar.created_at,
                COUNT(t.id) AS tracks_count,
                MAX(t.user_id) AS user_id
            FROM artists ar
            LEFT JOIN tracks t ON t.artist_id = ar.id
            WHERE t.is_official = 0 
                AND t.user_id != 1
                AND t.user_id IS NOT NULL
            GROUP BY ar.id
            ORDER BY ar.id DESC
            LIMIT 20
        `;
        const [artists] = await db.query(query);
        res.status(200).json(artists);
    } catch (error) {
        console.error('Ошибка получения недавних исполнителей юзеров:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. ПОПУЛЯРНЫЕ ТРЕКИ (только админ)
app.get('/api/tracks/popular', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.title,
                a.name AS artist,
                al.title AS album,
                t.genre,
                t.duration,
                t.release_year,
                t.file_url,
                t.cover_url,
                t.plays_count,
                t.likes,
                t.is_official,
                t.user_id
            FROM tracks t
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums al ON t.album_id = al.id
            WHERE t.is_official = 1
                OR t.user_id = 1
            ORDER BY t.plays_count DESC, t.id DESC
            LIMIT 20
        `;
        const [tracks] = await db.query(query);
        res.status(200).json(tracks);
    } catch (error) {
        console.error('Ошибка получения популярных треков:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. ПОПУЛЯРНЫЕ АЛЬБОМЫ (только админ)
app.get('/api/albums/popular', async (req, res) => {
    try {
        const query = `
            SELECT 
                al.id,
                al.title,
                al.cover_url,
                al.release_year,
                ar.name AS artist,
                COUNT(t.id) AS tracks_count,
                SUM(t.plays_count) AS total_plays
            FROM albums al
            LEFT JOIN artists ar ON al.artist_id = ar.id
            LEFT JOIN tracks t ON t.album_id = al.id
            WHERE t.is_official = 1
                OR t.user_id = 1
            GROUP BY al.id
            ORDER BY total_plays DESC, al.id DESC
            LIMIT 20
        `;
        const [albums] = await db.query(query);
        res.status(200).json(albums);
    } catch (error) {
        console.error('Ошибка получения популярных альбомов:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. ПОПУЛЯРНЫЕ ИСПОЛНИТЕЛИ (только админ)
app.get('/api/artists/popular', async (req, res) => {
    try {
        const query = `
            SELECT 
                ar.id,
                ar.name,
                ar.avatar_url,
                COUNT(t.id) AS tracks_count,
                SUM(t.plays_count) AS total_plays
            FROM artists ar
            LEFT JOIN tracks t ON t.artist_id = ar.id
            WHERE t.is_official = 1
                OR t.user_id = 1
            GROUP BY ar.id
            ORDER BY total_plays DESC, ar.id DESC
            LIMIT 20
        `;
        const [artists] = await db.query(query);
        res.status(200).json(artists);
    } catch (error) {
        console.error('Ошибка получения популярных исполнителей:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server started on port 3000"))