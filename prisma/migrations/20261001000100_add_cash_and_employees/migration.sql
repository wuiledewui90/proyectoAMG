-- Caja diaria y movimientos manuales
CREATE TABLE `CashSession` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `businessDate` VARCHAR(10) NOT NULL,
  `openingBalance` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `openedById` VARCHAR(191) NULL,
  `closedById` VARCHAR(191) NULL,
  `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `closedAt` DATETIME(3) NULL,
  `totalIncome` DECIMAL(12,2) NULL,
  `totalExpense` DECIMAL(12,2) NULL,
  `cashIncome` DECIMAL(12,2) NULL,
  `cashExpense` DECIMAL(12,2) NULL,
  `expectedCash` DECIMAL(12,2) NULL,
  `countedCash` DECIMAL(12,2) NULL,
  `difference` DECIMAL(12,2) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CashSession_businessDate_key`(`businessDate`),
  INDEX `CashSession_closedAt_idx`(`closedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CashMovement` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sessionId` INTEGER NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `paymentMethod` ENUM('CASH','TRANSFER','CARD','CURRENT_ACCOUNT','COMBINED') NOT NULL DEFAULT 'CASH',
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `CashMovement_session_created_idx`(`sessionId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Legajos, horas extra y liquidaciones
CREATE TABLE `Employee` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `employeeNumber` VARCHAR(30) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `dni` VARCHAR(20) NOT NULL,
  `cuil` VARCHAR(20) NULL,
  `birthDate` DATETIME(3) NULL,
  `phone` VARCHAR(40) NULL,
  `email` VARCHAR(191) NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `position` VARCHAR(120) NOT NULL,
  `department` VARCHAR(100) NULL,
  `contractType` VARCHAR(30) NOT NULL DEFAULT 'PERMANENT',
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NULL,
  `baseSalary` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `hourlyRate` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `bank` VARCHAR(100) NULL,
  `cbu` VARCHAR(30) NULL,
  `emergencyContact` VARCHAR(160) NULL,
  `emergencyPhone` VARCHAR(40) NULL,
  `healthInsurance` VARCHAR(120) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Employee_employeeNumber_key`(`employeeNumber`),
  UNIQUE INDEX `Employee_dni_key`(`dni`),
  UNIQUE INDEX `Employee_cuil_key`(`cuil`),
  INDEX `Employee_active_lastName_idx`(`active`, `lastName`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeOvertime` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `employeeId` INTEGER NOT NULL,
  `workDate` DATETIME(3) NOT NULL,
  `hours` DECIMAL(8,2) NOT NULL,
  `multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.5,
  `hourlyRate` DECIMAL(12,2) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` VARCHAR(255) NULL,
  `settled` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `EmployeeOvertime_employee_date_idx`(`employeeId`, `workDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeePayroll` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `employeeId` INTEGER NOT NULL,
  `period` VARCHAR(7) NOT NULL,
  `baseSalary` DECIMAL(12,2) NOT NULL,
  `overtimeHours` DECIMAL(8,2) NOT NULL DEFAULT 0,
  `overtimeAmount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `bonuses` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `deductions` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `grossSalary` DECIMAL(12,2) NOT NULL,
  `netSalary` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `paidAt` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `EmployeePayroll_employee_period_key`(`employeeId`, `period`),
  INDEX `EmployeePayroll_period_status_idx`(`period`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CashSession` ADD CONSTRAINT `CashSession_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CashSession` ADD CONSTRAINT `CashSession_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `CashSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `ErpUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `EmployeeOvertime` ADD CONSTRAINT `EmployeeOvertime_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `EmployeePayroll` ADD CONSTRAINT `EmployeePayroll_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
