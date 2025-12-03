// Note Template Types and Interfaces
// Requirements: 2.4 - Template support for clinical notes

export interface NoteTemplate {
  id: number;
  name: string;
  category: string;
  content: string; // HTML template content
  description?: string | null;
  is_active: boolean;
  is_system: boolean;
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteTemplateRequest {
  name: string;
  category: string;
  content: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateNoteTemplateRequest {
  name?: string;
  category?: string;
  content?: string;
  description?: string;
  is_active?: boolean;
}

export interface NoteTemplateFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NoteTemplateListResponse {
  templates: NoteTemplate[];
  total: number;
  page: number;
  limit: number;
}

// Template categories
export const TEMPLATE_CATEGORIES = [
  'General',
  'Follow-up',
  'Specialist',
  'Discharge',
  'Admission',
  'Procedure',
  'Consultation',
  'Emergency',
  'Other'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
