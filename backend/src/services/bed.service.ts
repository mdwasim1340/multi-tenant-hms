import { Bed, CreateBedData, UpdateBedData } from '../types/bed';
import { BedNotFoundError, BedNumberExistsError, BedUnavailableError, BedValidationError } from '../errors/BedError';
import { CreateBedSchema, UpdateBedSchema } from '../validation/bed.validation';

export class BedService {
  async createBed(data: CreateBedData, tenantId: string, userId: number): Promise<Bed> {
    // Validate input
    const payload = CreateBedSchema.parse(data);
    // TODO: Insert into DB using tenantId
    // Check unique bed_number constraint for the schema
    // Return created Bed object or throw BedNumberExistsError
    throw new Error('Not implemented');
  }

  async getBedById(bedId: number, tenantId: string): Promise<Bed> {
    // TODO: Query DB using tenantId and bedId
    // If not found, throw BedNotFoundError
    throw new Error('Not implemented');
  }

  async updateBed(
    bedId: number,
    data: UpdateBedData,
    tenantId: string,
    userId: number
  ): Promise<Bed> {
    const payload = UpdateBedSchema.parse(data);
    // TODO: Update logic (handle partials, check constraints)
    throw new Error('Not implemented');
  }

  async deleteBed(bedId: number, tenantId: string, userId: number): Promise<void> {
    // TODO: Soft delete (set is_active = false)
    throw new Error('Not implemented');
  }

  async getBedOccupancy(tenantId: string, filter?: { department_id?: number }): Promise<any> {
    // TODO: Aggregate occupancy for all beds/departments
    throw new Error('Not implemented');
  }

  async checkBedAvailability(bedId: number, tenantId: string): Promise<boolean> {
    // TODO: Evaluate all possible constraints for availability
    throw new Error('Not implemented');
  }
}
