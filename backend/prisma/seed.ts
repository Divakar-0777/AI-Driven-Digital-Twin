import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.digitalTwinState.deleteMany();
  await prisma.activityHistory.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Create a Demo User (Alex Carter)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);

  const alexUser = await prisma.user.create({
    data: {
      email: 'alex.carter@example.com',
      password: hashedPassword,
    },
  });

  const alexProfile = await prisma.profile.create({
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

  // Create an Admin User (Admin Admin)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
    },
  });

  await prisma.profile.create({
    data: {
      userId: adminUser.id,
      fullName: 'Admin User',
      occupation: 'System Administrator',
      monthlyIncome: 10000.00,
      monthlyExpenseTarget: 4000.00,
    },
  });

  console.log(`Users created: ${alexProfile.fullName} (alex.carter@example.com) & Admin (admin@example.com)`);

  // Seed Financial Transactions for Alex
  const transactions = [
    {
      title: 'Monthly Salary Payment',
      category: 'Salary',
      type: 'INCOME',
      amount: 5000.00,
      date: new Date('2026-07-01T10:00:00Z'),
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly direct deposit from employer',
    },
    {
      title: 'Whole Foods Grocery Run',
      category: 'Food & Groceries',
      type: 'EXPENSE',
      amount: 150.00,
      date: new Date('2026-07-03T15:30:00Z'),
      paymentMethod: 'Credit Card',
      notes: 'Weekly groceries including meal prep supplies',
    },
    {
      title: 'Rent Payment',
      category: 'Housing',
      type: 'EXPENSE',
      amount: 1800.00,
      date: new Date('2026-07-01T08:00:00Z'),
      paymentMethod: 'ACH Transfer',
      notes: 'Apartment rent payment',
    },
    {
      title: 'Coffee with Mentee',
      category: 'Food & Groceries',
      type: 'EXPENSE',
      amount: 12.50,
      date: new Date('2026-07-05T10:15:00Z'),
      paymentMethod: 'Debit Card',
      notes: 'Local coffee shop meeting',
    },
    {
      title: 'Freelance Design Project',
      category: 'Freelance',
      type: 'INCOME',
      amount: 850.00,
      date: new Date('2026-07-12T14:00:00Z'),
      paymentMethod: 'PayPal',
      notes: 'Landing page redesign client payment',
    },
    {
      title: 'Gym Membership Renewal',
      category: 'Health & Fitness',
      type: 'EXPENSE',
      amount: 50.00,
      date: new Date('2026-07-10T12:00:00Z'),
      paymentMethod: 'Credit Card',
      notes: 'Monthly standard gym tier membership',
    },
  ];

  for (const tx of transactions) {
    await prisma.financialTransaction.create({
      data: {
        userId: alexUser.id,
        ...tx,
      },
    });
  }
  console.log('Seeded financial transactions.');

  // Seed Study Sessions for Alex
  const studySessions = [
    {
      subject: 'Machine Learning',
      topic: 'Supervised Learning Algorithms',
      duration: 120, // 2 hours
      date: new Date('2026-07-20T18:00:00Z'),
      productivityRating: 4,
      notes: 'Reviewed linear regression, decision trees, and random forests models.',
    },
    {
      subject: 'Neural Networks',
      topic: 'Backpropagation Algorithm',
      duration: 90, // 1.5 hours
      date: new Date('2026-07-21T19:30:00Z'),
      productivityRating: 5,
      notes: 'Coded backpropagation from scratch in Python. High understanding today.',
    },
    {
      subject: 'System Design',
      topic: 'Rate Limiters & Load Balancing',
      duration: 60, // 1 hour
      date: new Date('2026-07-23T20:00:00Z'),
      productivityRating: 3,
      notes: 'Read System Design Interview Book chapters on Token Bucket algorithms.',
    },
  ];

  for (const session of studySessions) {
    await prisma.studySession.create({
      data: {
        userId: alexUser.id,
        ...session,
      },
    });
  }
  console.log('Seeded study sessions.');

  // Seed Habits for Alex
  const habits = [
    {
      name: 'Drink 3L of Water',
      targetFrequency: 'Daily',
      completed: true,
      date: new Date('2026-07-25T00:00:00Z'),
    },
    {
      name: 'Read Technical Book for 15m',
      targetFrequency: 'Daily',
      completed: true,
      date: new Date('2026-07-25T00:00:00Z'),
    },
    {
      name: '30-Minute Gym Session',
      targetFrequency: '4x/Week',
      completed: false,
      date: new Date('2026-07-25T00:00:00Z'),
    },
    {
      name: 'Meditate for 10 minutes',
      targetFrequency: 'Daily',
      completed: true,
      date: new Date('2026-07-26T00:00:00Z'),
    },
  ];

  for (const habit of habits) {
    await prisma.habit.create({
      data: {
        userId: alexUser.id,
        ...habit,
      },
    });
  }
  console.log('Seeded habits.');

  // Seed Digital Twin State for Alex
  await prisma.digitalTwinState.create({
    data: {
      userId: alexUser.id,
      productivityScore: 78,
      financialHealthScore: 82,
      twinEmoticon: '🚀',
      twinStatus: 'Digital Twin is Thriving! Highly productive, focused, and maintaining great savings.',
    },
  });
  console.log('Seeded Digital Twin state.');

  // Seed AI Recommendations for Alex
  const recommendations = [
    {
      category: 'FINANCE',
      recommendationText: 'Great job saving 65% of your income! Allocate surplus funds to high-yield savings to beat inflation.',
      impactLevel: 'MEDIUM',
      isApplied: false,
    },
    {
      category: 'STUDY',
      recommendationText: 'You are averaging lower than your daily study target (2.5 hrs). Try scheduling short, focused 45-minute blocks.',
      impactLevel: 'HIGH',
      isApplied: false,
    },
    {
      category: 'HABITS',
      recommendationText: 'Excellent habit completion consistency! Challenge yourself by adding one new target routine.',
      impactLevel: 'LOW',
      isApplied: false,
    },
  ];

  for (const rec of recommendations) {
    await prisma.aiRecommendation.create({
      data: {
        userId: alexUser.id,
        ...rec,
      },
    });
  }
  console.log('Seeded AI recommendations.');

  // Seed Notifications for Alex
  const notifications = [
    {
      title: 'Welcome to AI Digital Twin',
      message: 'Hi Alex! Your personalized Digital Twin and AI advisor features are active.',
      type: 'INFO',
      isRead: false,
    },
    {
      title: 'Target Target Exceeded Alert',
      message: 'Warning: Your housing costs exceed 30% of your income. Evaluate non-essential costs.',
      type: 'ALERT',
      isRead: false,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        userId: alexUser.id,
        ...notif,
      },
    });
  }
  console.log('Seeded notifications.');

  // Seed Activity History for Alex
  const activities = [
    {
      activityType: 'User Registered',
      description: 'Successfully registered account with email: alex.carter@example.com',
      timestamp: new Date('2026-07-01T07:55:00Z'),
    },
    {
      activityType: 'Login',
      description: 'Successfully logged into the system',
      timestamp: new Date('2026-07-01T08:00:00Z'),
    },
    {
      activityType: 'Transaction Added',
      description: 'Added transaction "Rent Payment" (EXPENSE) of amount $1800.00',
      timestamp: new Date('2026-07-01T08:05:00Z'),
    },
    {
      activityType: 'Study Session Added',
      description: 'Logged study session for "Machine Learning" - "Supervised Learning Algorithms" (120 mins)',
      timestamp: new Date('2026-07-20T20:00:00Z'),
    },
    {
      activityType: 'Habit Completed',
      description: 'Completed habit "Drink 3L of Water"',
      timestamp: new Date('2026-07-25T21:00:00Z'),
    },
  ];

  for (const act of activities) {
    await prisma.activityHistory.create({
      data: {
        userId: alexUser.id,
        ...act,
      },
    });
  }
  console.log('Seeded activity logs.');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
