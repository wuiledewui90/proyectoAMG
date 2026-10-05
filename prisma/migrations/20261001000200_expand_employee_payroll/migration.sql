-- AlterTable
ALTER TABLE `Employee`
  ADD COLUMN `paymentFrequency` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN `hoursPerDay` DECIMAL(5, 2) NOT NULL DEFAULT 8,
  ADD COLUMN `workDaysPerWeek` DECIMAL(4, 2) NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE `EmployeePayroll`
  ADD COLUMN `adjustmentAdditions` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `adjustmentDeductions` DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `EmployeeAdjustment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `employeeId` INTEGER NOT NULL,
  `payrollId` INTEGER NULL,
  `type` VARCHAR(30) NOT NULL,
  `impact` VARCHAR(20) NOT NULL DEFAULT 'DEDUCTION',
  `eventDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NULL,
  `quantity` DECIMAL(8, 2) NOT NULL DEFAULT 1,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'AMOUNT',
  `unitValue` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `description` VARCHAR(500) NULL,
  `settled` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `EmployeeAdjustment_employee_date_idx`(`employeeId`, `eventDate`),
  INDEX `EmployeeAdjustment_payroll_idx`(`payrollId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmployeeAdjustment`
  ADD CONSTRAINT `EmployeeAdjustment_employeeId_fkey`
  FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeAdjustment`
  ADD CONSTRAINT `EmployeeAdjustment_payrollId_fkey`
  FOREIGN KEY (`payrollId`) REFERENCES `EmployeePayroll`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
