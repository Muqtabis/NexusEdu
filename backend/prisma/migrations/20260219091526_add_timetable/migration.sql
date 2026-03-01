-- CreateTable
CREATE TABLE `Timetable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `className` VARCHAR(191) NOT NULL,
    `day` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `teacherId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
