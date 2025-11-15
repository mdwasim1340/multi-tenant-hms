/**
 * Custom Error Classes for Bed Management System
 * Team: Beta
 * System: Bed Management + Inventory
 */

// Base Bed Error
export class BedError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly timestamp: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================== Department Errors ====================

export class DepartmentNotFoundError extends BedError {
  constructor(departmentId: number | string) {
    super(
      `Department with ID ${departmentId} not found`,
      404,
      'DEPARTMENT_NOT_FOUND'
    );
  }
}

export class DepartmentCodeExistsError extends BedError {
  constructor(departmentCode: string) {
    super(
      `Department with code ${departmentCode} already exists`,
      409,
      'DEPARTMENT_CODE_EXISTS'
    );
  }
}

// ==================== Bed Errors ====================

export class BedNotFoundError extends BedError {
  constructor(bedId: number | string) {
    super(
      `Bed with ID ${bedId} not found`,
      404,
      'BED_NOT_FOUND'
    );
  }
}

export class BedNumberExistsError extends BedError {
  constructor(bedNumber: string) {
    super(
      `Bed with number ${bedNumber} already exists`,
      409,
      'BED_NUMBER_EXISTS'
    );
  }
}

export class BedUnavailableError extends BedError {
  constructor(bedId: number, currentStatus: string) {
    super(
      `Bed ${bedId} is not available (current status: ${currentStatus})`,
      409,
      'BED_UNAVAILABLE'
    );
  }
}

export class BedAlreadyOccupiedError extends BedError {
  constructor(bedId: number) {
    super(
      `Bed ${bedId} is already occupied by another patient`,
      409,
      'BED_ALREADY_OCCUPIED'
    );
  }
}

// ==================== Bed Assignment Errors ====================

export class BedAssignmentNotFoundError extends BedError {
  constructor(assignmentId: number) {
    super(
      `Bed assignment with ID ${assignmentId} not found`,
      404,
      'BED_ASSIGNMENT_NOT_FOUND'
    );
  }
}

export class BedAssignmentConflictError extends BedError {
  constructor(bedId: number) {
    super(
      `Bed ${bedId} already has an active assignment. Cannot assign to another patient.`,
      409,
      'BED_ASSIGNMENT_CONFLICT'
    );
  }
}

export class PatientAlreadyAssignedError extends BedError {
  constructor(patientId: number) {
    super(
      `Patient ${patientId} already has an active bed assignment`,
      409,
      'PATIENT_ALREADY_ASSIGNED'
    );
  }
}

export class AssignmentAlreadyDischargedError extends BedError {
  constructor(assignmentId: number) {
    super(
      `Bed assignment ${assignmentId} is already discharged`,
      400,
      'ASSIGNMENT_ALREADY_DISCHARGED'
    );
  }
}

// ==================== Bed Transfer Errors ====================

export class BedTransferNotFoundError extends BedError {
  constructor(transferId: number) {
    super(
      `Bed transfer with ID ${transferId} not found`,
      404,
      'BED_TRANSFER_NOT_FOUND'
    );
  }
}

export class InvalidTransferError extends BedError {
  constructor(message: string) {
    super(
      message,
      400,
      'INVALID_TRANSFER'
    );
  }
}

export class TransferAlreadyCompletedError extends BedError {
  constructor(transferId: number) {
    super(
      `Bed transfer ${transferId} is already completed`,
      400,
      'TRANSFER_ALREADY_COMPLETED'
    );
  }
}

export class SameBedTransferError extends BedError {
  constructor() {
    super(
      'Cannot transfer patient to the same bed',
      400,
      'SAME_BED_TRANSFER'
    );
  }
}

export class DestinationBedOccupiedError extends BedError {
  constructor(bedId: number) {
    super(
      `Destination bed ${bedId} is already occupied`,
      409,
      'DESTINATION_BED_OCCUPIED'
    );
  }
}

// ==================== Validation Errors ====================

export class BedValidationError extends BedError {
  constructor(message: string, field?: string) {
    const errorMessage = field 
      ? `Validation error on field '${field}': ${message}`
      : `Validation error: ${message}`;
    
    super(
      errorMessage,
      400,
      'BED_VALIDATION_ERROR'
    );
  }
}

// ==================== Authorization Errors ====================

export class BedPermissionDeniedError extends BedError {
  constructor(action: string) {
    super(
      `You do not have permission to ${action}`,
      403,
      'BED_PERMISSION_DENIED'
    );
  }
}
