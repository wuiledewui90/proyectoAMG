-- DropForeignKey
ALTER TABLE `ErpSaleItem` DROP FOREIGN KEY `ErpSaleItem_productId_fkey`;

-- AlterTable
ALTER TABLE `ErpSaleItem` MODIFY `productId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ErpSaleItem` ADD CONSTRAINT `ErpSaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
