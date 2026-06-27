const mysql = require('mysql2/promise');
const env = require('dotenv').config().parsed;

const db = mysql.createPool({
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'music_db',
    port: env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000,
    ssl: {
        rejectUnauthorized: false,

        minVersion: 'TLSv1.2'
    },
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// тест 
(async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log('database connected');
        connection.release();
    } catch (error) {
        console.error('Failed to connect database', error.message);
        console.error('Check yuor values:');
        console.error('DB_HOST:', process.env.DB_HOST || env.DB_HOST);
        console.error('DB_USER:', process.env.DB_USER || env.DB_USER);
        console.error('DB_NAME:', process.env.DB_NAME || env.DB_NAME);
    }
})();

module.exports = db;
