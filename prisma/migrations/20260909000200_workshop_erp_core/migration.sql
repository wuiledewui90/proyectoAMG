CREATE TABLE `ErpUser` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `username` VARCHAR(80) NOT NULL,
    `passwordHash` VARCHAR(60) NOT NULL,
    `role` ENUM('ADMIN', 'SALES', 'TECHNICIAN', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ErpUser_username_key`(`username`),
    INDEX `ErpUser_active_role_idx`(`active`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(191) NULL,
    `taxId` VARCHAR(40) NULL,
    `address` VARCHAR(255) NULL,
    `vehiclePlate` VARCHAR(20) NULL,
    `vehicleBrand` VARCHAR(80) NULL,
    `vehicleModel` VARCHAR(120) NULL,
    `vehicleYear` INTEGER NULL,
    `notes` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `Customer_name_idx`(`name`),
    INDEX `Customer_phone_idx`(`phone`),
    INDEX `Customer_vehiclePlate_idx`(`vehiclePlate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ErpSale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NULL,
    `createdById` VARCHAR(191) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `paymentMethod` ENUM('CASH', 'TRANSFER', 'CARD', 'CURRENT_ACCOUNT') NOT NULL,
    `status` ENUM('COMPLETED', 'VOID') NOT NULL DEFAULT 'COMPLETED',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ErpSale_createdAt_idx`(`createdAt`),
    INDEX `ErpSale_customerId_idx`(`customerId`),
    INDEX `ErpSale_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ErpSaleItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `saleId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    INDEX `ErpSaleItem_saleId_idx`(`saleId`),
    INDEX `ErpSaleItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WorkOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NULL,
    `assignedToId` VARCHAR(191) NULL,
    `vehiclePlate` VARCHAR(20) NOT NULL,
    `vehicleDescription` VARCHAR(191) NULL,
    `problem` TEXT NOT NULL,
    `diagnosis` TEXT NULL,
    `workPerformed` TEXT NULL,
    `partsCost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `laborCost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'DIAGNOSIS', 'WAITING_PARTS', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `estimatedDelivery` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `WorkOrder_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `WorkOrder_vehiclePlate_idx`(`vehiclePlate`),
    INDEX `WorkOrder_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ErpExpense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paymentMethod` ENUM('CASH', 'TRANSFER', 'CARD', 'CURRENT_ACCOUNT') NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `expenseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ErpExpense_expenseDate_idx`(`expenseDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StockMovement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `type` ENUM('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'WORK_ORDER') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `previousStock` INTEGER NOT NULL,
    `newStock` INTEGER NOT NULL,
    `referenceId` VARCHAR(80) NULL,
    `notes` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `StockMovement_product_created_idx`(`productId`, `createdAt`),
    INDEX `StockMovement_type_created_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ErpSale` ADD CONSTRAINT `ErpSale_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ErpSale` ADD CONSTRAINT `ErpSale_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ErpSaleItem` ADD CONSTRAINT `ErpSaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `ErpSale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ErpSaleItem` ADD CONSTRAINT `ErpSaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ErpExpense` ADD CONSTRAINT `ErpExpense_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
