/*
  Warnings:

  - You are about to drop the `dailyexpense` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `dailyexpense` DROP FOREIGN KEY `DailyExpense_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `dailyexpense` DROP FOREIGN KEY `DailyExpense_userId_fkey`;

-- DropTable
DROP TABLE `dailyexpense`;
