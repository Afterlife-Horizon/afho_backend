/*
  Warnings:

  - Added the required column `type` to the `bot_favorites` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bot_favorites` ADD COLUMN `type` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `bot_time` (
    `user_id` VARCHAR(255) NOT NULL,
    `time` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
