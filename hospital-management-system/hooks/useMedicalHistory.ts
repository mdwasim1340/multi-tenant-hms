/**
 * useMedicalHistory Hook
 * 
 * Custom hook for fetching and managing medical history entries.
 * Handles loading states, error handling, and critical allergy warnings.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMedicalHistory,
  getMedicalHistoryEntry,
  getPatientMedicalHistory,
  createMedicalHistoryEntry,
  updateMedicalHistoryEntry,
  deleteMedicalHistoryEntry,
  getPatientCriticalAllergies,
  getPatientMedicalHistorySummary,
  MedicalHistoryEntry,
  CriticalAllergy,
  MedicalHistorySummary,
  CreateHistoryData,
  UpdateHistoryData,
  ListHistoryParams
} from '@/lib/api/medical-history';

export interface UseMedicalHistoryOptions extends ListHistoryParams {
  autoFetch?: boolean;
}

export interface UseMedicalHistoryReturn {
  history: MedicalHistoryEntry[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createEntry: (data: CreateHistoryData) => Promise<MedicalHistoryEntry>;
  updateEntry: (id: number, data: UpdateHistoryData) => Promise<MedicalHistoryEntry>;
  deleteEntry: (id: number) => Promise<void>;
  getEntry: (id: number) => Promise<MedicalHistoryEntry>;
  getCriticalAllergies: (patientId: number) => Promise<CriticalAllergy[]>;
  getSummary: (patientId: number) => Promise<MedicalHistorySummary>;
}

/**
 * Custom hook for managing medical history
 */
export function useMedicalHistory(options: UseMedicalHistoryOptions = {}): UseMedicalHistoryReturn {
  const { autoFetch = true, ...params } = options;
  const [history, setHistory] = useState<MedicalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = params.patient_id
        ? await getPatientMedicalHistory(params.patient_id, params)
        : await getMedicalHistory(params);
      
      setHistory(response.history || response.data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching medical history:', err);
    } finally {
      setLoading(false);
    }
  }, [params.patient_id, params.category, params.is_active, params.severity]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [autoFetch, fetchHistory]);

  const createEntry = useCallback(async (data: CreateHistoryData): Promise<MedicalHistoryEntry> => {
    try {
      setLoading(true);
      setError(null);
      const response = await createMedicalHistoryEntry(data);
      await fetchHistory(); // Refresh list
      return response.entry || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  const updateEntry = useCallback(async (id: number, data: UpdateHistoryData): Promise<MedicalHistoryEntry> => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateMedicalHistoryEntry(id, data);
      await fetchHistory(); // Refresh list
      return response.entry || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  const deleteEntry = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteMedicalHistoryEntry(id);
      await fetchHistory(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  const getEntry = useCallback(async (id: number): Promise<MedicalHistoryEntry> => {
    try {
      const response = await getMedicalHistoryEntry(id);
      return response.entry || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const getCriticalAllergies = useCallback(async (patientId: number): Promise<CriticalAllergy[]> => {
    try {
      const response = await getPatientCriticalAllergies(patientId);
      return response.allergies || response.data || [];
    } catch (err) {
      // Don't set error state for this - it's a non-critical feature
      // Just return empty array if endpoint fails
      console.warn('Could not fetch critical allergies:', err);
      return [];
    }
  }, []);

  const getSummary = useCallback(async (patientId: number): Promise<MedicalHistorySummary> => {
    try {
      const response = await getPatientMedicalHistorySummary(patientId);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getCriticalAllergies,
    getSummary
  };
}
