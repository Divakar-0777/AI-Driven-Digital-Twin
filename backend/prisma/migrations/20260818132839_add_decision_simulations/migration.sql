-- CreateTable
CREATE TABLE "DecisionSimulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "baseline" TEXT NOT NULL,
    "scenarios" TEXT NOT NULL,
    "assumptions" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "comparison" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionSimulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionSimulations_userId_idx" ON "DecisionSimulations"("userId");

-- AddForeignKey
ALTER TABLE "DecisionSimulations" ADD CONSTRAINT "DecisionSimulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
