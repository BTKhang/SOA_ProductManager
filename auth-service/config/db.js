const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306
};

const dbName = process.env.AUTH_DB_NAME || 'auth_service_db';

// Tự động kiểm tra và khởi tạo Database + Bảng User nếu chưa có
const initDatabase = async () => {
    try {
        const rootConn = await mysql.createConnection({
            ...dbConfig,
            charset: 'utf8mb4'
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.query(`USE \`${dbName}\``);

        await rootConn.query(`
            CREATE TABLE IF NOT EXISTS \`User\` (
                \`IdUser\` INT AUTO_INCREMENT PRIMARY KEY,
                \`UserName\` VARCHAR(255) NOT NULL UNIQUE,
                \`Password\` VARCHAR(255) NOT NULL,
                \`Token\` TEXT NULL,
                \`TwoFactorCode\` VARCHAR(10) NULL,
                \`TwoFactorExpires\` DATETIME NULL,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Đảm bảo có các cột 2FA nếu bảng đã tạo từ trước
        try {
            await rootConn.query('ALTER TABLE `User` ADD COLUMN `TwoFactorCode` VARCHAR(10) NULL');
        } catch (e) {}
        try {
            await rootConn.query('ALTER TABLE `User` ADD COLUMN `TwoFactorExpires` DATETIME NULL');
        } catch (e) {}

        // Thêm tài khoản admin mặc định nếu chưa có
        const [existingAdmin] = await rootConn.query('SELECT IdUser FROM `User` WHERE `UserName` = ?', ['admin']);
        if (existingAdmin.length === 0) {
            await rootConn.query('INSERT INTO `User` (`UserName`, `Password`) VALUES (?, ?)', ['admin', '123456']);
        }

        await rootConn.end();
        console.log(`Connected to MySQL database: ${dbName}`);
    } catch (err) {
        console.error('Auth Service DB connection error:', err.message);
    }
};

initDatabase();

// Pool kết nối chính
const pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

module.exports = pool;
