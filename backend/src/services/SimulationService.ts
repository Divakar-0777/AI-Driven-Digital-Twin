import { SimulationRepository, SimulationInput } from '../repositories/SimulationRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

export class SimulationService {
  static async createSimulation(userId: string, data: SimulationInput) {
    const simulation = await SimulationRepository.createSimulation(userId, data);
    await ActivityRepository.logActivity(userId, 'Simulation Run', `Ran and saved scenario simulation "${data.scenarioName}"`);
    return simulation;
  }

  static async getSimulations(userId: string) {
    return SimulationRepository.findByUserId(userId);
  }

  static async deleteSimulation(userId: string, id: string) {
    const simulation = await SimulationRepository.findById(id);
    if (!simulation) throw new Error('Simulation not found');
    if (simulation.userId !== userId) throw new Error('Access denied');

    await SimulationRepository.deleteSimulation(id);
    await ActivityRepository.logActivity(userId, 'Simulation Deleted', `Deleted scenario simulation "${simulation.scenarioName}"`);
  }
}
