const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'b0zk9jti9thx6un2mqhf-mysql.services.clever-cloud.com',
    user: 'uv9lylzu36pyxp0v',
    password: 'ghLetKJZBFR7smboyInd',
    database: 'b0zk9jti9thx6un2mqhf',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
    ssl: {
        rejectUnauthorized: false
    }
});

(async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log('Clever Cloud connected');
        connection.release();
    } catch (error) {
        console.error('Failed to connect Database', error.message);
    }
})();

module.exports = db;
