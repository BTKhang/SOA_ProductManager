-- Database: order_service_db
-- Service: Order Service

CREATE DATABASE IF NOT EXISTS `order_service_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `order_service_db`;

CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    INDEX `idx_order_id` (`order_id`),
    CONSTRAINT `fk_order_items_order`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample seed data
INSERT INTO `orders` (`id`, `customer_name`, `customer_email`, `total_amount`, `status`) VALUES
(1, 'Nguyen Van A', 'nguyenvana@gmail.com', 34650000.00, 'completed'),
(2, 'Tran Thi B', 'tranthib@gmail.com', 2150000.00, 'pending')
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 1, 'Laptop Dell XPS 15', 1, 32500000.00, 32500000.00),
(2, 1, 3, 'Bàn phím cơ Keychron K2 Pro', 1, 2150000.00, 2150000.00),
(3, 2, 3, 'Bàn phím cơ Keychron K2 Pro', 1, 2150000.00, 2150000.00)
ON DUPLICATE KEY UPDATE `id`=`id`;
