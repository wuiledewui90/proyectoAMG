-- Additive audit trail for sale cancellations.
ALTER TABLE `ErpSale`
  ADD COLUMN `voidedById` VARCHAR(191) NULL,
  ADD COLUMN `voidReason` VARCHAR(500) NULL,
  ADD COLUMN `voidedAt` DATETIME(3) NULL;

CREATE INDEX `ErpSale_voidedById_idx` ON `ErpSale`(`voidedById`);

ALTER TABLE `ErpSale`
  ADD CONSTRAINT `ErpSale_voidedById_fkey`
  FOREIGN KEY (`voidedById`) REFERENCES `ErpUser`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
