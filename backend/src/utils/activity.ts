import prisma from './db';

export const logActivity = async (userId: string, activityType: string, description: string) => {
  try {
    await prisma.activityHistory.create({
      data: {
        userId,
        activityType,
        description,
      },
    });
  } catch (error) {
    console.error(`Failed to log activity "${activityType}" for user "${userId}":`, error);
  }
};
