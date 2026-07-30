import prisma from '../database/prismaClient';

export interface HabitInput {
  name: string;
  targetFrequency: string;
  completed?: boolean;
  date?: Date;
}

export class HabitRepository {
  static async addHabit(userId: string, data: HabitInput) {
    return prisma.habit.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findById(id: string) {
    return prisma.habit.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.habit.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async updateHabit(id: string, data: HabitInput) {
    return prisma.habit.update({
      where: { id },
      data,
    });
  }

  static async deleteHabit(id: string) {
    return prisma.habit.delete({
      where: { id },
    });
  }
}
