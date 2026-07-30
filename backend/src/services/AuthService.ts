import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../database/prismaClient';
import { dbConfig } from '../config/dbConfig';
import { UserRepository } from '../repositories/UserRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

export class AuthService {
  static async register(data: any) {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      dateOfBirth,
      occupation,
      educationLevel,
      monthlyIncome,
      monthlyExpenseTarget,
      studyGoal,
      dailyStudyHoursTarget,
      habitGoals,
      profilePhotoUrl
    } = data;

    // Check if user exists
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile in a transaction
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
        },
      });

      let dobParsed: Date | null = null;
      if (dateOfBirth) {
        dobParsed = new Date(dateOfBirth);
      }

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          fullName,
          phoneNumber: phoneNumber || null,
          dateOfBirth: dobParsed,
          occupation: occupation || null,
          educationLevel: educationLevel || null,
          monthlyIncome: monthlyIncome !== undefined ? Number(monthlyIncome) : 0.00,
          monthlyExpenseTarget: monthlyExpenseTarget !== undefined ? Number(monthlyExpenseTarget) : 0.00,
          studyGoal: studyGoal || null,
          dailyStudyHoursTarget: dailyStudyHoursTarget !== undefined ? Number(dailyStudyHoursTarget) : 0.0,
          habitGoals: habitGoals || null,
          profilePhotoUrl: profilePhotoUrl || null,
        },
      });

      await tx.activityHistory.create({
        data: {
          userId: user.id,
          activityType: 'User Registered',
          description: `Successfully registered account with email: ${email}`,
        },
      });

      const token = jwt.sign({ userId: user.id }, dbConfig.jwtSecret, { expiresIn: '7d' });

      return {
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          dateOfBirth: profile.dateOfBirth,
          occupation: profile.occupation,
          educationLevel: profile.educationLevel,
          monthlyIncome: Number(profile.monthlyIncome),
          monthlyExpenseTarget: Number(profile.monthlyExpenseTarget),
          studyGoal: profile.studyGoal,
          dailyStudyHoursTarget: Number(profile.dailyStudyHoursTarget),
          habitGoals: profile.habitGoals,
          profilePhotoUrl: profile.profilePhotoUrl,
          createdAt: user.createdAt,
        },
      };
    });
  }

  static async login(email: string, passwordStr: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(passwordStr, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    await ActivityRepository.logActivity(user.id, 'Login', 'Successfully logged into the system');

    const token = jwt.sign({ userId: user.id }, dbConfig.jwtSecret, { expiresIn: '7d' });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName || 'User',
        phoneNumber: user.profile?.phoneNumber || null,
        dateOfBirth: user.profile?.dateOfBirth || null,
        occupation: user.profile?.occupation || null,
        educationLevel: user.profile?.educationLevel || null,
        monthlyIncome: user.profile ? Number(user.profile.monthlyIncome) : 0,
        monthlyExpenseTarget: user.profile ? Number(user.profile.monthlyExpenseTarget) : 0,
        studyGoal: user.profile?.studyGoal || null,
        dailyStudyHoursTarget: user.profile ? Number(user.profile.dailyStudyHoursTarget) : 0,
        habitGoals: user.profile?.habitGoals || null,
        profilePhotoUrl: user.profile?.profilePhotoUrl || null,
        createdAt: user.createdAt,
      },
    };
  }
}
