/**
 * usePrescriptions Hook
 * 
 * Custom hook for fetching and managing prescriptions with drug interactions.
 * Handles loading states, error handling, and prescription operations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPrescriptions,
  getPrescription,
  getPatientPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
  discontinuePrescription,
  refillPrescription,
  checkDrugInteractions,
  Prescription,
  DrugInteraction,
  CreatePrescriptionData,
  UpdatePrescriptionData,
  ListPrescriptionsParams,
  DiscontinuePrescriptionData
} from '@/lib/api/prescriptions';

export interface UsePrescriptionsOptions extends ListPrescriptionsParams {
  autoFetch?: boolean;
}

export interface UsePrescriptionsReturn {
  prescriptions: Prescription[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createPrescription: (data: CreatePrescriptionData) => Promise<Prescription>;
  updatePrescription: (id: number, data: UpdatePrescriptionData) => Promise<Prescription>;
  deletePrescription: (id: number) => Promise<void>;
  discontinuePrescription: (id: number, data: DiscontinuePrescriptionData) => Promise<Prescription>;
  refillPrescription: (id: number) => Promise<Prescription>;
  getPrescription: (id: number) => Promise<Prescription>;
  checkInteractions: (patientId: number, medication: string) => Promise<DrugInteraction[]>;
}

/**
 * Custom hook for managing prescriptions
 */
export function usePrescriptions(options: UsePrescriptionsOptions = {}): UsePrescriptionsReturn {
  const { autoFetch = true, ...params } = options;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = params.patient_id
        ? await getPatientPrescriptions(params.patient_id, params)
        : await getPrescriptions(params);
      
      setPrescriptions(response.prescriptions || response.data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [params.patient_id, params.provider_id, params.status, params.start_date, params.end_date]);

  useEffect(() => {
    if (autoFetch) {
      fetchPrescriptions();
    }
  }, [autoFetch, fetchPrescriptions]);

  const createPrescriptionFunc = useCallback(async (data: CreatePrescriptionData): Promise<Prescription> => {
    try {
      setLoading(true);
      setError(null);
      const response = await createPrescription(data);
      await fetchPrescriptions(); // Refresh list
      return response.prescription || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPrescriptions]);

  const updatePrescriptionFunc = useCallback(async (id: number, data: UpdatePrescriptionData): Promise<Prescription> => {
    try {
      setLoading(true);
      setError(null);
      const response = await updatePrescription(id, data);
      await fetchPrescriptions(); // Refresh list
      return response.prescription || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPrescriptions]);

  const deletePrescriptionFunc = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deletePrescription(id);
      await fetchPrescriptions(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPrescriptions]);

  const discontinuePrescriptionFunc = useCallback(async (id: number, data: DiscontinuePrescriptionData): Promise<Prescription> => {
    try {
      setLoading(true);
      setError(null);
      const response = await discontinuePrescription(id, data);
      await fetchPrescriptions(); // Refresh list
      return response.prescription || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPrescriptions]);

  const refillPrescriptionFunc = useCallback(async (id: number): Promise<Prescription> => {
    try {
      setLoading(true);
      setError(null);
      const response = await refillPrescription(id);
      await fetchPrescriptions(); // Refresh list
      return response.prescription || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPrescriptions]);

  const getPrescriptionFunc = useCallback(async (id: number): Promise<Prescription> => {
    try {
      const response = await getPrescription(id);
      return response.prescription || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const checkInteractions = useCallback(async (patientId: number, medication: string): Promise<DrugInteraction[]> => {
    try {
      const response = await checkDrugInteractions(patientId, medication);
      return response.interactions || response.data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    prescriptions,
    loading,
    error,
    refetch: fetchPrescriptions,
    createPrescription: createPrescriptionFunc,
    updatePrescription: updatePrescriptionFunc,
    deletePrescription: deletePrescriptionFunc,
    discontinuePrescription: discontinuePrescriptionFunc,
    refillPrescription: refillPrescriptionFunc,
    getPrescription: getPrescriptionFunc,
    checkInteractions
  };
}
