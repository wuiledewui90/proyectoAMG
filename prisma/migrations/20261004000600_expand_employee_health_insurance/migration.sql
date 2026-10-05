ALTER TABLE `Employee`
  ADD COLUMN `healthInsuranceMemberNumber` VARCHAR(80) NULL,
  ADD COLUMN `companyPaysHealthInsurance` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `healthInsuranceAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0;
