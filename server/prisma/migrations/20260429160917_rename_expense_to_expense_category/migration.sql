/*
  Warnings:

  - You are about to drop the column `category` on the `dailyexpense` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `expensecategory` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `expensecategory` table. All the data in the column will be lost.
  - You are about to drop the `expense` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `ExpenseCategory` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `expensecategory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `expense` DROP FOREIGN KEY `Expense_userId_fkey`;

-- DropForeignKey
ALTER TABLE `expensecategory` DROP FOREIGN KEY `ExpenseCategory_userId_fkey`;

-- DropIndex
DROP INDEX `ExpenseCategory_name_key` ON `expensecategory`;

-- DropIndex
DROP INDEX `ExpenseCategory_userId_fkey` ON `expensecategory`;

-- AlterTable
ALTER TABLE `dailyexpense` DROP COLUMN `category`,
    ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `expensecategory` DROP COLUMN `color`,
    DROP COLUMN `icon`,
    ADD COLUMN `amount` DOUBLE NOT NULL,
    MODIFY `userId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `expense`;

-- AddForeignKey
ALTER TABLE `ExpenseCategory` ADD CONSTRAINT `ExpenseCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyExpense` ADD CONSTRAINT `DailyExpense_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ExpenseCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
