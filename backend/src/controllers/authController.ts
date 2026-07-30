import { Request, Response } from 'express';
import { RegisterSchema, LoginSchema } from '../validators';
import { AuthService } from '../services/AuthService';

export const register = async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const result = await AuthService.register(parseResult.data);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Registration Controller Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { email, password } = parseResult.data;
    const result = await AuthService.login(email, password);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Login Controller Error:', error);
    return res.status(401).json({ error: error.message || 'Internal Server Error' });
  }
};
