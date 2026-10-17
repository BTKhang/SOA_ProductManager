const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306
};

const dbName = process.env.PRODUCT_DB_NAME || (process.env.DB_NAME && process.env.DB_NAME !== 'auth_service_db' ? process.env.DB_NAME : 'product_service_db');

// Tự động kiểm tra và khởi tạo Database + Bảng products nếu chưa có
const initDatabase = async () => {
    try {
        const rootConn = await mysql.createConnection({
            ...dbConfig,
            charset: 'utf8mb4'
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.query(`USE \`${dbName}\``);

        await rootConn.query(`
            CREATE TABLE IF NOT EXISTS \`products\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`name\` VARCHAR(255) NOT NULL,
                \`description\` TEXT NULL,
                \`image\` VARCHAR(500) NULL,
                \`price\` DECIMAL(10, 2) NOT NULL,
                \`quantity\` INT NOT NULL DEFAULT 0,
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Đảm bảo có cột image nếu bảng đã tạo từ trước
        try {
            await rootConn.query('ALTER TABLE `products` ADD COLUMN `image` VARCHAR(500) NULL AFTER `description`');
        } catch (e) {
            // Đã tồn tại cột image
        }

        // Thêm dữ liệu mẫu ban đầu nếu bảng đang trống
        const [countResult] = await rootConn.query('SELECT COUNT(*) as count FROM `products`');
        if (countResult[0].count === 0) {
            const seedProducts = [
                ['Laptop Dell XPS 15', 'Laptop cao cấp mỏng nhẹ, CPU Intel Core i7, RAM 16GB, SSD 512GB', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500', 32500000.00, 15],
                ['iPhone 15 Pro Max 256GB', 'Flagship Apple, chip A17 Pro, khung viền titan tự nhiên', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500', 29990000.00, 30],
                ['Bàn phím cơ Keychron K2 Pro', 'Bàn phím cơ không dây Bluetooth/Type-C, switch G Pro Red', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 2150000.00, 50],
                ['Màn hình Dell UltraSharp U2723QE', 'Màn hình 27 inch 4K IPS Black chuyên đồ họa', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', 12890000.00, 10],
                ['Chuột Logitech MX Master 3S', 'Chuột công thái học cao cấp, cảm biến 8K DPI', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', 2290000.00, 45]
            ];

            for (const p of seedProducts) {
                await rootConn.query('INSERT INTO `products` (`name`, `description`, `image`, `price`, `quantity`) VALUES (?, ?, ?, ?, ?)', p);
            }
        }

        await rootConn.end();
        console.log(`Connected to MySQL database: ${dbName}`);
    } catch (err) {
        console.error('Database connection error:', err.message);
    }
};

initDatabase();

// Pool kết nối chính cho ứng dụng
const pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

module.exports = pool;
