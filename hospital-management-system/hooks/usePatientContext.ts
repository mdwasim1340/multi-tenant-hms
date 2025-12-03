/**
 * usePatientContext Hook
 * 
 * Custom hook for managing selected patient context across EMR components.
 * Ensures data isolation when switching between patients.
 */

import { useState, useCallback, useEffect } from 'react';

export interface PatientContextData {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  blood_type?: string;
  status?: string;
  gender?: string;
}

export interface UsePatientContextReturn {
  selectedPatient: PatientContextData | null;
  setSelectedPatient: (patient: PatientContextData | null) => void;
  clearPatient: () => void;
  isPatientSelected: boolean;
}

/**
 * Custom hook for managing patient context
 * 
 * This hook provides a way to manage the currently selected patient
 * and ensures proper data isolation when switching patients.
 */
export function usePatientContext(): UsePatientContextReturn {
  const [selectedPatient, setSelectedPatientState] = useState<PatientContextData | null>(null);

  // Load patient from sessionStorage on mount
  useEffect(() => {
    const storedPatient = sessionStorage.getItem('selected_patient');
    if (storedPatient) {
      try {
        setSelectedPatientState(JSON.parse(storedPatient));
      } catch (err) {
        console.error('Error loading patient from session storage:', err);
        sessionStorage.removeItem('selected_patient');
      }
    }
  }, []);

  const setSelectedPatient = useCallback((patient: PatientContextData | null) => {
    setSelectedPatientState(patient);
    
    // Persist to sessionStorage
    if (patient) {
      sessionStorage.setItem('selected_patient', JSON.stringify(patient));
    } else {
      sessionStorage.removeItem('selected_patient');
    }

    // Trigger custom event for other components to react
    window.dispatchEvent(new CustomEvent('patient-context-changed', {
      detail: { patient }
    }));
  }, []);

  const clearPatient = useCallback(() => {
    setSelectedPatient(null);
  }, [setSelectedPatient]);

  const isPatientSelected = selectedPatient !== null;

  return {
    selectedPatient,
    setSelectedPatient,
    clearPatient,
    isPatientSelected
  };
}

/**
 * Hook to listen for patient context changes
 * 
 * This hook allows components to react when the patient context changes,
 * ensuring data is cleared or refreshed appropriately.
 */
export function usePatientContextListener(
  callback: (patient: PatientContextData | null) => void
) {
  useEffect(() => {
    const handlePatientChange = (event: CustomEvent) => {
      callback(event.detail.patient);
    };

    window.addEventListener('patient-context-changed', handlePatientChange as EventListener);

    return () => {
      window.removeEventListener('patient-context-changed', handlePatientChange as EventListener);
    };
  }, [callback]);
}
