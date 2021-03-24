-- CreateTable
CREATE TABLE `DecisionRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sense_id` VARCHAR(191) NOT NULL,
    `decision` ENUM('ACCEPTED', 'REJECTED', 'SKIPPED') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
