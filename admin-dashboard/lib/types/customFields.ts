export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'dropdown'
  | 'multi_select'
  | 'file_upload'
  | 'rich_text';

export type EntityType = 'patients' | 'appointments' | 'medical_records';

export interface CustomField {
  id: number;
  name: string;
  label: string;
  field_type: FieldType;
  applies_to: EntityType;
  validation_rules: ValidationRules;
  conditional_logic: ConditionalLogic;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  default_value: string | null;
  help_text: string | null;
  options?: CustomFieldOption[];
}

export interface CustomFieldOption {
  id: number;
  field_id: number;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
}

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  allowed_extensions?: string[];
  max_file_size_mb?: number;
}

export interface ConditionalLogic {
  show_if?: ConditionalRule[];
  hide_if?: ConditionalRule[];
}

export interface ConditionalRule {
  field_name: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface CustomFieldValue {
  [fieldName: string]: any;
}
