/*
  Warnings:

  - The primary key for the `bot_favorites` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id,user_id]` on the table `bot_favorites` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `bot_favorites` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(255) NOT NULL,
    MODIFY `user_id` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `id_user_id` ON `bot_favorites`(`id`, `user_id`);
