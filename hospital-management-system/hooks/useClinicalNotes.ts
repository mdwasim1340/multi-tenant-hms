/**
 * useClinicalNotes Hook
 * 
 * Custom hook for fetching and managing clinical notes with CRUD operations.
 * Handles loading states, error handling, and automatic refetching.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getClinicalNotes,
  getClinicalNote,
  getPatientClinicalNotes,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  signClinicalNote,
  getClinicalNoteVersions,
  ClinicalNote,
  ClinicalNoteVersion,
  CreateNoteData,
  UpdateNoteData,
  ListNotesParams
} from '@/lib/api/clinical-notes';

export interface UseClinicalNotesOptions extends ListNotesParams {
  autoFetch?: boolean;
}

export interface UseClinicalNotesReturn {
  notes: ClinicalNote[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createNote: (data: CreateNoteData) => Promise<ClinicalNote>;
  updateNote: (id: number, data: UpdateNoteData) => Promise<ClinicalNote>;
  deleteNote: (id: number) => Promise<void>;
  signNote: (id: number) => Promise<ClinicalNote>;
  getNote: (id: number) => Promise<ClinicalNote>;
  getVersions: (id: number) => Promise<ClinicalNoteVersion[]>;
}

/**
 * Custom hook for managing clinical notes
 */
export function useClinicalNotes(options: UseClinicalNotesOptions = {}): UseClinicalNotesReturn {
  const { autoFetch = true, ...params } = options;
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = params.patient_id
        ? await getPatientClinicalNotes(params.patient_id, params)
        : await getClinicalNotes(params);
      
      setNotes(response.notes || response.data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching clinical notes:', err);
    } finally {
      setLoading(false);
    }
  }, [params.patient_id, params.provider_id, params.note_type, params.status, params.start_date, params.end_date]);

  useEffect(() => {
    if (autoFetch) {
      fetchNotes();
    }
  }, [autoFetch, fetchNotes]);

  const createNote = useCallback(async (data: CreateNoteData): Promise<ClinicalNote> => {
    try {
      setLoading(true);
      setError(null);
      const response = await createClinicalNote(data);
      await fetchNotes(); // Refresh list
      return response.note || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  const updateNote = useCallback(async (id: number, data: UpdateNoteData): Promise<ClinicalNote> => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateClinicalNote(id, data);
      await fetchNotes(); // Refresh list
      return response.note || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  const deleteNote = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteClinicalNote(id);
      await fetchNotes(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  const signNote = useCallback(async (id: number): Promise<ClinicalNote> => {
    try {
      setLoading(true);
      setError(null);
      const response = await signClinicalNote(id);
      await fetchNotes(); // Refresh list
      return response.note || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNotes]);

  const getNote = useCallback(async (id: number): Promise<ClinicalNote> => {
    try {
      const response = await getClinicalNote(id);
      return response.note || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const getVersions = useCallback(async (id: number): Promise<ClinicalNoteVersion[]> => {
    try {
      const response = await getClinicalNoteVersions(id);
      return response.versions || response.data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    signNote,
    getNote,
    getVersions
  };
}
