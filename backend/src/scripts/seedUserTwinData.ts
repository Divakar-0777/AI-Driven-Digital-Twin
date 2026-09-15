import { PrismaClient } from '@prisma/client';
import { DigitalTwinService } from '../services/DigitalTwinService';
import { AiRecommendationService } from '../services/AiRecommendationService';

const prisma = new PrismaClient();

async function seedUserData() {
  console.log('Starting Digital Twin Data Seeding for all registered users...');

  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('No users found in database.');
    return;
  }

  for (const user of users) {
    console.log(`\n========================================`);
    console.log(`Processing User: ${user.email} (ID: ${user.id})`);
    console.log(`========================================`);

    // 1. Habits (Past 7 days + today)
    const existingHabits = await prisma.habit.count({ where: { userId: user.id } });
    if (existingHabits === 0) {
      console.log('Seeding Habits...');
      const today = new Date();
      const habitItems: Array<{ name: string; targetFrequency: string; completed: boolean; date: Date; userId: string }> = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        habitItems.push(
          { userId: user.id, name: 'Morning Exercise & Stretch', targetFrequency: 'Daily', completed: i % 2 === 0, date: d },
          { userId: user.id, name: 'Read Technical Books (20 mins)', targetFrequency: 'Daily', completed: i !== 3, date: d },
          { userId: user.id, name: 'Mindfulness & Meditation (10 mins)', targetFrequency: 'Daily', completed: i % 3 !== 0, date: d },
          { userId: user.id, name: 'Drink 3 Liters Water', targetFrequency: 'Daily', completed: true, date: d },
          { userId: user.id, name: 'Deep Work / Coding Session (1 hr)', targetFrequency: 'Daily', completed: i !== 5, date: d },
          { userId: user.id, name: 'Sleep by 11:00 PM', targetFrequency: 'Daily', completed: i % 2 === 1, date: d }
        );
      }

      habitItems.push(
        { userId: user.id, name: 'Gym Strength Training (4x/Week)', targetFrequency: '4x/Week', completed: true, date: today },
        { userId: user.id, name: 'Weekly Financial Review & Budget Audit', targetFrequency: 'Weekly', completed: true, date: today },
        { userId: user.id, name: 'System Architecture Deep Dive', targetFrequency: 'Weekly', completed: false, date: today }
      );

      for (const item of habitItems) {
        await prisma.habit.create({ data: item });
      }
      console.log(`Inserted ${habitItems.length} habit records.`);
    } else {
      console.log(`User already has ${existingHabits} habits.`);
    }

    // 2. Study Sessions & Subjects
    const existingStudy = await prisma.studySession.count({ where: { userId: user.id } });
    if (existingStudy === 0) {
      console.log('Seeding Study Sessions & Subjects...');
      const now = new Date();
      const studyList = [
        { subject: 'Machine Learning & AI', topic: 'Neural Network Architectures & Backpropagation', duration: 90, daysAgo: 8, rating: 5, notes: 'Implemented custom multi-layer perceptron in PyTorch with loss curves.' },
        { subject: 'Machine Learning & AI', topic: 'Transformer Attention Mechanisms & LLM Fine-Tuning', duration: 120, daysAgo: 5, rating: 5, notes: 'Studied Multi-Head Self-Attention and LoRA adapters.' },
        { subject: 'Machine Learning & AI', topic: 'Supervised Learning Algorithms (Random Forests & XGBoost)', duration: 60, daysAgo: 2, rating: 4, notes: 'Tuned hyperparameters using cross-validation on tabular benchmarks.' },
        { subject: 'Cloud Computing & DevOps', topic: 'AWS ECS Fargate & Container Orchestration', duration: 75, daysAgo: 7, rating: 4, notes: 'Configured task definitions, VPC endpoints, and Application Load Balancer.' },
        { subject: 'Cloud Computing & DevOps', topic: 'Terraform Infrastructure as Code (IaC) Pipelines', duration: 90, daysAgo: 4, rating: 5, notes: 'Provisioned multi-region PostgreSQL RDS cluster and Redis cache.' },
        { subject: 'Cloud Computing & DevOps', topic: 'CI/CD Automation with GitHub Actions & Docker', duration: 60, daysAgo: 1, rating: 4, notes: 'Set up automated unit testing, linting, and staging container deployment.' },
        { subject: 'System Design & Architecture', topic: 'Distributed Caching Strategies & Redis Invalidation', duration: 80, daysAgo: 6, rating: 5, notes: 'Analyzed write-through vs cache-aside strategies and TTL expiration.' },
        { subject: 'System Design & Architecture', topic: 'Event-Driven Microservices with Apache Kafka', duration: 105, daysAgo: 3, rating: 5, notes: 'Designed pub/sub event schemas and consumer offset commit patterns.' },
        { subject: 'Data Structures & Algorithms', topic: 'Dynamic Programming & Memoization Patterns', duration: 75, daysAgo: 5, rating: 4, notes: 'Solved 3 medium/hard DP problems on LeetCode focusing on knapsack variations.' },
        { subject: 'Data Structures & Algorithms', topic: 'Graph Traversal (Dijkstra, Topological Sort & BFS/DFS)', duration: 90, daysAgo: 2, rating: 5, notes: 'Mastered shortest path algorithm implementations and DAG cycle detection.' },
        { subject: 'Full-Stack Web Development', topic: 'React Server Components & Next.js App Router', duration: 90, daysAgo: 4, rating: 5, notes: 'Built responsive dashboard with suspense streaming and server actions.' },
        { subject: 'Full-Stack Web Development', topic: 'TypeScript Advanced Type System & Generics', duration: 60, daysAgo: 1, rating: 4, notes: 'Practiced conditional types, template literal types, and inference guards.' },
        { subject: 'Cybersecurity & Compliance', topic: 'OAuth2.0, OpenID Connect & JWT Rotation', duration: 60, daysAgo: 3, rating: 5, notes: 'Configured secure token refresh cycle with HTTP-only cookie storage.' },
        { subject: 'Cybersecurity & Compliance', topic: 'API Rate Limiting, OWASP Top 10 & Sanitization', duration: 45, daysAgo: 0, rating: 4, notes: 'Implemented express-rate-limit and SQL injection defense middleware.' }
      ];

      for (const item of studyList) {
        const d = new Date(now);
        d.setDate(d.getDate() - item.daysAgo);
        await prisma.studySession.create({
          data: {
            userId: user.id,
            subject: item.subject,
            topic: item.topic,
            duration: item.duration,
            productivityRating: item.rating,
            notes: item.notes,
            date: d
          }
        });
      }
      console.log(`Inserted ${studyList.length} study sessions across 6 subjects.`);
    } else {
      console.log(`User already has ${existingStudy} study sessions.`);
    }

    // 3. Goals
    const existingGoals = await prisma.goal.count({ where: { userId: user.id } });
    if (existingGoals === 0) {
      console.log('Seeding Goals...');
      const goalsList = [
        {
          goalName: 'AWS Solutions Architect Certification',
          description: 'Study cloud patterns and pass the official AWS SAA-C03 certification exam',
          goalType: 'ACADEMIC',
          targetValue: 100,
          currentValue: 75,
          unit: 'percent',
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          priority: 'HIGH',
          status: 'ACTIVE',
          progressPercent: 75.0,
          riskLevel: 'LOW',
          aiRecommendation: 'You are on track. Maintain 2 hours of weekly cloud mock exam practice.'
        },
        {
          goalName: 'Master Data Structures & Algorithms',
          description: 'Solve 150 LeetCode problems covering DP, Trees, Graphs, and Heaps',
          goalType: 'ACADEMIC',
          targetValue: 150,
          currentValue: 92,
          unit: 'problems',
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          priority: 'MEDIUM',
          status: 'ACTIVE',
          progressPercent: 61.3,
          riskLevel: 'LOW',
          aiRecommendation: 'Focus on dynamic programming problems to achieve full mastery.'
        },
        {
          goalName: 'Build 6-Month Emergency Fund',
          description: 'Accumulate $15,000 liquid safety buffer in high-yield savings account',
          goalType: 'FINANCIAL',
          targetValue: 15000,
          currentValue: 12500,
          unit: 'dollars',
          deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          priority: 'HIGH',
          status: 'ACTIVE',
          progressPercent: 83.3,
          riskLevel: 'LOW',
          aiRecommendation: 'Excellent progress. Monthly $500 contribution will complete this ahead of time.'
        },
        {
          goalName: 'Upgrade Engineering Workstation',
          description: 'Save for high-performance workstation for local AI model inference & compilation',
          goalType: 'FINANCIAL',
          targetValue: 2500,
          currentValue: 1800,
          unit: 'dollars',
          deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          priority: 'MEDIUM',
          status: 'ACTIVE',
          progressPercent: 72.0,
          riskLevel: 'LOW',
          aiRecommendation: 'On schedule to purchase in 2.5 months.'
        },
        {
          goalName: 'Run 5K Under 25 Minutes',
          description: 'Build cardiovascular endurance with structured interval running 3x per week',
          goalType: 'FITNESS',
          targetValue: 25,
          currentValue: 27.2,
          unit: 'minutes',
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          priority: 'MEDIUM',
          status: 'ACTIVE',
          progressPercent: 68.0,
          riskLevel: 'MEDIUM',
          aiRecommendation: 'Increase sprint interval training on Tuesdays to shave remaining 2.2 minutes.'
        },
        {
          goalName: 'Launch SaaS Side Project MVP',
          description: 'Architect, develop, and deploy AI productivity tool to first 100 beta users',
          goalType: 'CAREER',
          targetValue: 100,
          currentValue: 60,
          unit: 'percent',
          deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
          priority: 'HIGH',
          status: 'ACTIVE',
          progressPercent: 60.0,
          riskLevel: 'LOW',
          aiRecommendation: 'Backend APIs and frontend UI complete; focus on user auth and billing.'
        },
        {
          goalName: 'Read 24 Non-Fiction Books',
          description: 'Read 24 books on system architecture, psychology, finance, and productivity',
          goalType: 'PERSONAL',
          targetValue: 24,
          currentValue: 14,
          unit: 'books',
          deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          priority: 'LOW',
          status: 'ACTIVE',
          progressPercent: 58.3,
          riskLevel: 'LOW',
          aiRecommendation: 'On track with 2 books per month reading habit.'
        },
        {
          goalName: 'Maintain Daily 10-Minute Meditation Streak',
          description: 'Build mindfulness resilience and stress reduction with daily morning practice',
          goalType: 'LIFESTYLE',
          targetValue: 60,
          currentValue: 42,
          unit: 'days',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          priority: 'MEDIUM',
          status: 'ACTIVE',
          progressPercent: 70.0,
          riskLevel: 'LOW',
          aiRecommendation: 'Current streak is 14 days without interruptions.'
        }
      ];

      for (const g of goalsList) {
        await prisma.goal.create({
          data: {
            userId: user.id,
            ...g
          }
        });
      }
      console.log(`Inserted ${goalsList.length} generic goals.`);
    }

    // 4. Financial Goals
    const existingFinGoals = await prisma.financialGoal.count({ where: { userId: user.id } });
    if (existingFinGoals === 0) {
      console.log('Seeding Financial Goals...');
      await prisma.financialGoal.createMany({
        data: [
          {
            userId: user.id,
            goalName: 'Emergency Fund ($15k)',
            targetAmount: 15000.0,
            currentAmount: 12500.0,
            monthlyContribution: 500.0,
            targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            priority: 'HIGH',
            goalCategory: 'EMERGENCY_FUND',
            status: 'ACTIVE'
          },
          {
            userId: user.id,
            goalName: 'Engineering Workstation / Laptop',
            targetAmount: 2500.0,
            currentAmount: 1800.0,
            monthlyContribution: 300.0,
            targetDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
            priority: 'MEDIUM',
            goalCategory: 'LAPTOP',
            status: 'ACTIVE'
          },
          {
            userId: user.id,
            goalName: 'Annual Travel & Vacation Fund',
            targetAmount: 3000.0,
            currentAmount: 1400.0,
            monthlyContribution: 250.0,
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            priority: 'LOW',
            goalCategory: 'TRAVEL',
            status: 'ACTIVE'
          }
        ]
      });
      console.log('Inserted financial goals.');
    }

    // 5. Fitness Activities
    const existingFitness = await prisma.fitnessActivity.count({ where: { userId: user.id } });
    if (existingFitness === 0) {
      console.log('Seeding Fitness Activities...');
      await prisma.fitnessActivity.createMany({
        data: [
          { userId: user.id, activityType: 'Running', duration: 35, caloriesBurned: 380.0, activityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { userId: user.id, activityType: 'Gym Strength Training', duration: 60, caloriesBurned: 460.0, activityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { userId: user.id, activityType: 'Outdoor Cycling', duration: 45, caloriesBurned: 340.0, activityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
        ]
      });
      console.log('Inserted fitness activities.');
    }

    // 6. Recalculate Twin State & AI Recommendations
    console.log('Recalculating Digital Twin State & AI Recommendations...');
    await DigitalTwinService.recalculateTwinState(user.id);
    await AiRecommendationService.generateRecommendations(user.id);
    console.log('Done recalculating for user.');
  }

  console.log('\n========================================');
  console.log('All Users Digital Twin data seeded successfully!');
  console.log('========================================');
}

seedUserData()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
