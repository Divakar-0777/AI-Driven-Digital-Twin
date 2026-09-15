-- Master All-In-One Sample SQL Insert Script for AI Digital Twin
-- Inserts comprehensive Financial Transactions, Study Subjects & Sessions, Habits, Goals, and Fitness activities
-- Targets the first user in the Users table (or auto-detects)

DO $$
DECLARE
    target_user_id UUID;
    today_ts TIMESTAMP := CURRENT_TIMESTAMP;
    today_date DATE := CURRENT_DATE;
    i INT;
BEGIN
    -- Select the first existing user in the database
    SELECT "id" INTO target_user_id FROM "Users" LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found in Users table. Please register or insert a user first.';
    ELSE
        -- 1. Financial Transactions
        INSERT INTO "FinancialTransactions" ("userId", "title", "category", "type", "amount", "date", "paymentMethod", "notes", "recurring", "recurrenceFrequency")
        VALUES
            (target_user_id, 'Monthly Salary', 'Salary', 'INCOME', 5500.00, today_ts - INTERVAL '10 days', 'Bank Transfer', 'Primary employment income', true, 'MONTHLY'),
            (target_user_id, 'Freelance Consulting', 'Freelance', 'INCOME', 950.00, today_ts - INTERVAL '7 days', 'Bank Transfer', 'Full-stack software architecture consulting', false, NULL),
            (target_user_id, 'Apartment Lease Rent', 'Housing', 'EXPENSE', 1350.00, today_ts - INTERVAL '9 days', 'Bank Transfer', 'Monthly residential rent', true, 'MONTHLY'),
            (target_user_id, 'Organic Grocery Shopping', 'Food & Dining', 'EXPENSE', 165.20, today_ts - INTERVAL '6 days', 'Credit Card', 'Weekly grocery haul', false, NULL),
            (target_user_id, 'Electricity & Utilities', 'Utilities', 'EXPENSE', 95.00, today_ts - INTERVAL '5 days', 'Debit Card', 'Monthly power and heating', true, 'MONTHLY'),
            (target_user_id, 'Gigabit Fiber Internet', 'Utilities', 'EXPENSE', 70.00, today_ts - INTERVAL '4 days', 'Credit Card', 'High-speed broadband', true, 'MONTHLY'),
            (target_user_id, 'Gym & Wellness Pass', 'Health', 'EXPENSE', 55.00, today_ts - INTERVAL '8 days', 'Credit Card', 'Monthly fitness membership', true, 'MONTHLY'),
            (target_user_id, 'Tech Books & Cloud Subscriptions', 'Education', 'EXPENSE', 45.00, today_ts - INTERVAL '3 days', 'Credit Card', 'Learning materials', true, 'MONTHLY'),
            (target_user_id, 'Index Fund Investment', 'Investments', 'EXPENSE', 500.00, today_ts - INTERVAL '2 days', 'Bank Transfer', 'Monthly automated ETF deposit', true, 'MONTHLY'),
            (target_user_id, 'Stock Dividend Payout', 'Investments', 'INCOME', 135.00, today_ts - INTERVAL '1 day', 'Bank Transfer', 'Quarterly dividend payment', false, NULL);

        -- 2. Habits (Past 7 Days History + Recurring)
        FOR i IN 0..6 LOOP
            INSERT INTO "Habits" ("userId", "name", "targetFrequency", "completed", "date")
            VALUES
                (target_user_id, 'Morning Exercise & Stretch', 'Daily', (i % 2 = 0), today_date - i),
                (target_user_id, 'Read Technical Books (20 mins)', 'Daily', (i != 3), today_date - i),
                (target_user_id, 'Mindfulness & Meditation (10 mins)', 'Daily', (i % 3 != 0), today_date - i),
                (target_user_id, 'Drink 3 Liters Water', 'Daily', true, today_date - i),
                (target_user_id, 'Deep Work / Coding Session (1 hr)', 'Daily', (i != 5), today_date - i),
                (target_user_id, 'Sleep by 11:00 PM', 'Daily', (i % 2 = 1), today_date - i);
        END LOOP;

        INSERT INTO "Habits" ("userId", "name", "targetFrequency", "completed", "date")
        VALUES
            (target_user_id, 'Gym Strength Training (4x/Week)', '4x/Week', true, today_date),
            (target_user_id, 'Weekly Financial Review & Budget Audit', 'Weekly', true, today_date),
            (target_user_id, 'System Architecture Deep Dive', 'Weekly', false, today_date);

        -- 3. Study Sessions & Subjects
        INSERT INTO "StudySessions" ("userId", "subject", "topic", "duration", "date", "productivityRating", "notes")
        VALUES
            (target_user_id, 'Machine Learning & AI', 'Neural Network Architectures & Backpropagation', 90, today_ts - INTERVAL '8 days', 5, 'Implemented custom multi-layer perceptron in PyTorch with loss curves.'),
            (target_user_id, 'Machine Learning & AI', 'Transformer Attention Mechanisms & LLM Fine-Tuning', 120, today_ts - INTERVAL '5 days', 5, 'Studied Multi-Head Self-Attention and LoRA adapters.'),
            (target_user_id, 'Cloud Computing & DevOps', 'AWS ECS Fargate & Container Orchestration', 75, today_ts - INTERVAL '7 days', 4, 'Configured task definitions, VPC endpoints, and Application Load Balancer.'),
            (target_user_id, 'Cloud Computing & DevOps', 'Terraform Infrastructure as Code (IaC) Pipelines', 90, today_ts - INTERVAL '4 days', 5, 'Provisioned multi-region PostgreSQL RDS cluster and Redis cache.'),
            (target_user_id, 'System Design & Architecture', 'Distributed Caching Strategies & Redis Invalidation', 80, today_ts - INTERVAL '6 days', 5, 'Analyzed write-through vs cache-aside strategies and TTL expiration.'),
            (target_user_id, 'System Design & Architecture', 'Event-Driven Microservices with Apache Kafka', 105, today_ts - INTERVAL '3 days', 5, 'Designed pub/sub event schemas and consumer offset commit patterns.'),
            (target_user_id, 'Data Structures & Algorithms', 'Dynamic Programming & Memoization Patterns', 75, today_ts - INTERVAL '5 days', 4, 'Solved 3 medium/hard DP problems on LeetCode focusing on knapsack variations.'),
            (target_user_id, 'Data Structures & Algorithms', 'Graph Traversal (Dijkstra, Topological Sort & BFS/DFS)', 90, today_ts - INTERVAL '2 days', 5, 'Mastered shortest path algorithm implementations and DAG cycle detection.'),
            (target_user_id, 'Full-Stack Web Development', 'React Server Components & Next.js App Router', 90, today_ts - INTERVAL '4 days', 5, 'Built responsive dashboard with suspense streaming and server actions.'),
            (target_user_id, 'Cybersecurity & Compliance', 'OAuth2.0, OpenID Connect & JWT Rotation', 60, today_ts - INTERVAL '1 day', 5, 'Configured secure token refresh cycle with HTTP-only cookie storage.');

        -- 4. Multi-Domain Goals
        INSERT INTO "Goals" ("userId", "goalName", "description", "goalType", "targetValue", "currentValue", "unit", "deadline", "priority", "status", "progressPercent", "riskLevel", "aiRecommendation", "createdAt", "updatedAt")
        VALUES
            (target_user_id, 'AWS Solutions Architect Certification', 'Study cloud patterns and pass the official AWS SAA-C03 certification exam', 'ACADEMIC', 100, 75, 'percent', today_ts + INTERVAL '60 days', 'HIGH', 'ACTIVE', 75.0, 'LOW', 'You are on track. Maintain 2 hours of weekly cloud mock exam practice.', today_ts, today_ts),
            (target_user_id, 'Master Data Structures & Algorithms', 'Solve 150 LeetCode problems covering DP, Trees, Graphs, and Heaps', 'ACADEMIC', 150, 92, 'problems', today_ts + INTERVAL '90 days', 'MEDIUM', 'ACTIVE', 61.3, 'LOW', 'Focus on dynamic programming problems to achieve full mastery.', today_ts, today_ts),
            (target_user_id, 'Build 6-Month Emergency Fund', 'Accumulate $15,000 liquid safety buffer in high-yield savings account', 'FINANCIAL', 15000, 12500, 'dollars', today_ts + INTERVAL '120 days', 'HIGH', 'ACTIVE', 83.3, 'LOW', 'Excellent progress. Monthly $500 contribution will complete this ahead of time.', today_ts, today_ts),
            (target_user_id, 'Run 5K Under 25 Minutes', 'Build cardiovascular endurance with structured interval running 3x per week', 'FITNESS', 25, 27.2, 'minutes', today_ts + INTERVAL '45 days', 'MEDIUM', 'ACTIVE', 68.0, 'MEDIUM', 'Increase sprint interval training on Tuesdays.', today_ts, today_ts),
            (target_user_id, 'Launch SaaS Side Project MVP', 'Architect, develop, and deploy AI productivity tool to first 100 beta users', 'CAREER', 100, 60, 'percent', today_ts + INTERVAL '100 days', 'HIGH', 'ACTIVE', 60.0, 'LOW', 'Backend APIs and frontend UI complete; focus on user auth and billing.', today_ts, today_ts),
            (target_user_id, 'Read 24 Non-Fiction Books', 'Read 24 books on system architecture, psychology, finance, and productivity', 'PERSONAL', 24, 14, 'books', today_ts + INTERVAL '120 days', 'LOW', 'ACTIVE', 58.3, 'LOW', 'On track with 2 books per month reading habit.', today_ts, today_ts),
            (target_user_id, 'Maintain Daily 10-Minute Meditation Streak', 'Build mindfulness resilience and stress reduction with daily morning practice', 'LIFESTYLE', 60, 42, 'days', today_ts + INTERVAL '30 days', 'MEDIUM', 'ACTIVE', 70.0, 'LOW', 'Current streak is 14 days without interruptions.', today_ts, today_ts);

        -- 5. Financial Goals
        INSERT INTO "FinancialGoals" ("userId", "goalName", "targetAmount", "currentAmount", "monthlyContribution", "targetDate", "priority", "goalCategory", "status", "createdAt", "updatedAt")
        VALUES
            (target_user_id, 'Emergency Fund ($15k)', 15000.00, 12500.00, 500.00, today_ts + INTERVAL '120 days', 'HIGH', 'EMERGENCY_FUND', 'ACTIVE', today_ts, today_ts),
            (target_user_id, 'Engineering Workstation / Laptop', 2500.00, 1800.00, 300.00, today_ts + INTERVAL '75 days', 'MEDIUM', 'LAPTOP', 'ACTIVE', today_ts, today_ts);

        -- 6. Fitness Activities
        INSERT INTO "FitnessActivities" ("userId", "activityType", "duration", "caloriesBurned", "activityDate")
        VALUES
            (target_user_id, 'Running', 35, 380.0, today_ts - INTERVAL '1 day'),
            (target_user_id, 'Gym Strength Training', 60, 460.0, today_ts - INTERVAL '3 days'),
            (target_user_id, 'Outdoor Cycling', 45, 340.0, today_ts - INTERVAL '5 days');

        RAISE NOTICE '=======================================================';
        RAISE NOTICE 'Successfully seeded all AI Digital Twin modules for user: %', target_user_id;
        RAISE NOTICE '=======================================================';
    END IF;
END $$;
