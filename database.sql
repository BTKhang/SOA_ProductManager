-- Cơ sở dữ liệu: product_service_db
-- Dịch vụ: Quản lý sản phẩm (Product Service)

CREATE DATABASE IF NOT EXISTS `product_service_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `product_service_db`;

CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`name`, `description`, `image`, `price`, `quantity`) VALUES
('Laptop Dell XPS 15', 'Laptop cao cấp mỏng nhẹ, CPU Intel Core i7, RAM 16GB, SSD 512GB', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60', 32500000.00, 15),
('iPhone 15 Pro Max 256GB', 'Flagship Apple, chip A17 Pro, khung viền titan tự nhiên, camera 48MP', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60', 29990000.00, 30),
('Bàn phím cơ Keychron K2 Pro', 'Bàn phím cơ không dây Bluetooth/Type-C, switch Gateron G Pro Red', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', 2150000.00, 50),
('Màn hình Dell UltraSharp U2723QE', 'Màn hình 27 inch 4K IPS Black chuyên đồ họa và lập trình', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60', 12890000.00, 10),
('Chuột Logitech MX Master 3S', 'Chuột công thái học cao cấp, cảm biến 8K DPI, con lăn MagSpeed', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60', 2290000.00, 45)
ON DUPLICATE KEY UPDATE `name`=`name`;
