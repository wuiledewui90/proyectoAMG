-- CreateTable
CREATE TABLE `ErpSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `businessName` VARCHAR(160) NOT NULL DEFAULT 'Radiadores AMG',
    `tagline` VARCHAR(191) NULL,
    `taxId` VARCHAR(40) NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(255) NULL,
    `whatsapp` VARCHAR(40) NULL,
    `quoteValidityDays` INTEGER NOT NULL DEFAULT 15,
    `invoiceDueDays` INTEGER NOT NULL DEFAULT 30,
    `defaultTaxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `defaultTerms` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ErpSetting` (
    `id`,
    `businessName`,
    `tagline`,
    `phone`,
    `email`,
    `address`,
    `whatsapp`,
    `quoteValidityDays`,
    `invoiceDueDays`,
    `defaultTaxRate`,
    `defaultTerms`,
    `updatedAt`
) VALUES (
    1,
    'Radiadores AMG',
    'Especialistas en refrigeración automotor',
    '+54 9 380 452-4590',
    'info@radiadoresamg.com.ar',
    'Cerro de la Cruz 810 · La Rioja Capital',
    '5493804524590',
    15,
    30,
    0,
    'Precios expresados en pesos argentinos. Sujeto a disponibilidad de repuestos.',
    CURRENT_TIMESTAMP(3)
);
