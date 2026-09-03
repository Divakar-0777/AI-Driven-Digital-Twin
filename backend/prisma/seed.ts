import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

async function main() {
  console.log('Seeding database...');

  // Clear existing records in reverse dependency order
  await prisma.fitnessActivity.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.digitalTwinState.deleteMany();
  await prisma.analyticsSummary.deleteMany();
  await prisma.predictionHistory.deleteMany();
  await prisma.activityHistory.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.financialGoal.deleteMany();
  await prisma.financialSimulation.deleteMany();
  await prisma.decisionSimulation.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Demo@123', salt);
  const hashedPasswordAlt = await bcrypt.hash('Password123!', salt);

  // ==========================================
  // DEMO USER: demo@digitaltwin.ai
  // ==========================================
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@digitaltwin.ai',
      password: hashedPassword,
    },
  });

  const demoProfile = await prisma.profile.create({
    data: {
      userId: demoUser.id,
      fullName: 'Alex Johnson',
      phoneNumber: '+1-555-0142',
      dateOfBirth: new Date('1996-03-15'),
      occupation: 'Software Engineer',
      educationLevel: 'Bachelor of Computer Science',
      gender: 'Male',
      monthlyIncome: 5500.00,
      monthlyExpenseTarget: 3000.00,
      savings: 12500.00,
      financialGoals: 'Build emergency fund of $15,000, Save for new laptop, Investment portfolio',
      studyGoal: 'Master Full-Stack Development & Cloud Architecture',
      dailyStudyHoursTarget: 2.5,
      fitnessGoal: 'Run 5K in under 25 minutes, Gym 4x per week',
      lifestyleInfo: 'Health-conscious, minimalist, values work-life balance',
      longTermGoals: 'Become a senior engineer within 2 years, achieve financial independence by 35',
      habitGoals: 'Exercise 4x/week, Read 20 mins daily, Meditate 10 mins, Code practice 1hr',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  console.log(`Demo user created: ${demoProfile.fullName} (${demoUser.email})`);

  // ==========================================
  // SECOND USER: alex.carter@example.com
  // ==========================================
  const alexUser = await prisma.user.create({
    data: {
      email: 'alex.carter@example.com',
      password: hashedPasswordAlt,
    },
  });

  await prisma.profile.create({
    data: {
      userId: alexUser.id,
      fullName: 'Alex Carter',
      phoneNumber: '+1-555-0199',
      dateOfBirth: new Date('1995-06-15'),
      occupation: 'Software Engineer',
      educationLevel: 'Bachelor of Science',
      monthlyIncome: 5000.00,
      monthlyExpenseTarget: 2500.00,
      studyGoal: 'Mastering Machine Learning & Neural Networks',
      dailyStudyHoursTarget: 2.5,
      habitGoals: 'Workout 4x/week, Read 15 mins daily, Meditate',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  console.log(`Secondary user created: Alex Carter`);

  // ==========================================
  // SEED FINANCIAL TRANSACTIONS (12 months of data for demo user)
  // ==========================================
  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Bonus'];
  const expenseCategories = ['Food', 'Transport', 'Education', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Investment', 'Other'];

  const transactions = [];

  // Generate 12 months of data
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - monthsAgo);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // Monthly salary
    transactions.push({
      userId: demoUser.id,
      title: 'Monthly Salary',
      category: 'Salary',
      type: 'INCOME',
      amount: randomAmount(5200, 5800),
      date: new Date(year, month, 1, 9, 0),
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly direct deposit from employer',
    });

    // Occasional freelance income
    if (Math.random() > 0.4) {
      transactions.push({
        userId: demoUser.id,
        title: 'Freelance Project',
        category: 'Freelance',
        type: 'INCOME',
        amount: randomAmount(400, 1200),
        date: randomDate(new Date(year, month, 5), new Date(year, month, 25)),
        paymentMethod: 'PayPal',
        notes: 'Side project payment',
      });
    }

    // Occasional investment income
    if (Math.random() > 0.7) {
      transactions.push({
        userId: demoUser.id,
        title: 'Dividend Payment',
        category: 'Investment',
        type: 'INCOME',
        amount: randomAmount(50, 200),
        date: randomDate(new Date(year, month, 10), new Date(year, month, 20)),
        paymentMethod: 'Bank Transfer',
        notes: 'Quarterly dividend',
      });
    }

    // Rent
    transactions.push({
      userId: demoUser.id,
      title: 'Rent Payment',
      category: 'Bills',
      type: 'EXPENSE',
      amount: 1400.00,
      date: new Date(year, month, 1, 8, 0),
      paymentMethod: 'ACH Transfer',
      notes: 'Monthly apartment rent',
    });

    // Utilities
    transactions.push({
      userId: demoUser.id,
      title: 'Electric & Internet',
      category: 'Bills',
      type: 'EXPENSE',
      amount: randomAmount(120, 180),
      date: new Date(year, month, 5, 10, 0),
      paymentMethod: 'Auto-Pay',
      notes: 'Monthly utilities',
    });

    // Food expenses (3-5 per month)
    const foodCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < foodCount; i++) {
      transactions.push({
        userId: demoUser.id,
        title: ['Grocery Store', 'Restaurant Dinner', 'Coffee Shop', 'Lunch Out', 'Meal Kit'][Math.floor(Math.random() * 5)],
        category: 'Food',
        type: 'EXPENSE',
        amount: randomAmount(8, 85),
        date: randomDate(new Date(year, month, 1), new Date(year, month, 28)),
        paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'Debit Card',
        notes: null,
      });
    }

    // Transport
    transactions.push({
      userId: demoUser.id,
      title: 'Gas Station',
      category: 'Transport',
      type: 'EXPENSE',
      amount: randomAmount(35, 65),
      date: randomDate(new Date(year, month, 3), new Date(year, month, 25)),
      paymentMethod: 'Debit Card',
      notes: null,
    });

    // Education
    if (Math.random() > 0.3) {
      transactions.push({
        userId: demoUser.id,
        title: ['Udemy Course', 'Coursera Subscription', 'Technical Book', 'Online Workshop'][Math.floor(Math.random() * 4)],
        category: 'Education',
        type: 'EXPENSE',
        amount: randomAmount(15, 120),
        date: randomDate(new Date(year, month, 5), new Date(year, month, 25)),
        paymentMethod: 'Credit Card',
        notes: null,
      });
    }

    // Entertainment
    if (Math.random() > 0.3) {
      transactions.push({
        userId: demoUser.id,
        title: ['Netflix Subscription', 'Movie Tickets', 'Spotify', 'Gaming Purchase'][Math.floor(Math.random() * 4)],
        category: 'Entertainment',
        type: 'EXPENSE',
        amount: randomAmount(10, 50),
        date: randomDate(new Date(year, month, 1), new Date(year, month, 28)),
        paymentMethod: 'Credit Card',
        notes: null,
      });
    }

    // Healthcare
    if (Math.random() > 0.7) {
      transactions.push({
        userId: demoUser.id,
        title: 'Gym Membership',
        category: 'Healthcare',
        type: 'EXPENSE',
        amount: 45.00,
        date: new Date(year, month, 1, 12, 0),
        paymentMethod: 'Auto-Pay',
        notes: 'Monthly gym membership',
      });
    }

    // Shopping
    if (Math.random() > 0.5) {
      transactions.push({
        userId: demoUser.id,
        title: ['Amazon Purchase', 'Clothing Store', 'Home Supplies', 'Tech Accessories'][Math.floor(Math.random() * 4)],
        category: 'Shopping',
        type: 'EXPENSE',
        amount: randomAmount(20, 200),
        date: randomDate(new Date(year, month, 5), new Date(year, month, 25)),
        paymentMethod: 'Credit Card',
        notes: null,
      });
    }

    // Occasional investment
    if (Math.random() > 0.6) {
      transactions.push({
        userId: demoUser.id,
        title: 'Index Fund Contribution',
        category: 'Investment',
        type: 'EXPENSE',
        amount: randomAmount(200, 500),
        date: randomDate(new Date(year, month, 10), new Date(year, month, 20)),
        paymentMethod: 'Bank Transfer',
        notes: 'Monthly investment contribution',
      });
    }
  }

  for (const tx of transactions) {
    await prisma.financialTransaction.create({ data: tx });
  }
  console.log(`Seeded ${transactions.length} financial transactions for demo user.`);

  // ==========================================
  // SEED STUDY SESSIONS (6 months of data)
  // ==========================================
  const subjects = ['Full-Stack Development', 'Cloud Architecture', 'System Design', 'Data Structures', 'Machine Learning', 'DevOps', 'TypeScript', 'React Advanced'];
  const topics: Record<string, string[]> = {
    'Full-Stack Development': ['REST API Design', 'GraphQL Schemas', 'Authentication Flows', 'Microservices Pattern'],
    'Cloud Architecture': ['AWS Lambda', 'Docker Containers', 'Kubernetes Basics', 'CI/CD Pipelines'],
    'System Design': ['Load Balancing', 'Rate Limiters', 'Database Sharding', 'Caching Strategies'],
    'Data Structures': ['Binary Trees', 'Graph Algorithms', 'Dynamic Programming', 'Hash Tables'],
    'Machine Learning': ['Linear Regression', 'Neural Networks', 'Random Forests', 'NLP Basics'],
    'DevOps': ['Terraform IaC', 'GitHub Actions', 'Monitoring & Logging', 'Security Auditing'],
    'TypeScript': ['Advanced Types', 'Generics', 'Decorators', 'Module Systems'],
    'React Advanced': ['Custom Hooks', 'Context API', 'Performance Optimization', 'Server Components'],
  };

  const studySessions = [];
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - monthsAgo);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // Generate 15-25 study sessions per month
    const sessionCount = Math.floor(Math.random() * 11) + 15;
    for (let i = 0; i < sessionCount; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const topicList = topics[subject] || ['General Review'];
      const topic = topicList[Math.floor(Math.random() * topicList.length)];
      const hour = Math.floor(Math.random() * 6) + 16; // 4 PM to 9 PM
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5 (realistic for a motivated learner)

      studySessions.push({
        userId: demoUser.id,
        subject,
        topic,
        duration: Math.floor(Math.random() * 90) + 30, // 30-120 minutes
        date: randomDate(new Date(year, month, 1), new Date(year, month, 28)),
        productivityRating: rating,
        notes: null,
      });
    }
  }

  for (const session of studySessions) {
    await prisma.studySession.create({ data: session });
  }
  console.log(`Seeded ${studySessions.length} study sessions for demo user.`);

  // ==========================================
  // SEED HABITS (6 months of daily data)
  // ==========================================
  const habitDefs = [
    { name: 'Exercise', targetFrequency: '4x/Week' },
    { name: 'Read 20 mins', targetFrequency: 'Daily' },
    { name: 'Meditate 10 mins', targetFrequency: 'Daily' },
    { name: 'Drink 3L Water', targetFrequency: 'Daily' },
    { name: 'Code Practice 1hr', targetFrequency: 'Daily' },
    { name: 'Sleep before 11pm', targetFrequency: 'Daily' },
  ];

  const habits = [];
  for (let daysAgo = 180; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    for (const hd of habitDefs) {
      let completed: boolean;
      if (hd.name === 'Exercise') {
        // 4x/week means ~57% chance on any given day
        completed = Math.random() < 0.57;
      } else if (hd.name === 'Code Practice 1hr') {
        completed = Math.random() < 0.65;
      } else {
        // Daily habits - 70-85% completion rate (realistic)
        completed = Math.random() < 0.75;
      }

      habits.push({
        userId: demoUser.id,
        name: hd.name,
        targetFrequency: hd.targetFrequency,
        completed,
        date,
      });
    }
  }

  for (const habit of habits) {
    await prisma.habit.create({ data: habit });
  }
  console.log(`Seeded ${habits.length} habit logs for demo user.`);

  // ==========================================
  // SEED GOALS
  // ==========================================
  await prisma.goal.createMany({
    data: [
      {
        userId: demoUser.id,
        goalName: 'Emergency Fund',
        description: 'Build a 6-month emergency fund for financial security',
        goalType: 'FINANCIAL',
        targetValue: 15000,
        currentValue: 12500,
        unit: 'dollars',
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        status: 'ACTIVE',
        progressPercent: 83.3,
        riskLevel: 'LOW',
      },
      {
        userId: demoUser.id,
        goalName: 'New Laptop',
        description: 'Save for a MacBook Pro for development work',
        goalType: 'FINANCIAL',
        targetValue: 2500,
        currentValue: 1800,
        unit: 'dollars',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
        status: 'ACTIVE',
        progressPercent: 72.0,
        riskLevel: 'LOW',
      },
      {
        userId: demoUser.id,
        goalName: 'AWS Solutions Architect',
        description: 'Pass the AWS Solutions Architect certification exam',
        goalType: 'ACADEMIC',
        targetValue: 100,
        currentValue: 65,
        unit: 'percent',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        status: 'ACTIVE',
        progressPercent: 65.0,
        riskLevel: 'MEDIUM',
      },
      {
        userId: demoUser.id,
        goalName: 'Run 5K Under 25 Minutes',
        description: 'Improve running speed to complete 5K in under 25 minutes',
        goalType: 'FITNESS',
        targetValue: 25,
        currentValue: 27.5,
        unit: 'minutes',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
        status: 'ACTIVE',
        progressPercent: 50.0,
        riskLevel: 'MEDIUM',
      },
      {
        userId: demoUser.id,
        goalName: 'Read 24 Books This Year',
        description: 'Read 24 technical and personal development books',
        goalType: 'PERSONAL',
        targetValue: 24,
        currentValue: 14,
        unit: 'books',
        deadline: new Date(new Date().getFullYear(), 11, 31),
        priority: 'LOW',
        status: 'ACTIVE',
        progressPercent: 58.3,
        riskLevel: 'LOW',
      },
      {
        userId: demoUser.id,
        goalName: 'Launch Side Project',
        description: 'Build and launch a SaaS side project to production',
        goalType: 'CAREER',
        targetValue: 100,
        currentValue: 40,
        unit: 'percent',
        deadline: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
        status: 'ACTIVE',
        progressPercent: 40.0,
        riskLevel: 'MEDIUM',
      },
    ],
  });
  console.log('Seeded goals for demo user.');

  // ==========================================
  // SEED FINANCIAL GOALS
  // ==========================================
  await prisma.financialGoal.createMany({
    data: [
      {
        userId: demoUser.id,
        goalName: 'Emergency Fund',
        targetAmount: 15000,
        currentAmount: 12500,
        monthlyContribution: 500,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        goalCategory: 'EMERGENCY_FUND',
        status: 'ACTIVE',
      },
      {
        userId: demoUser.id,
        goalName: 'New Laptop',
        targetAmount: 2500,
        currentAmount: 1800,
        monthlyContribution: 300,
        targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
        goalCategory: 'LAPTOP',
        status: 'ACTIVE',
      },
    ],
  });
  console.log('Seeded financial goals.');

  // ==========================================
  // SEED BUDGETS
  // ==========================================
  await prisma.budget.createMany({
    data: [
      { userId: demoUser.id, category: 'Food', monthlyLimit: 400, currentSpending: 320, period: 'MONTHLY', status: 'ACTIVE' },
      { userId: demoUser.id, category: 'Transport', monthlyLimit: 150, currentSpending: 85, period: 'MONTHLY', status: 'ACTIVE' },
      { userId: demoUser.id, category: 'Entertainment', monthlyLimit: 100, currentSpending: 60, period: 'MONTHLY', status: 'ACTIVE' },
      { userId: demoUser.id, category: 'Shopping', monthlyLimit: 200, currentSpending: 150, period: 'MONTHLY', status: 'ACTIVE' },
      { userId: demoUser.id, category: 'Education', monthlyLimit: 150, currentSpending: 95, period: 'MONTHLY', status: 'ACTIVE' },
    ],
  });
  console.log('Seeded budgets.');

  // ==========================================
  // SEED DIGITAL TWIN STATE
  // ==========================================
  await prisma.digitalTwinState.create({
    data: {
      userId: demoUser.id,
      productivityScore: 82,
      financialHealthScore: 85,
      habitScore: 78,
      studyScore: 80,
      goalScore: 65,
      overallScore: 78,
      twinEmoticon: '🚀',
      twinStatus: 'Digital Twin is Thriving! Highly productive with great financial health and consistent habits.',
      personalitySummary: 'Alex is a disciplined and growth-oriented individual who values continuous learning and financial prudence. They demonstrate strong consistency in daily habits and maintain a balanced approach to work and personal development.',
      behaviourSummary: 'Alex shows high productivity during evening study sessions (4-9 PM), maintains excellent savings discipline (40%+ savings rate), and demonstrates strong habit consistency (75%+ completion rate). Areas for improvement: reduce spontaneous shopping expenses and increase exercise frequency.',
    },
  });
  console.log('Seeded Digital Twin state.');

  // ==========================================
  // SEED AI RECOMMENDATIONS
  // ==========================================
  await prisma.aiRecommendation.createMany({
    data: [
      {
        userId: demoUser.id,
        category: 'FINANCE',
        recommendationText: 'Your savings rate is excellent at over 40%. Consider increasing your index fund contributions by $200/month to accelerate long-term wealth building.',
        reason: 'High savings rate detected with surplus cash flow',
        expectedImpact: 'Could increase annual investment returns by ~$2,400',
        risk: 'LOW',
        suggestedAction: 'Set up automatic $200/month transfer to index fund',
        impactLevel: 'MEDIUM',
      },
      {
        userId: demoUser.id,
        category: 'STUDY',
        recommendationText: 'You consistently study best between 6-8 PM. Consider scheduling your most challenging topics (System Design, ML) during this window for maximum retention.',
        reason: 'Productivity ratings peak during evening hours',
        expectedImpact: 'Could improve study productivity score by 15-20%',
        risk: 'LOW',
        suggestedAction: 'Block 6-8 PM for complex study topics',
        impactLevel: 'HIGH',
      },
      {
        userId: demoUser.id,
        category: 'HABITS',
        recommendationText: 'Your meditation habit has a 75% completion rate but drops on weekends. Try a shorter 5-minute session on weekends to maintain the streak.',
        reason: 'Weekend meditation completion drops to 50%',
        expectedImpact: 'Could improve overall habit consistency by 5-10%',
        risk: 'LOW',
        suggestedAction: 'Set a weekend-specific 5-minute meditation alarm',
        impactLevel: 'MEDIUM',
      },
      {
        userId: demoUser.id,
        category: 'GOALS',
        recommendationText: 'Your AWS certification goal is 65% complete with 90 days remaining. Increase weekly study allocation by 2 hours to stay on track.',
        reason: 'Goal progress trajectory suggests possible delay',
        expectedImpact: 'On-track completion within deadline',
        risk: 'MEDIUM',
        suggestedAction: 'Add 2 extra study sessions per week focused on AWS topics',
        impactLevel: 'HIGH',
      },
    ],
  });
  console.log('Seeded AI recommendations.');

  // ==========================================
  // SEED NOTIFICATIONS
  // ==========================================
  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Welcome to Digital Twin AI',
        message: 'Your personalized AI Digital Twin is now active! Start adding data to see your twin evolve.',
        type: 'INFO',
        isRead: true,
      },
      {
        userId: demoUser.id,
        title: 'Budget Alert: Shopping',
        message: 'Your shopping expenses this month have reached 75% of your $200 budget. Consider slowing down purchases.',
        type: 'ALERT',
        isRead: false,
      },
      {
        userId: demoUser.id,
        title: 'Achievement Unlocked!',
        message: 'You\'ve maintained your meditation habit for 14 consecutive days! Keep it up!',
        type: 'ACHIEVEMENT',
        isRead: false,
      },
      {
        userId: demoUser.id,
        title: 'Study Streak',
        message: 'You\'ve logged study sessions for 5 consecutive days. Your consistency is improving!',
        type: 'INFO',
        isRead: false,
      },
    ],
  });
  console.log('Seeded notifications.');

  // ==========================================
  // SEED ACTIVITY HISTORY
  // ==========================================
  const activities = [
    { activityType: 'User Registered', description: 'Successfully registered account with email: demo@digitaltwin.ai' },
    { activityType: 'Profile Updated', description: 'Completed initial profile setup with financial and study targets' },
    { activityType: 'Transaction Added', description: 'Added monthly salary income of $5,500' },
    { activityType: 'Transaction Added', description: 'Added rent payment expense of $1,400' },
    { activityType: 'Study Session Added', description: 'Logged study session for Full-Stack Development - REST API Design (90 mins)' },
    { activityType: 'Habit Completed', description: 'Completed habit: Exercise' },
    { activityType: 'Habit Completed', description: 'Completed habit: Read 20 mins' },
    { activityType: 'Goal Created', description: 'Created financial goal: Emergency Fund ($15,000 target)' },
    { activityType: 'Simulation Run', description: 'Ran decision simulation: "Should I buy a new laptop?"' },
    { activityType: 'AI Chat', description: 'Asked AI assistant: Can I afford a $2,500 laptop?' },
  ];

  for (const act of activities) {
    await prisma.activityHistory.create({
      data: {
        userId: demoUser.id,
        ...act,
        timestamp: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      },
    });
  }
  console.log('Seeded activity history.');

  // ==========================================
  // SEED ANALYTICS SUMMARY
  // ==========================================
  await prisma.analyticsSummary.create({
    data: {
      userId: demoUser.id,
      financialHealthScore: 85,
      productivityScore: 82,
      habitScore: 78,
      studyScore: 80,
      goalScore: 65,
      overallAIScore: 78,
    },
  });
  console.log('Seeded analytics summary.');

  // ==========================================
  // SEED DECISION SIMULATION (Demo)
  // ==========================================
  await prisma.decisionSimulation.create({
    data: {
      userId: demoUser.id,
      decision: JSON.stringify({
        decisionName: 'Buy a New Laptop',
        category: 'FINANCIAL',
        action: 'Purchase MacBook Pro',
        parameters: { cost: 2500, financing: false },
        affectedDomains: ['FINANCE', 'STUDY', 'PRODUCTIVITY'],
        horizon: '6 months',
        userPriorities: { FINANCE: 0.4, STUDY: 0.35, PRODUCTIVITY: 0.25 },
      }),
      baseline: JSON.stringify({
        monthlySavings: 2000,
        projectedBalance6Months: 24500,
        studyHoursPerWeek: 15,
      }),
      scenarios: JSON.stringify([
        {
          name: 'Current Path',
          monthlySavings: 2000,
          projectedBalance6Months: 24500,
          studyHoursPerWeek: 15,
          risk: 'LOW',
        },
        {
          name: 'Buy MacBook Pro ($2,500)',
          monthlySavings: 2000,
          projectedBalance6Months: 22000,
          studyHoursPerWeek: 18,
          risk: 'LOW',
        },
        {
          name: 'Buy Refurbished ($1,500)',
          monthlySavings: 2000,
          projectedBalance6Months: 23000,
          studyHoursPerWeek: 16,
          risk: 'LOW',
        },
      ]),
      assumptions: JSON.stringify({
        monthlyIncome: 5500,
        monthlyExpenses: 3000,
        currentSavings: 12500,
        inflationRate: 0.03,
      }),
      outcomes: JSON.stringify({
        finance: { impact: 'Moderate - reduces savings by $2,500 one-time' },
        study: { impact: 'Positive - better hardware for coding sessions' },
        productivity: { impact: 'Positive - faster machine reduces compile times' },
      }),
      comparison: JSON.stringify({
        currentPath: { savings: 24500, goalProgress: '83%', risk: 'Low' },
        buyMacBook: { savings: 22000, goalProgress: '72%', risk: 'Low' },
        buyRefurbished: { savings: 23000, goalProgress: '77%', risk: 'Low' },
      }),
      recommendation: JSON.stringify({
        bestScenario: 'Buy Refurbished ($1,500)',
        summary: 'Purchasing a refurbished laptop offers the best balance between cost and productivity improvement. It preserves more savings while still providing meaningful hardware upgrade.',
        tradeOffs: [
          'MacBook Pro provides best performance but highest cost',
          'Refurbished option saves $1,000 with minimal performance difference',
          'Current path preserves savings but misses productivity gains',
        ],
        ranking: ['Buy Refurbished ($1,500)', 'Buy MacBook Pro ($2,500)', 'Current Path'],
      }),
    },
  });
  console.log('Seeded decision simulation.');

  // ==========================================
  // SEED CHAT CONVERSATION
  // ==========================================
  const conversation = await prisma.chatConversation.create({
    data: {
      userId: demoUser.id,
      title: 'Financial Planning Discussion',
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: 'user',
        content: 'Can I afford a new laptop?',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: 'Based on your current financial data, you have $12,500 in savings with a monthly income of $5,500 and expenses of ~$3,000. A $2,500 laptop purchase is well within your means. Your net monthly savings of ~$2,500 would cover this within one month. Your emergency fund goal is at 83% completion, so you might consider waiting until you reach 100% ($15,000) before making the purchase.',
        mode: 'Deterministic',
      },
      {
        conversationId: conversation.id,
        role: 'user',
        content: 'How much can I save in one year?',
      },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: 'Based on your current income of $5,500/month and expenses of ~$3,000/month, your monthly savings rate is approximately $2,500. Over 12 months, you could save approximately $30,000, assuming no major changes to your income or spending patterns. This would bring your total savings from $12,500 to approximately $42,500.',
        mode: 'Deterministic',
      },
    ],
  });
  console.log('Seeded chat conversation.');

  // ==========================================
  // SEED FITNESS ACTIVITIES
  // ==========================================
  await prisma.fitnessActivity.createMany({
    data: [
      {
        userId: demoUser.id,
        activityType: 'Running',
        duration: 30,
        caloriesBurned: 350.0,
        activityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
      },
      {
        userId: demoUser.id,
        activityType: 'Gym',
        duration: 60,
        caloriesBurned: 450.0,
        activityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoUser.id,
        activityType: 'Cycling',
        duration: 45,
        caloriesBurned: 300.0,
        activityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoUser.id,
        activityType: 'Running',
        duration: 25,
        caloriesBurned: 280.0,
        activityDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoUser.id,
        activityType: 'Gym',
        duration: 75,
        caloriesBurned: 550.0,
        activityDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  console.log('Seeded fitness activities.');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Email: demo@digitaltwin.ai');
  console.log('   Password: Demo@123');
  console.log('\n📋 Secondary Credentials:');
  console.log('   Email: alex.carter@example.com');
  console.log('   Password: Password123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
