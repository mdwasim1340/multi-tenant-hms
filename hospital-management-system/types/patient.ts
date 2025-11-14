// Patient Management Type Definitions

/**
 * Patient entity representing a person receiving medical care
 */
export interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  date_of_birth: string;
  age?: number; // Calculated field
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;

  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;

  // Medical Information
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;

  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;

  // Status
  status: 'active' | 'inactive' | 'deceased';

  // Custom Fields
  custom_fields?: Record<string, any>;

  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

/**
 * Parameters for searching and filtering patients
 */
export interface PatientSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'deceased';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age_min?: number;
  age_max?: number;
  city?: string;
  state?: string;
  blood_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Data required to create a new patient
 */
export interface CreatePatientData {
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;

  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;

  // Medical Information
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;

  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;

  // Custom Fields
  custom_fields?: Record<string, any>;
}

/**
 * Data that can be updated for an existing patient
 */
export interface UpdatePatientData extends Partial<CreatePatientData> {
  status?: 'active' | 'inactive' | 'deceased';
}

/**
 * Pagination information for patient lists
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Response structure for patient list API
 */
export interface PatientsResponse {
  success: true;
  data: {
    patients: Patient[];
    pagination: PaginationInfo;
  };
}

/**
 * Response structure for single patient API
 */
export interface PatientResponse {
  success: true;
  data: {
    patient: Patient;
  };
  message?: string;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string>;
}

/**
 * Patient registration form data (multi-step form)
 */
export interface PatientRegistrationForm {
  // Step 1: Personal Information
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;

  // Step 2: Contact & Insurance
  email?: string;
  phone?: string;
  mobile_phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;

  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;

  // Step 3: Medical History
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_medical_history?: string;

  // Custom Fields
  custom_fields?: Record<string, any>;
}
