import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SimulationSchema } from '../validators';
import { SimulationService } from '../services/SimulationService';

export const createSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = SimulationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const simulation = await SimulationService.createSimulation(userId, parseResult.data);
    return res.status(201).json(simulation);
  } catch (error: any) {
    console.error('Create Simulation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getSimulations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const simulations = await SimulationService.getSimulations(userId);
    return res.status(200).json(simulations);
  } catch (error: any) {
    console.error('Get Simulations Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteSimulation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await SimulationService.deleteSimulation(userId, id);
    return res.status(200).json({ message: 'Simulation deleted successfully' });
  } catch (error: any) {
    console.error('Delete Simulation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
