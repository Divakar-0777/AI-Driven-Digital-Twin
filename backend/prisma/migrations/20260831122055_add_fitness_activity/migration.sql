-- CreateTable
CREATE TABLE "FitnessActivities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "caloriesBurned" DOUBLE PRECISION NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitnessActivities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitnessActivities_userId_idx" ON "FitnessActivities"("userId");

-- CreateIndex
CREATE INDEX "FitnessActivities_userId_activityDate_idx" ON "FitnessActivities"("userId", "activityDate");

-- AddForeignKey
ALTER TABLE "FitnessActivities" ADD CONSTRAINT "FitnessActivities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
