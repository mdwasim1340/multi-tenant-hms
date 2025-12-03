export interface Prescription {
  id: number;
  patient_id: number;
  prescriber_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  duration_days: number;
  quantity: number;
  refills: number;
  refills_remaining: number;
  instructions: string | null;
  indication: string | null;
  status: 'active' | 'completed' | 'discontinued' | 'expired';
  start_date: string;
  end_date: string | null;
  discontinued_date: string | null;
  discontinued_reason: string | null;
  discontinued_by: number | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface DrugInteraction {
  id: number;
  drug_a: string;
  drug_b: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  recommendation: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionDTO {
  patient_id: number;
  prescriber_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  route: string;
  duration_days: number;
  quantity: number;
  refills: number;
  instructions?: string;
  indication?: string;
  start_date: string;
}

export interface UpdatePrescriptionDTO {
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration_days?: number;
  quantity?: number;
  refills?: number;
  instructions?: string;
  indication?: string;
  status?: 'active' | 'completed' | 'discontinued' | 'expired';
  start_date?: string;
  end_date?: string;
}

export interface DiscontinuePrescriptionDTO {
  reason: string;
}

export interface PrescriptionFilters {
  status?: 'active' | 'completed' | 'discontinued' | 'expired';
  medication_name?: string;
  prescriber_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface InteractionCheckResult {
  has_interactions: boolean;
  interactions: Array<{
    medication: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    recommendation: string;
  }>;
}

// Common medication routes
export const MEDICATION_ROUTES = [
  'Oral',
  'Sublingual',
  'Topical',
  'Transdermal',
  'Intravenous',
  'Intramuscular',
  'Subcutaneous',
  'Inhalation',
  'Rectal',
  'Ophthalmic',
  'Otic',
  'Nasal',
  'Other'
] as const;

export type MedicationRoute = typeof MEDICATION_ROUTES[number];

// Common frequencies
export const MEDICATION_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime',
  'Other'
] as const;

export type MedicationFrequency = typeof MEDICATION_FREQUENCIES[number];
