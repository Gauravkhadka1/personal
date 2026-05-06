/*
  Warnings:

  - A unique constraint covering the columns `[userId,dayName]` on the table `WorkoutDay` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `WorkoutDay_dayName_key` ON `workoutday`;

-- AlterTable
ALTER TABLE `workoutexercise` ADD COLUMN `defaultReps` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `defaultSets` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `defaultWeight` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `workoutlog` ADD COLUMN `completed` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `WorkoutDay_userId_dayName_key` ON `WorkoutDay`(`userId`, `dayName`);
