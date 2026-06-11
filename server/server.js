// ============================================================
// 1. ПОДКЛЮЧЕНИЕ БИБЛИОТЕК (самая первая строка файла)
// ============================================================
const express = require("express")
const multer = require("multer");
const cors = require("cors")
const path = require("path")      // ДОБАВИТЬ: для работы с путями к файлам
const fs = require("fs")          // ДОБАВИТЬ: для чтения файлов (стриминг)
const db = require("./db.js")

// ============================================================
// 2. СОЗДАНИЕ ПРИЛОЖЕНИЯ EXPRESS
// ============================================================
const app = express();

// ============================================================
// 3. НАСТРОЙКА CORS (разрешаем фронтенду общаться с сервером)
// ============================================================
app.use(cors({
    origin: "*",
    allowedHeaders: "*",
    methods: "*"
}))

// ============================================================
// 4. РАЗДАЧА СТАТИЧЕСКИХ ФАЙЛОВ (чтобы фронт мог видеть mp3 и картинки)
// ============================================================
app.use("/static", express.static(path.join(__dirname, "static")))

// ============================================================
// 5. НАСТРОЙКА ДЛЯ ПАРСИНГА JSON И ФОРМ
// ============================================================
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// ============================================================
// 6. НАСТРОЙКА MULTER (для загрузки файлов)
// ============================================================
const storage = multer.diskStorage({
    // Куда сохранять файлы в зависимости от поля
    destination: function (req, file, cb) {
        // Если поле называется "audio" - сохраняем в static/songs/
        if (file.fieldname === 'audio') {
            cb(null, 'static/songs/')
        } 
        // Если поле называется "cover" - сохраняем в static/covers/
        else if (file.fieldname === 'cover') {
            cb(null, 'static/covers/')
        }
    },
    // Как называть файлы (уникальное имя)
    filename: function (req, file, cb) {
        // Создаём уникальное имя: время_миллисекунд + случайное число + расширение
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueName + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

// ============================================================
// 7. МАРШРУТЫ (API)
// ============================================================

// ---------- 7.1. ПРОВЕРОЧНЫЙ МАРШРУТ (уже был у вас) ----------
app.get("/", async (req, res) => {
    try {
        let [result, _] = await db.query("SHOW TABLES")
        res.status(200).json(result)
    } catch (error) {
        res.status(500).send(error.message)
        console.log(error)
    }
})

// ---------- 7.2. ПОЛУЧИТЬ ВСЕ ТРЕКИ (НОВЫЙ) ----------
// Как это работает: фронт отправляет GET запрос на /api/tracks
// Сервер достаёт из базы все треки и отправляет обратно в формате JSON
app.get('/api/tracks', async (req, res) => {
    try {
        // Запрос: выбрать всё из таблицы tracks, сортируя от новых к старым
        const query = 'SELECT * FROM tracks ORDER BY id DESC'
        const [tracks] = await db.query(query)
        
        // Отправляем массив треков обратно на фронтенд
        res.status(200).json(tracks)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
})

// ---------- 7.3. ЗАГРУЗИТЬ НОВЫЙ ТРЕК (НОВЫЙ) ----------
// Как это работает: фронт отправляет POST запрос с form-data (текст + файлы)
// Сервер сохраняет файлы, записывает информацию в базу
app.post('/api/tracks', upload.fields([
    { name: 'audio', maxCount: 1 },   // ждём файл в поле "audio"
    { name: 'cover', maxCount: 1 }    // ждём файл в поле "cover"
]), async (req, res) => {
    try {
        // Получаем текстовые поля из формы
        const { title, author } = req.body
        
        // Получаем загруженные файлы
        const audioFile = req.files['audio'] ? req.files['audio'][0] : null
        const coverFile = req.files['cover'] ? req.files['cover'][0] : null
        
        // Проверяем: аудиофайл обязателен
        if (!audioFile) {
            return res.status(400).json({ error: 'Аудиофайл обязателен' })
        }
        
        // Формируем URL для доступа к файлам (как их будет видеть браузер)
        const fileUrl = `/static/songs/${audioFile.filename}`
        const coverUrl = coverFile ? `/static/covers/${coverFile.filename}` : ''
        
        // Сохраняем информацию о треке в базу данных
        const query = 'INSERT INTO tracks (title, author, file_url, cover_url) VALUES (?, ?, ?, ?)'
        const [result] = await db.query(query, [title, author, fileUrl, coverUrl])
        
        // Отправляем успешный ответ
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

// ---------- 7.4. СТРИМИНГ АУДИО (для воспроизведения) ----------
// Как это работает: фронт отправляет GET запрос на /api/stream/123 (где 123 - id трека)
// Сервер находит файл в базе и отдаёт его порциями (позволяет перематывать)
app.get('/api/stream/:id', async (req, res) => {
    try {
        const trackId = req.params.id
        
        // Находим путь к файлу в базе данных
        const [tracks] = await db.query('SELECT file_url FROM tracks WHERE id = ?', [trackId])
        
        // Если трек не найден
        if (tracks.length === 0) {
            return res.status(404).json({ error: 'Трек не найден' })
        }
        
        // Собираем полный путь к файлу на диске
        const filePath = path.join(__dirname, tracks[0].file_url)
        
        // Проверяем, существует ли файл
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Файл не найден' })
        }
        
        // Получаем размер файла
        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        
        // Читаем заголовок Range (браузер отправляет его при перемотке)
        const range = req.headers.range
        
        if (range) {
            // Если браузер просит только часть файла (для перемотки)
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            const chunksize = (end - start) + 1
            
            // Открываем файл только с позиции start до end
            const file = fs.createReadStream(filePath, { start, end })
            
            // Отправляем ответ с кодом 206 (частичное содержимое)
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
            })
            
            file.pipe(res)
        } else {
            // Если браузер просит весь файл (первое воспроизведение)
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

// ============================================================
// 8. ЗАПУСК СЕРВЕРА
// ============================================================
app.listen(3000, () => console.log("Server started on port 3000"))