/*
  Warnings:

  - You are about to drop the column `dailyStudyHoursTarget` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `educationLevel` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `habitGoals` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyExpenseTarget` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyIncome` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `profilePhotoUrl` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `studyGoal` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "dailyStudyHoursTarget",
DROP COLUMN "dateOfBirth",
DROP COLUMN "educationLevel",
DROP COLUMN "fullName",
DROP COLUMN "habitGoals",
DROP COLUMN "monthlyExpenseTarget",
DROP COLUMN "monthlyIncome",
DROP COLUMN "occupation",
DROP COLUMN "phoneNumber",
DROP COLUMN "profilePhotoUrl",
DROP COLUMN "studyGoal";

-- CreateTable
CREATE TABLE "Profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "occupation" TEXT,
    "educationLevel" TEXT,
    "monthlyIncome" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "monthlyExpenseTarget" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "studyGoal" TEXT,
    "dailyStudyHoursTarget" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "habitGoals" TEXT,
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalTwinStates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "financialHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "twinEmoticon" TEXT NOT NULL DEFAULT '😐',
    "twinStatus" TEXT NOT NULL DEFAULT 'Initializing',
    "syncTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalTwinStates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRecommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "recommendationText" TEXT NOT NULL,
    "impactLevel" TEXT NOT NULL,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRecommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profiles_userId_key" ON "Profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalTwinStates_userId_key" ON "DigitalTwinStates"("userId");

-- CreateIndex
CREATE INDEX "AiRecommendations_userId_idx" ON "AiRecommendations"("userId");

-- CreateIndex
CREATE INDEX "AiRecommendations_createdAt_idx" ON "AiRecommendations"("createdAt");

-- CreateIndex
CREATE INDEX "Notifications_userId_idx" ON "Notifications"("userId");

-- CreateIndex
CREATE INDEX "Notifications_createdAt_idx" ON "Notifications"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityHistory_userId_idx" ON "ActivityHistory"("userId");

-- CreateIndex
CREATE INDEX "FinancialTransactions_userId_idx" ON "FinancialTransactions"("userId");

-- CreateIndex
CREATE INDEX "FinancialTransactions_date_idx" ON "FinancialTransactions"("date");

-- CreateIndex
CREATE INDEX "Habits_userId_idx" ON "Habits"("userId");

-- CreateIndex
CREATE INDEX "StudySessions_userId_idx" ON "StudySessions"("userId");

-- AddForeignKey
ALTER TABLE "Profiles" ADD CONSTRAINT "Profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalTwinStates" ADD CONSTRAINT "DigitalTwinStates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendations" ADD CONSTRAINT "AiRecommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
