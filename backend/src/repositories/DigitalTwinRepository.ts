import prisma from '../database/prismaClient';

export interface DigitalTwinInput {
  productivityScore: number;
  financialHealthScore: number;
  twinEmoticon: string;
  twinStatus: string;
}

export class DigitalTwinRepository {
  static async findByUserId(userId: string) {
    return prisma.digitalTwinState.findUnique({
      where: { userId },
    });
  }

  static async upsertTwinState(userId: string, data: DigitalTwinInput) {
    return prisma.digitalTwinState.upsert({
      where: { userId },
      update: {
        ...data,
        syncTimestamp: new Date(),
      },
      create: {
        userId,
        ...data,
      },
    });
  }
}
