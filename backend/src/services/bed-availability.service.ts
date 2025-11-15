// Service for real-time bed availability and validation logic
import { Bed } from '../types/bed';
import { BedNotFoundError, BedUnavailableError } from '../errors/BedError';

export class BedAvailabilityService {
  async checkBedAvailable(bedId: number, tenantId: string): Promise<{ available: boolean; reason?: string }> {
    // TODO: Query DB for current bed/assignments/maintenance status
    // Return reason string if not available
    throw new Error('Not implemented');
  }

  async getAvailableBeds(departmentId: number, tenantId: string): Promise<Bed[]> {
    // TODO: Query all available beds by department and tenant
    throw new Error('Not implemented');
  }

  async getAvailableBedsByType(bedType: string, tenantId: string): Promise<Bed[]> {
    // TODO: Query beds that are available and of given type, for the tenant
    throw new Error('Not implemented');
  }
}
