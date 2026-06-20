const express = require("express")
const multer = require("multer");
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const db = require("./db.js")

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
        }
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueName + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage })

// ===== 4. МАРШРУТЫ (все app.get / app.post должны быть ЗДЕСЬ) =====

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
        const query = 'SELECT * FROM tracks ORDER BY id DESC'
        const [tracks] = await db.query(query)
        res.status(200).json(tracks)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
})

// Загрузить трек
app.post('/api/tracks', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, artist, album, genre, release_year } = req.body
        const audioFile = req.files['audio'] ? req.files['audio'][0] : null
        const coverFile = req.files['cover'] ? req.files['cover'][0] : null
        
        if (!audioFile) {
            return res.status(400).json({ error: 'Аудиофайл обязателен' })
        }
        
        const fileUrl = `/static/songs/${audioFile.filename}`
        const coverUrl = coverFile ? `/static/covers/${coverFile.filename}` : ''
        
        const query = 'INSERT INTO tracks (title, artist, album, genre, release_year, file_url, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
        const [result] = await db.query(query, [title, artist, album, genre, release_year, fileUrl, coverUrl])
        
        res.status(201).json({ 
            message: 'Трек загружен!', 
            id: result.insertId,
            fileUrl: fileUrl,
            coverUrl: coverUrl
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
})

// Стриминг
app.get('/api/stream/:id', async (req, res) => {
    try {
        const trackId = req.params.id
        const [tracks] = await db.query('SELECT file_url FROM tracks WHERE id = ?', [trackId])
        
        if (tracks.length === 0) {
            return res.status(404).json({ error: 'Трек не найден' })
        }
        
        const filePath = path.join(__dirname, tracks[0].file_url)
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Файл не найден' })
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

// ===== НОВЫЕ МАРШРУТЫ ДЛЯ ПОИСКА (Level 3) =====
app.get('/api/tracks/search', async (req, res) => {
    try {
        const { query, genre } = req.query;
        let sql = 'SELECT * FROM tracks WHERE 1=1';
        const params = [];
        
        if (query && query.trim() !== '') {
            sql += ' AND (title LIKE ? OR artist LIKE ?)';
            const searchTerm = `%${query.trim()}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (genre && genre !== 'all') {
            sql += ' AND genre = ?';
            params.push(genre);
        }
        
        sql += ' ORDER BY id DESC';
        
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

// ===== 5. ЗАПУСК СЕРВЕРА (в самом конце!) =====
app.listen(3000, () => console.log("Server started on port 3000"))