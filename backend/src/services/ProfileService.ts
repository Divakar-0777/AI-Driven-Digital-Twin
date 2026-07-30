import bcrypt from 'bcryptjs';
import { ProfileRepository, UpdateProfileInput } from '../repositories/ProfileRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import prisma from '../database/prismaClient';

export class ProfileService {
  static async getProfile(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName || '',
      phoneNumber: user.profile?.phoneNumber || '',
      dateOfBirth: user.profile?.dateOfBirth || null,
      occupation: user.profile?.occupation || '',
      educationLevel: user.profile?.educationLevel || '',
      monthlyIncome: user.profile ? Number(user.profile.monthlyIncome) : 0,
      monthlyExpenseTarget: user.profile ? Number(user.profile.monthlyExpenseTarget) : 0,
      studyGoal: user.profile?.studyGoal || '',
      dailyStudyHoursTarget: user.profile?.dailyStudyHoursTarget || 0,
      habitGoals: user.profile?.habitGoals || '',
      profilePhotoUrl: user.profile?.profilePhotoUrl || '',
      createdAt: user.createdAt,
    };
  }

  static async updateProfile(userId: string, data: any) {
    const { password, ...profileFields } = data;

    return prisma.$transaction(async (tx) => {
      // If password is provided, update it
      if (password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      }

      // Format types
      const formattedInput: UpdateProfileInput = { ...profileFields };
      if (profileFields.dateOfBirth) {
        formattedInput.dateOfBirth = new Date(profileFields.dateOfBirth);
      }
      if (profileFields.monthlyIncome !== undefined) {
        formattedInput.monthlyIncome = Number(profileFields.monthlyIncome);
      }
      if (profileFields.monthlyExpenseTarget !== undefined) {
        formattedInput.monthlyExpenseTarget = Number(profileFields.monthlyExpenseTarget);
      }
      if (profileFields.dailyStudyHoursTarget !== undefined) {
        formattedInput.dailyStudyHoursTarget = Number(profileFields.dailyStudyHoursTarget);
      }

      const updatedProfile = await tx.profile.update({
        where: { userId },
        data: formattedInput,
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityType: 'Profile Updated',
          description: 'Successfully updated profile fields',
        },
      });

      return updatedProfile;
    });
  }

  static async deleteProfile(userId: string) {
    await ProfileRepository.deleteUser(userId);
  }
}
