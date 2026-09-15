-- Sample SQL Insert script for PostgreSQL Habits
-- Inserts realistic daily and recurring habit tracking history
-- Targets the first existing user in the database or specify your user UUID

DO $$
DECLARE
    target_user_id UUID;
    today_date DATE := CURRENT_DATE;
    i INT;
BEGIN
    -- Automatically picks the first existing user in the database (or replace with your specific user ID)
    SELECT "id" INTO target_user_id FROM "Users" LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found in Users table. Please register or insert a user first.';
    ELSE
        -- 1. Insert multi-day habit tracking history (past 7 days)
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

        -- 2. Insert weekly / recurring habit entries
        INSERT INTO "Habits" ("userId", "name", "targetFrequency", "completed", "date")
        VALUES
            (target_user_id, 'Gym Strength Training (4x/Week)', '4x/Week', true, today_date),
            (target_user_id, 'Weekly Financial Review & Budget Audit', 'Weekly', true, today_date),
            (target_user_id, 'System Architecture Deep Dive', 'Weekly', false, today_date),
            (target_user_id, 'Weekend Outdoor Jog / Walk', 'Weekly', true, today_date - 1);

        RAISE NOTICE 'Successfully inserted sample habit logs for user ID: %', target_user_id;
    END IF;
END $$;
