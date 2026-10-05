-- Preserve the cost and stock classification at sale time for future gross-profit reports.
-- Existing lines remain NULL: historical costs must not be inferred from today's product cost.
ALTER TABLE `ErpSaleItem`
  ADD COLUMN `unitCost` DECIMAL(12, 2) NULL,
  ADD COLUMN `isStockItem` BOOLEAN NULL;
