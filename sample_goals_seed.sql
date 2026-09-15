-- Sample SQL Insert script for PostgreSQL Goals (Generic Multi-Domain & Financial Goals)
-- Inserts comprehensive Academic, Fitness, Career, Personal, Financial, and Lifestyle goals
-- Targets the first existing user in the database or specify your user UUID

DO $$
DECLARE
    target_user_id UUID;
    today_ts TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Automatically picks the first existing user in the database (or replace with your specific user ID)
    SELECT "id" INTO target_user_id FROM "Users" LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found in Users table. Please register or insert a user first.';
    ELSE
        -- 1. Insert Generic Multi-Domain Goals into "Goals" table
        INSERT INTO "Goals" ("userId", "goalName", "description", "goalType", "targetValue", "currentValue", "unit", "deadline", "priority", "status", "progressPercent", "riskLevel", "aiRecommendation", "createdAt", "updatedAt")
        VALUES
            -- Academic Goals
            (target_user_id, 'AWS Solutions Architect Certification', 'Study cloud patterns and pass the official AWS SAA-C03 certification exam', 'ACADEMIC', 100, 75, 'percent', today_ts + INTERVAL '60 days', 'HIGH', 'ACTIVE', 75.0, 'LOW', 'You are on track. Maintain 2 hours of weekly cloud mock exam practice.', today_ts, today_ts),
            (target_user_id, 'Master Data Structures & Algorithms', 'Solve 150 LeetCode problems covering DP, Trees, Graphs, and Heaps', 'ACADEMIC', 150, 92, 'problems', today_ts + INTERVAL '90 days', 'MEDIUM', 'ACTIVE', 61.3, 'LOW', 'Focus on dynamic programming problems to achieve full mastery.', today_ts, today_ts),

            -- Financial Goals
            (target_user_id, 'Build 6-Month Emergency Fund', 'Accumulate $15,000 liquid safety buffer in high-yield savings account', 'FINANCIAL', 15000, 12500, 'dollars', today_ts + INTERVAL '120 days', 'HIGH', 'ACTIVE', 83.3, 'LOW', 'Excellent progress. Monthly $500 contribution will complete this ahead of time.', today_ts, today_ts),
            (target_user_id, 'Upgrade Engineering Workstation', 'Save for high-performance workstation for local AI model inference & compilation', 'FINANCIAL', 2500, 1800, 'dollars', today_ts + INTERVAL '75 days', 'MEDIUM', 'ACTIVE', 72.0, 'LOW', 'On schedule to purchase in 2.5 months.', today_ts, today_ts),

            -- Fitness & Health Goals
            (target_user_id, 'Run 5K Under 25 Minutes', 'Build cardiovascular endurance with structured interval running 3x per week', 'FITNESS', 25, 27.2, 'minutes', today_ts + INTERVAL '45 days', 'MEDIUM', 'ACTIVE', 68.0, 'MEDIUM', 'Increase sprint interval training on Tuesdays to shave remaining 2.2 minutes.', today_ts, today_ts),
            (target_user_id, 'Consistent Gym Strength Training', 'Complete 100 structured strength training sessions this calendar year', 'FITNESS', 100, 48, 'sessions', today_ts + INTERVAL '180 days', 'MEDIUM', 'ACTIVE', 48.0, 'LOW', 'Maintain current 4x/week cadence.', today_ts, today_ts),

            -- Career & Professional Goals
            (target_user_id, 'Launch SaaS Side Project MVP', 'Architect, develop, and deploy AI productivity tool to first 100 beta users', 'CAREER', 100, 60, 'percent', today_ts + INTERVAL '100 days', 'HIGH', 'ACTIVE', 60.0, 'LOW', 'Backend APIs and frontend UI complete; focus on user auth and billing.', today_ts, today_ts),
            (target_user_id, 'Publish 6 Technical Engineering Articles', 'Write in-depth engineering breakdowns on distributed systems and AI', 'CAREER', 6, 3, 'articles', today_ts + INTERVAL '150 days', 'LOW', 'ACTIVE', 50.0, 'LOW', 'Article on Redis caching received high engagement.', today_ts, today_ts),

            -- Personal & Lifestyle Goals
            (target_user_id, 'Read 24 Non-Fiction Books', 'Read 24 books on system architecture, psychology, finance, and productivity', 'PERSONAL', 24, 14, 'books', today_ts + INTERVAL '120 days', 'LOW', 'ACTIVE', 58.3, 'LOW', 'On track with 2 books per month reading habit.', today_ts, today_ts),
            (target_user_id, 'Maintain Daily 10-Minute Meditation Streak', 'Build mindfulness resilience and stress reduction with daily morning practice', 'LIFESTYLE', 60, 42, 'days', today_ts + INTERVAL '30 days', 'MEDIUM', 'ACTIVE', 70.0, 'LOW', 'Current streak is 14 days without interruptions.', today_ts, today_ts);

        -- 2. Insert Category Budgets & Financial Goals into "FinancialGoals" table
        INSERT INTO "FinancialGoals" ("userId", "goalName", "targetAmount", "currentAmount", "monthlyContribution", "targetDate", "priority", "goalCategory", "status", "createdAt", "updatedAt")
        VALUES
            (target_user_id, 'Emergency Fund ($15k)', 15000.00, 12500.00, 500.00, today_ts + INTERVAL '120 days', 'HIGH', 'EMERGENCY_FUND', 'ACTIVE', today_ts, today_ts),
            (target_user_id, 'Engineering Workstation / Laptop', 2500.00, 1800.00, 300.00, today_ts + INTERVAL '75 days', 'MEDIUM', 'LAPTOP', 'ACTIVE', today_ts, today_ts),
            (target_user_id, 'Annual Vacation & Travel Fund', 3000.00, 1400.00, 250.00, today_ts + INTERVAL '180 days', 'LOW', 'TRAVEL', 'ACTIVE', today_ts, today_ts);

        RAISE NOTICE 'Successfully inserted sample generic and financial goals for user ID: %', target_user_id;
    END IF;
END $$;
