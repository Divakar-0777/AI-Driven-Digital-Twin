import prisma from '../database/prismaClient';

export class UserRepository {
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  static async createUser(email: string, passwordHash: string) {
    return prisma.user.create({
      data: {
        email,
        password: passwordHash,
      },
    });
  }
}
