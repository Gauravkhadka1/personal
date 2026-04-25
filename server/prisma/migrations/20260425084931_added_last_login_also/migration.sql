-- AlterTable
ALTER TABLE `user` ADD COLUMN `accountLockedUntil` DATETIME(3) NULL,
    ADD COLUMN `lastLogin` DATETIME(3) NULL;
