import { BedTransfer, CreateBedTransferData, UpdateBedTransferData } from '../types/bed';
import { BedTransferNotFoundError, InvalidTransferError, TransferAlreadyCompletedError, SameBedTransferError, DestinationBedOccupiedError } from '../errors/BedError';
import { CreateBedTransferSchema, UpdateBedTransferSchema, CompleteBedTransferSchema, CancelBedTransferSchema } from '../validation/bed.validation';

export class BedTransferService {
  async createBedTransfer(data: CreateBedTransferData, tenantId: string, userId: number): Promise<BedTransfer> {
    // Validate input
    const payload = CreateBedTransferSchema.parse(data);
    // TODO: Insert into DB, check all constraints
    // Throw SameBedTransferError if transferring to same bed
    // Throw DestinationBedOccupiedError if target not available
    throw new Error('Not implemented');
  }

  async getBedTransferById(transferId: number, tenantId: string): Promise<BedTransfer> {
    // TODO: Query bed_transfer by ID
    // If not found, throw BedTransferNotFoundError
    throw new Error('Not implemented');
  }

  async updateBedTransfer(
    transferId: number,
    data: UpdateBedTransferData,
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    // Validate input
    const payload = UpdateBedTransferSchema.parse(data);
    // TODO: Status workflow
    throw new Error('Not implemented');
  }

  async completeBedTransfer(
    transferId: number,
    data: { performed_by?: number; notes?: string },
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    // Validate input
    const payload = CompleteBedTransferSchema.parse(data);
    // TODO: Transition status to completed, update beds and assignments
    // Throw TransferAlreadyCompletedError if already completed
    throw new Error('Not implemented');
  }

  async cancelBedTransfer(
    transferId: number,
    data: { reason: string; notes?: string },
    tenantId: string,
    userId: number
  ): Promise<BedTransfer> {
    // Validate input
    const payload = CancelBedTransferSchema.parse(data);
    // TODO: Transition status to cancelled
    throw new Error('Not implemented');
  }

  async getTransferHistory(patientId: number, tenantId: string): Promise<BedTransfer[]> {
    // TODO: Full transfer history for a patient
    throw new Error('Not implemented');
  }
}
