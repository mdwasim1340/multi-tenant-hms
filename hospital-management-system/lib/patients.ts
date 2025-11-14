/**
 * Patient API Client Functions
 * 
 * This module provides functions to interact with the backend patient API.
 * All functions use the configured axios instance with automatic auth and tenant headers.
 */

import { api } from './api';
import {
  Patient,
  PatientSearchParams,
  CreatePatientData,
  UpdatePatientData,
  PatientsResponse,
  PatientResponse,
} from '@/types/patient';

/**
 * Fetch patients with optional filters and pagination
 * 
 * @param params - Search and filter parameters
 * @returns Promise with patients list and pagination info
 * 
 * @example
 * const result = await getPatients({ page: 1, limit: 25, search: 'John' });
 * console.log(result.data.patients);
 */
export async function getPatients(
  params: PatientSearchParams = {}
): Promise<PatientsResponse> {
  try {
    const response = await api.get<PatientsResponse>('/api/patients', {
      params: {
        page: params.page || 1,
        limit: params.limit || 25,
        search: params.search,
        status: params.status,
        gender: params.gender,
        age_min: params.age_min,
        age_max: params.age_max,
        city: params.city,
        state: params.state,
        blood_type: params.blood_type,
        sort_by: params.sort_by || 'created_at',
        sort_order: params.sort_order || 'desc',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch patients'
    );
  }
}

/**
 * Create a new patient record
 * 
 * @param data - Patient data to create
 * @returns Promise with created patient
 * 
 * @example
 * const patient = await createPatient({
 *   patient_number: 'P001',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   date_of_birth: '1980-01-01',
 *   gender: 'male'
 * });
 */
export async function createPatient(
  data: CreatePatientData
): Promise<Patient> {
  try {
    // Convert date_of_birth to ISO datetime format (backend expects datetime)
    const formattedData = {
      ...data,
      date_of_birth: data.date_of_birth.includes('T') 
        ? data.date_of_birth 
        : `${data.date_of_birth}T00:00:00.000Z`,
      // Remove empty strings for optional fields
      email: data.email || undefined,
      phone: data.phone || undefined,
      mobile_phone: data.mobile_phone || undefined,
    };

    const response = await api.post<PatientResponse>('/api/patients', formattedData);
    return response.data.data.patient;
  } catch (error: any) {
    console.error('Error creating patient:', error);
    
    // Handle specific error cases
    if (error.response?.status === 409) {
      throw new Error('Patient number already exists');
    }
    
    if (error.response?.status === 400) {
      const details = error.response?.data?.details;
      if (details) {
        const fieldErrors = Object.entries(details)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation error: ${fieldErrors}`);
      }
      // Show the actual error message from backend
      throw new Error(error.response?.data?.error || 'Validation error');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to create patient'
    );
  }
}

/**
 * Get a single patient by ID
 * 
 * @param id - Patient ID
 * @returns Promise with patient data
 * 
 * @example
 * const patient = await getPatientById(123);
 * console.log(patient.first_name);
 */
export async function getPatientById(id: number): Promise<Patient> {
  try {
    const response = await api.get<PatientResponse>(`/api/patients/${id}`);
    return response.data.data.patient;
  } catch (error: any) {
    console.error(`Error fetching patient ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Patient not found');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to fetch patient'
    );
  }
}

/**
 * Update an existing patient record
 * 
 * @param id - Patient ID
 * @param data - Patient data to update
 * @returns Promise with updated patient
 * 
 * @example
 * const patient = await updatePatient(123, {
 *   email: 'newemail@example.com',
 *   phone: '+1234567890'
 * });
 */
export async function updatePatient(
  id: number,
  data: UpdatePatientData
): Promise<Patient> {
  try {
    // Convert date_of_birth to ISO datetime format if present
    const formattedData = {
      ...data,
      ...(data.date_of_birth && {
        date_of_birth: data.date_of_birth.includes('T')
          ? data.date_of_birth
          : `${data.date_of_birth}T00:00:00.000Z`,
      }),
      // Remove empty strings for optional fields
      email: data.email || undefined,
      phone: data.phone || undefined,
      mobile_phone: data.mobile_phone || undefined,
    };

    const response = await api.put<PatientResponse>(
      `/api/patients/${id}`,
      formattedData
    );
    return response.data.data.patient;
  } catch (error: any) {
    console.error(`Error updating patient ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Patient not found');
    }
    
    if (error.response?.status === 409) {
      throw new Error('Patient number already exists');
    }
    
    if (error.response?.status === 400) {
      const details = error.response?.data?.details;
      if (details) {
        const fieldErrors = Object.entries(details)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation error: ${fieldErrors}`);
      }
      // Show the actual error message from backend
      throw new Error(error.response?.data?.error || 'Validation error');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to update patient'
    );
  }
}

/**
 * Soft delete a patient (sets status to 'inactive')
 * 
 * @param id - Patient ID
 * @returns Promise with deleted patient
 * 
 * @example
 * await deletePatient(123);
 */
export async function deletePatient(id: number): Promise<Patient> {
  try {
    const response = await api.delete<PatientResponse>(`/api/patients/${id}`);
    return response.data.data.patient;
  } catch (error: any) {
    console.error(`Error deleting patient ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Patient not found');
    }
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete patients');
    }
    
    throw new Error(
      error.response?.data?.error || 'Failed to delete patient'
    );
  }
}

/**
 * Generate a unique patient number
 * Format: P + timestamp + random 3 digits
 * 
 * @returns Unique patient number string
 * 
 * @example
 * const patientNumber = generatePatientNumber();
 * // Returns: "P1731485000123"
 */
export function generatePatientNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `P${timestamp}${random}`;
}

/**
 * Calculate age from date of birth
 * 
 * @param dateOfBirth - Date of birth string (YYYY-MM-DD)
 * @returns Age in years
 * 
 * @example
 * const age = calculateAge('1980-01-01');
 * console.log(age); // 44 (as of 2024)
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  
  return age;
}

/**
 * Format patient name for display
 * 
 * @param patient - Patient object
 * @returns Formatted full name
 * 
 * @example
 * const name = formatPatientName(patient);
 * // Returns: "John Michael Doe" or "John Doe (Johnny)"
 */
export function formatPatientName(patient: Patient): string {
  const parts = [
    patient.first_name,
    patient.middle_name,
    patient.last_name,
  ].filter(Boolean);
  
  const fullName = parts.join(' ');
  
  if (patient.preferred_name && patient.preferred_name !== patient.first_name) {
    return `${fullName} (${patient.preferred_name})`;
  }
  
  return fullName;
}

/**
 * Format phone number for display
 * 
 * @param phone - Phone number string
 * @returns Formatted phone number
 * 
 * @example
 * const formatted = formatPhoneNumber('1234567890');
 * // Returns: "(123) 456-7890"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Format as +X (XXX) XXX-XXXX for international
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}
