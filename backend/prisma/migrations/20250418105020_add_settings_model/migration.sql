-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "attendanceCheckInWindow" INTEGER NOT NULL DEFAULT 15,
    "attendanceGeoFencingRadius" INTEGER NOT NULL DEFAULT 100,
    "attendanceRequirePhoto" BOOLEAN NOT NULL DEFAULT false,
    "systemTheme" TEXT NOT NULL DEFAULT 'light',
    "systemName" TEXT NOT NULL DEFAULT 'Attendance Management System',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
