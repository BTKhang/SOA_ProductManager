const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306
};

const dbName = process.env.DB_NAME || 'order_service_db';

const initDatabase = async () => {
    try {
        const rootConn = await mysql.createConnection({
            ...dbConfig,
            charset: 'utf8mb4'
        });

        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.query(`USE \`${dbName}\``);

        await rootConn.query(`
            CREATE TABLE IF NOT EXISTS \`orders\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`customer_name\` VARCHAR(255) NOT NULL,
                \`customer_email\` VARCHAR(255) NOT NULL,
                \`total_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                \`status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await rootConn.query(`
            CREATE TABLE IF NOT EXISTS \`order_items\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`order_id\` INT NOT NULL,
                \`product_id\` INT NOT NULL,
                \`product_name\` VARCHAR(255) NOT NULL,
                \`quantity\` INT NOT NULL,
                \`unit_price\` DECIMAL(10, 2) NOT NULL,
                \`total_price\` DECIMAL(10, 2) NOT NULL,
                INDEX \`idx_order_id\` (\`order_id\`),
                CONSTRAINT \`fk_order_items_order\`
                    FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Nạp dữ liệu mẫu ban đầu nếu bảng orders đang trống
        const [countResult] = await rootConn.query('SELECT COUNT(*) as count FROM `orders`');
        if (countResult[0].count === 0) {
            const [order1] = await rootConn.query(
                'INSERT INTO `orders` (customer_name, customer_email, total_amount, status) VALUES (?, ?, ?, ?)',
                ['Nguyễn Văn A', 'nguyenvana@gmail.com', 34650000.00, 'completed']
            );
            await rootConn.query(
                'INSERT INTO `order_items` (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                [order1.insertId, 1, 'Laptop Dell XPS 15', 1, 32500000.00, 32500000.00]
            );
            await rootConn.query(
                'INSERT INTO `order_items` (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                [order1.insertId, 3, 'Bàn phím cơ Keychron K2 Pro', 1, 2150000.00, 2150000.00]
            );

            const [order2] = await rootConn.query(
                'INSERT INTO `orders` (customer_name, customer_email, total_amount, status) VALUES (?, ?, ?, ?)',
                ['Trần Thị B', 'tranthib@gmail.com', 2150000.00, 'pending']
            );
            await rootConn.query(
                'INSERT INTO `order_items` (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                [order2.insertId, 3, 'Bàn phím cơ Keychron K2 Pro', 1, 2150000.00, 2150000.00]
            );
        }

        await rootConn.end();
        console.log(`Connected to MySQL database: ${dbName}`);
    } catch (err) {
        console.error('Order service DB connection error:', err.message);
    }
};

initDatabase();

const pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

module.exports = pool;
