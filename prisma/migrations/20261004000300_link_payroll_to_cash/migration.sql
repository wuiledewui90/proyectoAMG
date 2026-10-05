ALTER TABLE `EmployeePayroll`
  ADD COLUMN `paymentMethod` VARCHAR(20) NULL,
  ADD COLUMN `cashMovementId` INTEGER NULL;

CREATE UNIQUE INDEX `EmployeePayroll_cashMovementId_key`
  ON `EmployeePayroll`(`cashMovementId`);

ALTER TABLE `EmployeePayroll`
  ADD CONSTRAINT `EmployeePayroll_cashMovementId_fkey`
  FOREIGN KEY (`cashMovementId`) REFERENCES `CashMovement`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
