import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { ProfileUpdateSchema } from '../validators';
import { logActivity } from '../utils/activity';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = ProfileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const data = { ...parseResult.data };

    // Process dateOfBirth if provided
    let dobParsed: Date | undefined = undefined;
    if (data.dateOfBirth) {
      dobParsed = new Date(data.dateOfBirth);
    }

    // Process password if updated
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    // Ensure we don't accidentally update email to another user's email
    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(dobParsed !== undefined ? { dateOfBirth: dobParsed } : {}),
      },
    });

    await logActivity(userId, 'Profile Updated', 'User profile information was updated');

    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Perform cascade delete (Prisma schema handles this via relation level onDelete: Cascade)
    await prisma.user.delete({ where: { id: userId } });

    // Note: We don't log activity here because the user record and all related activity logs are deleted cascade-wise.
    return res.status(200).json({ message: 'User account and all related records deleted successfully' });
  } catch (error) {
    console.error('Delete Profile Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
