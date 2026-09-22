-- CreateTable
CREATE TABLE `ErpDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('QUOTE', 'INVOICE') NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'ISSUED', 'PAID', 'VOID') NOT NULL DEFAULT 'DRAFT',
    `customerId` INTEGER NULL,
    `createdById` VARCHAR(191) NULL,
    `sourceDocumentId` INTEGER NULL,
    `customerName` VARCHAR(160) NOT NULL,
    `customerTaxId` VARCHAR(40) NULL,
    `customerPhone` VARCHAR(40) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerAddress` VARCHAR(255) NULL,
    `vehicleDescription` VARCHAR(191) NULL,
    `vehiclePlate` VARCHAR(20) NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `notes` TEXT NULL,
    `terms` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ErpDocument_type_issueDate_idx`(`type`, `issueDate`),
    INDEX `ErpDocument_status_issueDate_idx`(`status`, `issueDate`),
    INDEX `ErpDocument_customerId_idx`(`customerId`),
    INDEX `ErpDocument_sourceDocumentId_idx`(`sourceDocumentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ErpDocumentItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,

    INDEX `ErpDocumentItem_documentId_idx`(`documentId`),
    INDEX `ErpDocumentItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ErpDocument` ADD CONSTRAINT `ErpDocument_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ErpDocument` ADD CONSTRAINT `ErpDocument_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ErpDocument` ADD CONSTRAINT `ErpDocument_sourceDocumentId_fkey` FOREIGN KEY (`sourceDocumentId`) REFERENCES `ErpDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ErpDocumentItem` ADD CONSTRAINT `ErpDocumentItem_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `ErpDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ErpDocumentItem` ADD CONSTRAINT `ErpDocumentItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
