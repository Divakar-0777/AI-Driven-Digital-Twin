import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { RegisterSchema, LoginSchema } from '../validators';
import { logActivity } from '../utils/activity';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-milestone1-key-phrase-12345';

export const register = async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const {
      fullName,
      email,
      password,
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
    } = parseResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parse dateOfBirth if provided
    let dobParsed: Date | null = null;
    if (dateOfBirth) {
      dobParsed = new Date(dateOfBirth);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phoneNumber,
        dateOfBirth: dobParsed,
        occupation,
        educationLevel,
        monthlyIncome,
        monthlyExpenseTarget,
        studyGoal,
        dailyStudyHoursTarget,
        habitGoals,
        profilePhotoUrl,
      },
    });

    // Log Activity
    await logActivity(user.id, 'User Registered', `Successfully registered account with email: ${email}`);

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { email, password } = parseResult.data;

    // Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Log Activity
    await logActivity(user.id, 'Login', 'Successfully logged into the system');

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
