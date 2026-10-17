-- Database: auth_service_db
-- Service: Auth Service

CREATE DATABASE IF NOT EXISTS `auth_service_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `auth_service_db`;

CREATE TABLE IF NOT EXISTS `User` (
    `IdUser` INT AUTO_INCREMENT PRIMARY KEY,
    `UserName` VARCHAR(255) NOT NULL UNIQUE,
    `Password` VARCHAR(255) NOT NULL,
    `Token` TEXT NULL,
    `TwoFactorCode` VARCHAR(10) NULL,
    `TwoFactorExpires` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `User` (`UserName`, `Password`) VALUES
('admin', '123456'),
('user1', '123456')
ON DUPLICATE KEY UPDATE `UserName`=`UserName`;
