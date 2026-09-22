-- AlterTable
ALTER TABLE `ErpSale`
MODIFY `paymentMethod` ENUM('CASH', 'TRANSFER', 'CARD', 'CURRENT_ACCOUNT', 'COMBINED') NOT NULL;

-- AlterTable
ALTER TABLE `ErpExpense`
MODIFY `paymentMethod` ENUM('CASH', 'TRANSFER', 'CARD', 'CURRENT_ACCOUNT', 'COMBINED') NOT NULL;

-- CreateTable
CREATE TABLE `ErpSalePayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `saleId` INTEGER NOT NULL,
    `method` ENUM('CASH', 'TRANSFER', 'CARD', 'CURRENT_ACCOUNT', 'COMBINED') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ErpSalePayment_saleId_idx`(`saleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ErpSalePayment` ADD CONSTRAINT `ErpSalePayment_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `ErpSale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
