ALTER TABLE `EmployeeOvertime`
  ADD COLUMN `payrollId` INTEGER NULL;

CREATE INDEX `EmployeeOvertime_payroll_idx`
  ON `EmployeeOvertime`(`payrollId`);

ALTER TABLE `EmployeeOvertime`
  ADD CONSTRAINT `EmployeeOvertime_payrollId_fkey`
  FOREIGN KEY (`payrollId`) REFERENCES `EmployeePayroll`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
