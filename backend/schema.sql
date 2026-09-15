-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS "ActivityHistory" CASCADE;
DROP TABLE IF EXISTS "Habits" CASCADE;
DROP TABLE IF EXISTS "StudySessions" CASCADE;
DROP TABLE IF EXISTS "FinancialTransactions" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- 1. Users Table
CREATE TABLE "Users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "fullName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(50),
    "dateOfBirth" DATE,
    "occupation" VARCHAR(100),
    "educationLevel" VARCHAR(100),
    "monthlyIncome" DECIMAL(12, 2) DEFAULT 0.00 CHECK ("monthlyIncome" >= 0),
    "monthlyExpenseTarget" DECIMAL(12, 2) DEFAULT 0.00 CHECK ("monthlyExpenseTarget" >= 0),
    "studyGoal" VARCHAR(255),
    "dailyStudyHoursTarget" REAL DEFAULT 0.0 CHECK ("dailyStudyHoursTarget" >= 0),
    "habitGoals" TEXT,
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for User Email
CREATE UNIQUE INDEX idx_users_email ON "Users"("email");

-- 2. Financial Transactions Table
CREATE TABLE "FinancialTransactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "type" VARCHAR(10) NOT NULL CHECK ("type" IN ('INCOME', 'EXPENSE')),
    "amount" DECIMAL(12, 2) NOT NULL CHECK ("amount" >= 0),
    "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" VARCHAR(100) NOT NULL,
    "notes" TEXT,
    CONSTRAINT fk_financial_transactions_user FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Index for financial queries by user
CREATE INDEX idx_financial_transactions_user_date ON "FinancialTransactions"("userId", "date");

-- 3. Study Sessions Table
CREATE TABLE "StudySessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "topic" VARCHAR(255) NOT NULL,
    "duration" INTEGER NOT NULL CHECK ("duration" > 0), -- duration in minutes
    "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productivityRating" INTEGER NOT NULL CHECK ("productivityRating" >= 1 AND "productivityRating" <= 5),
    "notes" TEXT,
    CONSTRAINT fk_study_sessions_user FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Index for study sessions by user
CREATE INDEX idx_study_sessions_user_date ON "StudySessions"("userId", "date");

-- 4. Habits Table
CREATE TABLE "Habits" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "targetFrequency" VARCHAR(100) NOT NULL, -- e.g., 'Daily', 'Weekly'
    "completed" BOOLEAN NOT NULL DEFAULT FALSE,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT fk_habits_user FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Index for habits checking status by user and date
CREATE INDEX idx_habits_user_date ON "Habits"("userId", "date");

-- 5. Activity History Table
CREATE TABLE "ActivityHistory" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "activityType" VARCHAR(100) NOT NULL, -- e.g., 'User Registered', 'Login', 'Profile Updated'
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_history_user FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Index for auditing user activity logs
CREATE INDEX idx_activity_history_user_time ON "ActivityHistory"("userId", "timestamp" DESC);
