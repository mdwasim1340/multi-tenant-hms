import { BedAssignment, CreateBedAssignmentData, UpdateBedAssignmentData, DischargeBedAssignmentData } from '../types/bed';
import { BedAssignmentNotFoundError, BedAssignmentConflictError, AssignmentAlreadyDischargedError, BedValidationError } from '../errors/BedError';
import { CreateBedAssignmentSchema, UpdateBedAssignmentSchema, DischargeBedAssignmentSchema } from '../validation/bed.validation';

export class BedAssignmentService {
  async createBedAssignment(
    data: CreateBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    // Validate input
    const payload = CreateBedAssignmentSchema.parse(data);
    // TODO: Insert assignment, check for bed availability, prevent double-booking
    // Throw BedAssignmentConflictError if active assignment exists
    throw new Error('Not implemented');
  }

  async getBedAssignmentById(assignmentId: number, tenantId: string): Promise<BedAssignment> {
    // TODO: Query DB for bed assignment
    // If not found, throw BedAssignmentNotFoundError
    throw new Error('Not implemented');
  }

  async updateBedAssignment(
    assignmentId: number,
    data: UpdateBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    // Validate input
    const payload = UpdateBedAssignmentSchema.parse(data);
    // TODO: Update logic
    throw new Error('Not implemented');
  }

  async dischargeBedAssignment(
    assignmentId: number,
    data: DischargeBedAssignmentData,
    tenantId: string,
    userId: number
  ): Promise<BedAssignment> {
    // Validate input
    const payload = DischargeBedAssignmentSchema.parse(data);
    // TODO: Discharge assignment, update beds
    // Throw AssignmentAlreadyDischargedError if already discharged
    throw new Error('Not implemented');
  }

  async getPatientBedHistory(patientId: number, tenantId: string): Promise<BedAssignment[]> {
    // TODO: Return full bed assignment history for this patient
    throw new Error('Not implemented');
  }

  async getBedAssignmentHistory(bedId: number, tenantId: string): Promise<BedAssignment[]> {
    // TODO: Return all assignments for this bed
    throw new Error('Not implemented');
  }
}
