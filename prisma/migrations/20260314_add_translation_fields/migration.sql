-- Migration: Add translation fields for bilingual support
-- Date: 2026-03-14

-- Add translation fields to product table
ALTER TABLE `product` ADD COLUMN `nameEn` VARCHAR(255) NULL;
ALTER TABLE `product` ADD COLUMN `descriptionEn` LONGTEXT NULL;
ALTER TABLE `product` ADD COLUMN `badgeTextEn` VARCHAR(255) NULL;
ALTER TABLE `product` ADD COLUMN `weightEn` VARCHAR(100) NULL;

-- Add translation fields to category table
ALTER TABLE `category` ADD COLUMN `nameEn` VARCHAR(255) NULL;
ALTER TABLE `category` ADD COLUMN `descriptionEn` LONGTEXT NULL;

-- Add translation fields to tag table
ALTER TABLE `tag` ADD COLUMN `nameEn` VARCHAR(255) NULL;

-- Add translation fields to brand table
ALTER TABLE `brand` ADD COLUMN `nameEn` VARCHAR(255) NULL;

-- Add translation fields to post table
ALTER TABLE `post` ADD COLUMN `titleEn` VARCHAR(500) NULL;
ALTER TABLE `post` ADD COLUMN `summaryEn` LONGTEXT NULL;
ALTER TABLE `post` ADD COLUMN `contentEn` LONGTEXT NULL;
ALTER TABLE `post` ADD COLUMN `categoryEn` VARCHAR(100) NULL;

-- Add translation fields to productvariant table
ALTER TABLE `productvariant` ADD COLUMN `weightEn` VARCHAR(100) NULL;
ALTER TABLE `productvariant` ADD COLUMN `flavorEn` VARCHAR(100) NULL;

-- Add translation fields to productspecification table
ALTER TABLE `productspecification` ADD COLUMN `keyEn` VARCHAR(255) NULL;
ALTER TABLE `productspecification` ADD COLUMN `valueEn` LONGTEXT NULL;

-- Add translation fields to banner table
ALTER TABLE `banner` ADD COLUMN `titleEn` VARCHAR(500) NULL;
ALTER TABLE `banner` ADD COLUMN `subtitleEn` VARCHAR(500) NULL;
ALTER TABLE `banner` ADD COLUMN `ctaTextEn` VARCHAR(255) NULL;

-- Add translation fields to homepagesection table
ALTER TABLE `homepagesection` ADD COLUMN `titleEn` VARCHAR(500) NULL;
ALTER TABLE `homepagesection` ADD COLUMN `subtitleEn` VARCHAR(500) NULL;
ALTER TABLE `homepagesection` ADD COLUMN `descriptionEn` LONGTEXT NULL;

-- Add translation fields to dynamicpage table
ALTER TABLE `dynamicpage` ADD COLUMN `titleEn` VARCHAR(500) NULL;
ALTER TABLE `dynamicpage` ADD COLUMN `contentEn` LONGTEXT NULL;
ALTER TABLE `dynamicpage` ADD COLUMN `excerptEn` LONGTEXT NULL;

-- Add translation fields to menuitem table
ALTER TABLE `menuitem` ADD COLUMN `nameEn` VARCHAR(255) NULL;
