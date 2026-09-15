-- Sample SQL Insert script for PostgreSQL StudySessions (Study Subjects & Sessions)
-- Inserts rich study sessions across multiple technical subjects with ratings, topics, and notes
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
        INSERT INTO "StudySessions" ("userId", "subject", "topic", "duration", "date", "productivityRating", "notes")
        VALUES
            -- Machine Learning & AI
            (target_user_id, 'Machine Learning & AI', 'Neural Network Architectures & Backpropagation', 90, today_ts - INTERVAL '10 days', 5, 'Implemented custom multi-layer perceptron in PyTorch with loss curves.'),
            (target_user_id, 'Machine Learning & AI', 'Transformer Attention Mechanisms & LLM Fine-Tuning', 120, today_ts - INTERVAL '7 days', 5, 'Studied Multi-Head Self-Attention and LoRA adapters.'),
            (target_user_id, 'Machine Learning & AI', 'Supervised Learning Algorithms (Random Forests & XGBoost)', 60, today_ts - INTERVAL '3 days', 4, 'Tuned hyperparameters using cross-validation on tabular benchmarks.'),

            -- Cloud Computing & DevOps
            (target_user_id, 'Cloud Computing & DevOps', 'AWS ECS Fargate & Container Orchestration', 75, today_ts - INTERVAL '9 days', 4, 'Configured task definitions, VPC endpoints, and Application Load Balancer.'),
            (target_user_id, 'Cloud Computing & DevOps', 'Terraform Infrastructure as Code (IaC) Pipelines', 90, today_ts - INTERVAL '6 days', 5, 'Provisioned multi-region PostgreSQL RDS cluster and Redis cache.'),
            (target_user_id, 'Cloud Computing & DevOps', 'CI/CD Automation with GitHub Actions & Docker', 60, today_ts - INTERVAL '2 days', 4, 'Set up automated unit testing, linting, and staging container deployment.'),

            -- System Design & Architecture
            (target_user_id, 'System Design & Architecture', 'Distributed Caching Strategies & Redis Invalidation', 80, today_ts - INTERVAL '8 days', 5, 'Analyzed write-through vs cache-aside strategies and TTL expiration.'),
            (target_user_id, 'System Design & Architecture', 'Event-Driven Microservices with Apache Kafka', 105, today_ts - INTERVAL '5 days', 5, 'Designed pub/sub event schemas and consumer offset commit patterns.'),
            (target_user_id, 'System Design & Architecture', 'Database Sharding, Partitioning & Replication', 90, today_ts - INTERVAL '1 day', 4, 'Explored consistent hashing and horizontal read-replica failovers.'),

            -- Data Structures & Algorithms
            (target_user_id, 'Data Structures & Algorithms', 'Dynamic Programming & Memoization Patterns', 75, today_ts - INTERVAL '9 days', 4, 'Solved 3 medium/hard DP problems on LeetCode focusing on knapsack variations.'),
            (target_user_id, 'Data Structures & Algorithms', 'Graph Traversal (Dijkstra, Topological Sort & BFS/DFS)', 90, today_ts - INTERVAL '4 days', 5, 'Mastered shortest path algorithm implementations and DAG cycle detection.'),

            -- Full-Stack Web Development
            (target_user_id, 'Full-Stack Web Development', 'React Server Components & Next.js App Router', 90, today_ts - INTERVAL '8 days', 5, 'Built responsive dashboard with suspense streaming and server actions.'),
            (target_user_id, 'Full-Stack Web Development', 'TypeScript Advanced Type System & Generics', 60, today_ts - INTERVAL '4 days', 4, 'Practiced conditional types, template literal types, and inference guards.'),
            (target_user_id, 'Full-Stack Web Development', 'High-Throughput Node.js & Prisma Query Optimization', 75, today_ts - INTERVAL '1 day', 5, 'Indexed foreign keys and reduced N+1 query overhead in API routes.'),

            -- Cybersecurity & Compliance
            (target_user_id, 'Cybersecurity & Compliance', 'OAuth2.0, OpenID Connect & JWT Rotation', 60, today_ts - INTERVAL '6 days', 5, 'Configured secure token refresh cycle with HTTP-only cookie storage.'),
            (target_user_id, 'Cybersecurity & Compliance', 'API Rate Limiting, OWASP Top 10 & Sanitization', 45, today_ts, 4, 'Implemented express-rate-limit and SQL injection defense middleware.');

        RAISE NOTICE 'Successfully inserted sample study sessions & subjects for user ID: %', target_user_id;
    END IF;
END $$;
