-- Foodzie MySQL Schema
-- Import this SQL file into your phpMyAdmin database to set up the tables.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `OrderItem`;
DROP TABLE IF EXISTS `Order`;
DROP TABLE IF EXISTS `FoodItem`;
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `University`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. University Table
CREATE TABLE `University` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Table
CREATE TABLE `User` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `profilePicUrl` VARCHAR(255) NULL,
    `role` ENUM('Student', 'Vendor', 'Delivery') NOT NULL DEFAULT 'Student',
    `universityId` VARCHAR(36) NULL,
    `vendorDescription` TEXT NULL,
    `vendorUpi` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`universityId`) REFERENCES `University`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Category Table
CREATE TABLE `Category` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `vendorId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`vendorId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. FoodItem Table
CREATE TABLE `FoodItem` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `price` DOUBLE NOT NULL,
    `imageUrl` VARCHAR(255) NULL,
    `prepTimeMins` INT NOT NULL DEFAULT 15,
    `isCooked` TINYINT(1) NOT NULL DEFAULT 1,
    `stock` INT NULL,
    `isVegetarian` TINYINT(1) NOT NULL DEFAULT 1,
    `discountPercent` DOUBLE NULL,
    `discountStart` DATETIME(3) NULL,
    `discountEnd` DATETIME(3) NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Order Table
CREATE TABLE `Order` (
    `id` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `vendorId` VARCHAR(36) NOT NULL,
    `deliveryPersonId` VARCHAR(36) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('Pending', 'Confirmed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `deliveryAddress` VARCHAR(255) NOT NULL,
    `isCOD` TINYINT(1) NOT NULL DEFAULT 0,
    `paymentReceived` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`vendorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`deliveryPersonId`) REFERENCES `User`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. OrderItem Table
CREATE TABLE `OrderItem` (
    `id` VARCHAR(36) NOT NULL,
    `orderId` VARCHAR(36) NOT NULL,
    `foodItemId` VARCHAR(36) NOT NULL,
    `quantity` INT NOT NULL,
    `priceAtTime` DOUBLE NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`foodItemId`) REFERENCES `FoodItem`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
