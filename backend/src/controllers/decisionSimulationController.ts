import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DecisionSimulationInputSchema } from '../validators';
import { DecisionSimulationService } from '../services/DecisionSimulationService';

export const runDecisionSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = req.headers.authorization?.split(' ')[1] || '';
    const parseResult = DecisionSimulationInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const result = await DecisionSimulationService.runSimulation(userId, parseResult.data, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Run Decision Simulation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const createDecisionSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = req.headers.authorization?.split(' ')[1] || '';
    const parseResult = DecisionSimulationInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const simulation = await DecisionSimulationService.createSimulation(userId, parseResult.data, token);
    return res.status(201).json(simulation);
  } catch (error: any) {
    console.error('Create Decision Simulation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getDecisionSimulations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const simulations = await DecisionSimulationService.getSimulations(userId);
    return res.status(200).json(simulations);
  } catch (error: any) {
    console.error('Get Decision Simulations Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDecisionSimulationById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const simulation = await DecisionSimulationService.getSimulationById(userId, id);
    return res.status(200).json(simulation);
  } catch (error: any) {
    console.error('Get Decision Simulation By Id Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteDecisionSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await DecisionSimulationService.deleteSimulation(userId, id);
    return res.status(200).json({ message: 'Decision simulation deleted successfully' });
  } catch (error: any) {
    console.error('Delete Decision Simulation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
