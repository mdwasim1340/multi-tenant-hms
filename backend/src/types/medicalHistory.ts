// Medical History Entry - Base interface
export interface MedicalHistoryEntry {
  id: number;
  patient_id: number;
  category: 'condition' | 'surgery' | 'allergy' | 'family_history';
  name: string;
  description: string | null;
  date_diagnosed: string | null;
  date_resolved: string | null;
  status: 'active' | 'resolved' | 'chronic';
  notes: string | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

// Medical Condition
export interface MedicalCondition extends MedicalHistoryEntry {
  category: 'condition';
  icd_code: string | null;
  severity: 'mild' | 'moderate' | 'severe' | null;
  treatment: string | null;
}

// Surgery
export interface Surgery extends MedicalHistoryEntry {
  category: 'surgery';
  procedure_code: string | null;
  surgeon: string | null;
  hospital: string | null;
  complications: string | null;
}

// Allergy
export interface Allergy extends MedicalHistoryEntry {
  category: 'allergy';
  allergen_type: 'medication' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction: string;
  treatment: string | null;
  is_critical: boolean;
}

// Family History
export interface FamilyHistory extends MedicalHistoryEntry {
  category: 'family_history';
  relationship: string;
  age_of_onset: number | null;
  is_genetic: boolean;
}

// DTOs
export interface CreateMedicalHistoryDTO {
  patient_id: number;
  category: 'condition' | 'surgery' | 'allergy' | 'family_history';
  name: string;
  description?: string;
  date_diagnosed?: string;
  date_resolved?: string;
  status?: 'active' | 'resolved' | 'chronic';
  notes?: string;
  
  // Condition-specific
  icd_code?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  treatment?: string;
  
  // Surgery-specific
  procedure_code?: string;
  surgeon?: string;
  hospital?: string;
  complications?: string;
  
  // Allergy-specific
  allergen_type?: 'medication' | 'food' | 'environmental' | 'other';
  reaction?: string;
  is_critical?: boolean;
  
  // Family history-specific
  relationship?: string;
  age_of_onset?: number;
  is_genetic?: boolean;
}

export interface UpdateMedicalHistoryDTO {
  name?: string;
  description?: string;
  date_diagnosed?: string;
  date_resolved?: string;
  status?: 'active' | 'resolved' | 'chronic';
  notes?: string;
  
  // Condition-specific
  icd_code?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  treatment?: string;
  
  // Surgery-specific
  procedure_code?: string;
  surgeon?: string;
  hospital?: string;
  complications?: string;
  
  // Allergy-specific
  allergen_type?: 'medication' | 'food' | 'environmental' | 'other';
  reaction?: string;
  is_critical?: boolean;
  
  // Family history-specific
  relationship?: string;
  age_of_onset?: number;
  is_genetic?: boolean;
}

export interface MedicalHistoryFilters {
  category?: 'condition' | 'surgery' | 'allergy' | 'family_history';
  status?: 'active' | 'resolved' | 'chronic';
  severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  is_critical?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface MedicalHistorySummary {
  total_conditions: number;
  active_conditions: number;
  total_surgeries: number;
  total_allergies: number;
  critical_allergies: number;
  total_family_history: number;
  recent_entries: MedicalHistoryEntry[];
}

// Common relationships for family history
export const FAMILY_RELATIONSHIPS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Maternal Grandmother',
  'Maternal Grandfather',
  'Paternal Grandmother',
  'Paternal Grandfather',
  'Aunt',
  'Uncle',
  'Cousin',
  'Child',
  'Other'
] as const;

export type FamilyRelationship = typeof FAMILY_RELATIONSHIPS[number];

// Common allergen types
export const ALLERGEN_TYPES = [
  'medication',
  'food',
  'environmental',
  'other'
] as const;

export type AllergenType = typeof ALLERGEN_TYPES[number];

// Severity levels
export const SEVERITY_LEVELS = [
  'mild',
  'moderate',
  'severe',
  'life-threatening'
] as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[number];
