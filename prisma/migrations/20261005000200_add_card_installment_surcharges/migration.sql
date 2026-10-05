ALTER TABLE `ErpSetting`
  ADD COLUMN `cardInstallmentRates` JSON NULL;

ALTER TABLE `ErpSale`
  ADD COLUMN `cardInstallments` INTEGER NULL,
  ADD COLUMN `cardSurchargeRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `cardSurchargeAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0;
