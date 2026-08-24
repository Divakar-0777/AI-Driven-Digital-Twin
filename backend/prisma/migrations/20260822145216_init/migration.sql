-- AlterTable
ALTER TABLE "AiRecommendations" ADD COLUMN     "expectedImpact" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "risk" TEXT,
ADD COLUMN     "suggestedAction" TEXT;

-- AlterTable
ALTER TABLE "AnalyticsSummaries" ADD COLUMN     "goalScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "studyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "DigitalTwinStates" ADD COLUMN     "behaviourSummary" TEXT,
ADD COLUMN     "goalScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "habitScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "personalitySummary" TEXT,
ADD COLUMN     "studyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Profiles" ADD COLUMN     "financialGoals" TEXT,
ADD COLUMN     "fitnessGoal" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "lifestyleInfo" TEXT,
ADD COLUMN     "longTermGoals" TEXT,
ADD COLUMN     "savings" DECIMAL(65,30) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE "Goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "description" TEXT,
    "goalType" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "unit" TEXT,
    "deadline" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLevel" TEXT,
    "aiRecommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goals_userId_idx" ON "Goals"("userId");

-- CreateIndex
CREATE INDEX "Goals_userId_goalType_idx" ON "Goals"("userId", "goalType");

-- CreateIndex
CREATE INDEX "ChatConversations_userId_idx" ON "ChatConversations"("userId");

-- CreateIndex
CREATE INDEX "ChatMessages_conversationId_idx" ON "ChatMessages"("conversationId");

-- CreateIndex
CREATE INDEX "ActivityHistory_userId_timestamp_idx" ON "ActivityHistory"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "FinancialTransactions_userId_type_idx" ON "FinancialTransactions"("userId", "type");

-- CreateIndex
CREATE INDEX "FinancialTransactions_userId_category_idx" ON "FinancialTransactions"("userId", "category");

-- CreateIndex
CREATE INDEX "Habits_userId_date_idx" ON "Habits"("userId", "date");

-- CreateIndex
CREATE INDEX "Habits_userId_name_idx" ON "Habits"("userId", "name");

-- CreateIndex
CREATE INDEX "StudySessions_userId_date_idx" ON "StudySessions"("userId", "date");

-- CreateIndex
CREATE INDEX "StudySessions_userId_subject_idx" ON "StudySessions"("userId", "subject");

-- AddForeignKey
ALTER TABLE "Goals" ADD CONSTRAINT "Goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversations" ADD CONSTRAINT "ChatConversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessages" ADD CONSTRAINT "ChatMessages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
