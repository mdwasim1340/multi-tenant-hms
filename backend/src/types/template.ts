/**
 * Team Alpha - Medical Record Template Types
 * TypeScript interfaces for medical record templates
 */

export interface MedicalRecordTemplate {
  id: number;
  tenant_id: string;
  name: string;
  description?: string;
  template_type: TemplateType;
  specialty?: string;
  fields: TemplateFields;
  default_values?: Record<string, any>;
  validation_rules?: ValidationRules;
  is_default: boolean;
  is_active: boolean;
  version: number;
  parent_template_id?: number;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export type TemplateType = 
  | 'consultation'
  | 'follow_up'
  | 'emergency'
  | 'procedure'
  | 'discharge'
  | 'admission'
  | 'progress_note'
  | 'operative_note';

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'object'
  | 'array';

export interface TemplateField {
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  default?: any;
  options?: string[] | { value: string; label: string }[];
  fields?: Record<string, TemplateField>; // For object type
  items?: TemplateField; // For array type
  validation?: FieldValidation;
  conditional?: ConditionalLogic;
  help_text?: string;
  section?: string; // Group fields into sections
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string; // Custom validation function name
}

export interface ConditionalLogic {
  show_if?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  required_if?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
}

export type TemplateFields = Record<string, TemplateField>;
export type ValidationRules = Record<string, FieldValidation>;

export interface CreateTemplateDTO {
  name: string;
  description?: string;
  template_type: TemplateType;
  specialty?: string;
  fields: TemplateFields;
  default_values?: Record<string, any>;
  validation_rules?: ValidationRules;
  is_default?: boolean;
  parent_template_id?: number;
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  template_type?: TemplateType;
  specialty?: string;
  fields?: TemplateFields;
  default_values?: Record<string, any>;
  validation_rules?: ValidationRules;
  is_default?: boolean;
  is_active?: boolean;
}

export interface TemplateFilters {
  template_type?: TemplateType;
  specialty?: string;
  is_active?: boolean;
  is_default?: boolean;
  search?: string;
  created_by?: number;
  limit?: number;
  offset?: number;
}

export interface TemplateUsage {
  id: number;
  tenant_id: string;
  template_id: number;
  medical_record_id: number;
  user_id: number;
  used_at: string;
  customizations?: Record<string, any>;
  completion_time_seconds?: number;
}

export interface CreateTemplateUsageDTO {
  template_id: number;
  medical_record_id: number;
  customizations?: Record<string, any>;
  completion_time_seconds?: number;
}

export interface TemplateStatistics {
  template_id: number;
  template_name: string;
  template_type: TemplateType;
  specialty?: string;
  usage_count: number;
  unique_users: number;
  avg_completion_time?: number;
  last_used?: string;
  is_popular: boolean;
}

export interface RecommendedTemplate {
  template_id: number;
  template_name: string;
  template_type: TemplateType;
  specialty?: string;
  description?: string;
  usage_count: number;
  user_usage_count: number;
  avg_completion_time?: number;
  recommendation_score: number;
}

export interface TemplateData {
  template: MedicalRecordTemplate;
  populated_fields: Record<string, any>;
  validation_errors?: Record<string, string[]>;
}

export interface TemplateValidationResult {
  is_valid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// Common medical specialties
export const MEDICAL_SPECIALTIES = [
  'general',
  'cardiology',
  'neurology',
  'orthopedics',
  'pediatrics',
  'psychiatry',
  'dermatology',
  'gastroenterology',
  'pulmonology',
  'endocrinology',
  'oncology',
  'urology',
  'gynecology',
  'ophthalmology',
  'otolaryngology',
  'emergency',
  'surgery',
  'anesthesiology',
  'radiology',
  'pathology'
] as const;

export type MedicalSpecialty = typeof MEDICAL_SPECIALTIES[number];

// Common template types with descriptions
export const TEMPLATE_TYPES = {
  consultation: 'Initial consultation or new patient visit',
  follow_up: 'Follow-up visit for existing condition',
  emergency: 'Emergency department visit',
  procedure: 'Medical procedure documentation',
  discharge: 'Hospital discharge summary',
  admission: 'Hospital admission note',
  progress_note: 'Daily progress note',
  operative_note: 'Surgical procedure note'
} as const;

// Field type configurations
export const FIELD_TYPE_CONFIG = {
  text: {
    component: 'input',
    props: { type: 'text' },
    validation: ['minLength', 'maxLength', 'pattern']
  },
  textarea: {
    component: 'textarea',
    props: { rows: 4 },
    validation: ['minLength', 'maxLength']
  },
  number: {
    component: 'input',
    props: { type: 'number' },
    validation: ['min', 'max']
  },
  select: {
    component: 'select',
    props: {},
    validation: []
  },
  multiselect: {
    component: 'multiselect',
    props: {},
    validation: []
  },
  checkbox: {
    component: 'checkbox',
    props: {},
    validation: []
  },
  radio: {
    component: 'radio',
    props: {},
    validation: []
  },
  date: {
    component: 'input',
    props: { type: 'date' },
    validation: ['min', 'max']
  },
  datetime: {
    component: 'input',
    props: { type: 'datetime-local' },
    validation: ['min', 'max']
  },
  time: {
    component: 'input',
    props: { type: 'time' },
    validation: ['min', 'max']
  },
  object: {
    component: 'fieldset',
    props: {},
    validation: []
  },
  array: {
    component: 'array',
    props: {},
    validation: []
  }
} as const;