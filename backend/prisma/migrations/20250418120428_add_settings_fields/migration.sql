-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "academicYear" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "attendanceReminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoBackup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "backupFrequency" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "defaultAttendanceStatus" TEXT NOT NULL DEFAULT 'absent',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "semester" TEXT NOT NULL DEFAULT '';
