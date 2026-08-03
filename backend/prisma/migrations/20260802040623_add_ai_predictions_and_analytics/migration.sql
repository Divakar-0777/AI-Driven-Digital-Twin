-- CreateTable
CREATE TABLE "PredictionHistories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "predictionResult" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSummaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "financialHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "habitScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "overallAIScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSummaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictionHistories_userId_idx" ON "PredictionHistories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSummaries_userId_key" ON "AnalyticsSummaries"("userId");

-- AddForeignKey
ALTER TABLE "PredictionHistories" ADD CONSTRAINT "PredictionHistories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSummaries" ADD CONSTRAINT "AnalyticsSummaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
