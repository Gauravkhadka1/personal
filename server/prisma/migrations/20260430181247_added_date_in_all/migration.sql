/*
  Warnings:

  - Added the required column `date` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `EarnedIncome` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `ExpenseCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `PassiveIncome` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `asset` ADD COLUMN `date` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `earnedincome` ADD COLUMN `date` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `expensecategory` ADD COLUMN `date` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `liability` ADD COLUMN `date` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `passiveincome` ADD COLUMN `date` DATETIME(3) NOT NULL;
