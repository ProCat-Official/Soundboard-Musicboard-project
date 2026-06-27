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
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = db;
