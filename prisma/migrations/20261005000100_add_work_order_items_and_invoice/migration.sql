ALTER TABLE `WorkOrder`
  ADD COLUMN `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `invoiceDocumentId` INTEGER NULL;

CREATE TABLE `WorkOrderItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `workOrderId` INTEGER NOT NULL,
  `productId` INTEGER NULL,
  `kind` VARCHAR(20) NOT NULL DEFAULT 'PART',
  `description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unitPrice` DECIMAL(12, 2) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `WorkOrderItem_workOrderId_idx` (`workOrderId`),
  INDEX `WorkOrderItem_productId_idx` (`productId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WorkOrderItem_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `WorkOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `WorkOrder_invoiceDocumentId_idx` ON `WorkOrder`(`invoiceDocumentId`);

ALTER TABLE `WorkOrder`
  ADD CONSTRAINT `WorkOrder_invoiceDocumentId_fkey` FOREIGN KEY (`invoiceDocumentId`) REFERENCES `ErpDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
