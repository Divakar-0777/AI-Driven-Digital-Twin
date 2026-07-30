import prisma from '../database/prismaClient';

export interface CreateProfileInput {
  userId: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  occupation?: string;
  educationLevel?: string;
  monthlyIncome?: number;
  monthlyExpenseTarget?: number;
  studyGoal?: string;
  dailyStudyHoursTarget?: number;
  habitGoals?: string;
  profilePhotoUrl?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  occupation?: string;
  educationLevel?: string;
  monthlyIncome?: number;
  monthlyExpenseTarget?: number;
  studyGoal?: string;
  dailyStudyHoursTarget?: number;
  habitGoals?: string;
  profilePhotoUrl?: string;
}

export class ProfileRepository {
  static async createProfile(data: CreateProfileInput) {
    return prisma.profile.create({
      data: {
        userId: data.userId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        occupation: data.occupation,
        educationLevel: data.educationLevel,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenseTarget: data.monthlyExpenseTarget,
        studyGoal: data.studyGoal,
        dailyStudyHoursTarget: data.dailyStudyHoursTarget,
        habitGoals: data.habitGoals,
        profilePhotoUrl: data.profilePhotoUrl,
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.profile.findUnique({
      where: { userId },
    });
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  static async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
