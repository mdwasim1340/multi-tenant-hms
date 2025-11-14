/**
 * usePatient Hook
 * 
 * Custom hook for managing single patient operations (fetch, update, delete).
 * Implements optimistic updates and automatic refetching.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPatientById,
  updatePatient as updatePatientApi,
  deletePatient as deletePatientApi,
} from '@/lib/patients';
import { Patient, UpdatePatientData } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

/**
 * Return type for usePatient hook
 */
export interface UsePatientReturn {
  patient: Patient | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updatePatient: (data: UpdatePatientData) => Promise<void>;
  deletePatient: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Custom hook for managing single patient
 * 
 * @param patientId - Patient ID to fetch
 * @returns Patient state and control functions
 * 
 * @example
 * const { patient, loading, updatePatient, deletePatient } = usePatient(123);
 * 
 * // Update patient
 * await updatePatient({ email: 'new@example.com' });
 * 
 * // Delete patient
 * await deletePatient();
 */
export function usePatient(patientId: number): UsePatientReturn {
  const { toast } = useToast();

  // State
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /**
   * Fetch patient from API
   */
  const fetchPatient = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPatientById(patientId);
      setPatient(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error(`Error fetching patient ${patientId}:`, error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch patient',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  /**
   * Refetch patient manually
   */
  const refetch = useCallback(async () => {
    await fetchPatient();
  }, [fetchPatient]);

  /**
   * Update patient with optimistic updates
   */
  const updatePatient = useCallback(
    async (data: UpdatePatientData) => {
      if (!patient) {
        throw new Error('No patient loaded');
      }

      setIsUpdating(true);
      setError(null);

      // Store original patient for rollback
      const originalPatient = { ...patient };

      try {
        // Optimistic update
        setPatient((prev) => (prev ? { ...prev, ...data } : null));

        // API call
        const updatedPatient = await updatePatientApi(patientId, data);
        
        // Update with server response
        setPatient(updatedPatient);

        toast({
          title: 'Success',
          description: 'Patient updated successfully',
        });
      } catch (err) {
        const error = err as Error;
        
        // Rollback on error
        setPatient(originalPatient);
        setError(error);
        
        console.error(`Error updating patient ${patientId}:`, error);
        
        toast({
          title: 'Error',
          description: error.message || 'Failed to update patient',
          variant: 'destructive',
        });
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [patient, patientId, toast]
  );

  /**
   * Soft delete patient
   */
  const deletePatient = useCallback(async () => {
    if (!patient) {
      throw new Error('No patient loaded');
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deletePatientApi(patientId);
      
      // Update local state to reflect deletion
      setPatient((prev) =>
        prev ? { ...prev, status: 'inactive' } : null
      );

      toast({
        title: 'Success',
        description: 'Patient deactivated successfully',
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      console.error(`Error deleting patient ${patientId}:`, error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete patient',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [patient, patientId, toast]);

  /**
   * Fetch patient on mount and when ID changes
   */
  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return {
    patient,
    loading,
    error,
    refetch,
    updatePatient,
    deletePatient,
    isUpdating,
    isDeleting,
  };
}
