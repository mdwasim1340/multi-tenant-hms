// Patient data model interfaces
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
  date_of_birth: string; // ISO date string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  current_medications?: string;
  medical_history?: string;
  family_medical_history?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  insurance_info?: Record<string, any>;
  status: 'active' | 'inactive' | 'deceased' | 'transferred';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  custom_fields?: Record<string, any>;
}

export interface CreatePatientData {
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  current_medications?: string;
  medical_history?: string;
  family_medical_history?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  insurance_info?: Record<string, any>;
  status?: 'active' | 'inactive' | 'deceased' | 'transferred';
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdatePatientData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: string;
  occupation?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string;
  current_medications?: string;
  medical_history?: string;
  family_medical_history?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_group_number?: string;
  insurance_info?: Record<string, any>;
  status?: 'active' | 'inactive' | 'deceased' | 'transferred';
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface PatientSearchQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'deceased' | 'transferred';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age_min?: number;
  age_max?: number;
  city?: string;
  state?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  sort_by?: 'first_name' | 'last_name' | 'patient_number' | 'date_of_birth' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: PaginationInfo;
}
