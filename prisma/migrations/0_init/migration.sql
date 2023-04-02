-- CreateTable
CREATE TABLE `bot_bresil` (
    `id` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `bresil_received` INTEGER NOT NULL DEFAULT 0,
    `bresil_sent` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bot_favorites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` TEXT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `thumbnail` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bot_levels` (
    `id` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `xp` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

