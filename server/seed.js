const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    console.log('🗑️ Очищаю таблицу...');
    await db.execute('DELETE FROM tracks');
    
    console.log('🔄 Сбрасываю счётчик...');
    await db.execute('ALTER TABLE tracks AUTO_INCREMENT = 1');
    
    console.log('📀 Добавляю треки...');
    await db.execute(`
        INSERT INTO tracks (title, artist, album, genre, release_year, file_url, cover_url) VALUES
        ('Спокойная ночь', 'Кино', 'Последний герой', 'Rock', 1989, '/static/songs/kino1.mp3', '/static/covers/kino1.jpg'),
        ('Smells Like Teen Spirit', 'Nirvana', 'Nevermind', 'Rock', 1991, '/static/songs/nirvana1.mp3', '/static/covers/nirvana1.jpg'),
        ('The Fire Is Gone', 'Heaven Pierce Her', 'ULTRAKILL OST', 'Soundtrack', 2020, '/static/songs/ultrakill1.mp3', '/static/covers/ultrakill1.jpg')
    `);
    
    const [tracks] = await db.execute('SELECT * FROM tracks');
    console.log('✅ Готово! Треков в базе:', tracks.length);
    console.table(tracks);
    
    await db.end();
}

seedDatabase().catch(console.error);