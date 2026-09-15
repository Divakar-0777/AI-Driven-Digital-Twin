-- Sample SQL Insert script for PostgreSQL FinancialTransactions
-- Replace '<USER_UUID>' with your actual user ID from the Users table:
-- (e.g. SELECT id FROM "Users" LIMIT 1;)

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Automatically picks the first existing user in the database
    SELECT "id" INTO target_user_id FROM "Users" LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found in Users table. Please register or insert a user first.';
    ELSE
        INSERT INTO "FinancialTransactions" ("userId", "title", "category", "type", "amount", "date", "paymentMethod", "notes")
        VALUES
            (target_user_id, 'Monthly Salary', 'Salary', 'INCOME', 4500.00, '2026-09-01 09:00:00', 'Bank Transfer', 'Primary employment income'),
            (target_user_id, 'Freelance Project', 'Freelance', 'INCOME', 850.00, '2026-09-04 15:30:00', 'Bank Transfer', 'Web design milestone payout'),
            (target_user_id, 'Apartment Rent', 'Housing', 'EXPENSE', 1200.00, '2026-09-02 10:00:00', 'Bank Transfer', 'Monthly rental payment'),
            (target_user_id, 'Supermarket Groceries', 'Food & Dining', 'EXPENSE', 145.50, '2026-09-03 18:20:00', 'Credit Card', 'Weekly grocery haul'),
            (target_user_id, 'Electric & Water Utility', 'Utilities', 'EXPENSE', 85.20, '2026-09-05 11:00:00', 'Debit Card', 'Monthly power and water bill'),
            (target_user_id, 'Fiber Internet', 'Utilities', 'EXPENSE', 60.00, '2026-09-06 14:15:00', 'Credit Card', 'Broadband subscription'),
            (target_user_id, 'Coffee & Snacks', 'Food & Dining', 'EXPENSE', 18.75, '2026-09-07 08:45:00', 'UPI', 'Morning cafe latte & pastry'),
            (target_user_id, 'Gym Membership', 'Health', 'EXPENSE', 50.00, '2026-09-08 07:30:00', 'Credit Card', 'Monthly fitness club access'),
            (target_user_id, 'Stock Dividend', 'Investments', 'INCOME', 120.00, '2026-09-09 12:00:00', 'Bank Transfer', 'Quarterly dividend payout'),
            (target_user_id, 'Restaurant Dinner', 'Food & Dining', 'EXPENSE', 65.40, '2026-09-10 20:30:00', 'Credit Card', 'Weekend dinner with friends'),
            (target_user_id, 'Transit Pass', 'Transportation', 'EXPENSE', 45.00, '2026-09-11 09:00:00', 'Debit Card', 'Monthly metro card reload');
            
        RAISE NOTICE 'Successfully inserted sample financial transactions for user ID: %', target_user_id;
    END IF;
END $$;
