// Clinical Note Types and Interfaces
// Requirements: 2.1, 2.2 - Clinical note data structures

export type NoteStatus = 'draft' | 'signed' | 'amended';

export type NoteType = 
  | 'progress_note'
  | 'discharge_summary'
  | 'consultation'
  | 'admission_note'
  | 'operative_note'
  | 'procedure_note'
  | 'follow_up'
  | 'other';

export interface ClinicalNote {
  id: number;
  patient_id: number;
  provider_id: number;
  note_type: NoteType;
  content: string; // HTML content
  summary?: string | null;
  status: NoteStatus;
  signed_at?: Date | null;
  signed_by?: number | null;
  template_id?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClinicalNoteVersion {
  id: number;
  note_id: number;
  version_number: number;
  content: string;
  summary?: string | null;
  changed_by: number;
  change_reason?: string | null;
  created_at: Date;
}

export interface NoteTemplate {
  id: number;
  name: string;
  category: string;
  content: string; // HTML template
  description?: string | null;
  is_active: boolean;
  is_system: boolean;
  created_by?: number | null;
  created_at: Date;
  updated_at: Date;
}

// Request/Response DTOs
export interface CreateClinicalNoteRequest {
  patient_id: number;
  provider_id: number;
  note_type: NoteType;
  content: string;
  summary?: string;
  template_id?: number;
}

export interface UpdateClinicalNoteRequest {
  content?: string;
  summary?: string;
  note_type?: NoteType;
}

export interface SignClinicalNoteRequest {
  signed_by: number;
}

export interface ClinicalNoteWithVersions extends ClinicalNote {
  versions: ClinicalNoteVersion[];
}

export interface ClinicalNoteListResponse {
  notes: ClinicalNote[];
  total: number;
  page: number;
  limit: number;
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

// Query parameters for filtering
export interface ClinicalNoteFilters {
  patient_id?: number;
  provider_id?: number;
  note_type?: NoteType;
  status?: NoteStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
