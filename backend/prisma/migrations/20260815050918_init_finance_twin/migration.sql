-- AlterTable
ALTER TABLE "FinancialTransactions" ADD COLUMN     "recurrenceFrequency" TEXT,
ADD COLUMN     "recurring" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "monthlyLimit" DECIMAL(65,30) NOT NULL,
    "currentSpending" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "currentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "monthlyContribution" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "goalCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialGoals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialSimulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "assumptions" TEXT NOT NULL,
    "projectedIncome" DECIMAL(65,30) NOT NULL,
    "projectedExpenses" DECIMAL(65,30) NOT NULL,
    "projectedSavings" DECIMAL(65,30) NOT NULL,
    "projectedBalance" DECIMAL(65,30) NOT NULL,
    "goalImpact" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialSimulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Budgets_userId_idx" ON "Budgets"("userId");

-- CreateIndex
CREATE INDEX "FinancialGoals_userId_idx" ON "FinancialGoals"("userId");

-- CreateIndex
CREATE INDEX "FinancialSimulations_userId_idx" ON "FinancialSimulations"("userId");

-- AddForeignKey
ALTER TABLE "Budgets" ADD CONSTRAINT "Budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoals" ADD CONSTRAINT "FinancialGoals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSimulations" ADD CONSTRAINT "FinancialSimulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
