/**
 * usePatientForm Hook
 * 
 * Custom hook for managing patient registration/edit form state and validation.
 * Supports both create and edit modes with field-level validation.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  createPatient,
  updatePatient,
  generatePatientNumber,
} from '@/lib/patients';
import { Patient, PatientRegistrationForm } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

/**
 * Options for usePatientForm hook
 */
export interface UsePatientFormOptions {
  patientId?: number; // For edit mode
  initialData?: Partial<PatientRegistrationForm>; // Initial form data
  onSuccess?: (patient: Patient) => void; // Callback on successful submit
  onError?: (error: Error) => void; // Callback on error
}

/**
 * Return type for usePatientForm hook
 */
export interface UsePatientFormReturn {
  formData: PatientRegistrationForm;
  errors: Record<string, string>;
  loading: boolean;
  setFormData: (data: Partial<PatientRegistrationForm>) => void;
  setFieldValue: (field: keyof PatientRegistrationForm, value: any) => void;
  handleSubmit: () => Promise<void>;
  validateField: (field: keyof PatientRegistrationForm) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  isEditMode: boolean;
}

/**
 * Initial empty form data
 */
const getInitialFormData = (): PatientRegistrationForm => ({
  patient_number: generatePatientNumber(),
  first_name: '',
  last_name: '',
  middle_name: '',
  preferred_name: '',
  date_of_birth: '',
  gender: 'male',
  marital_status: '',
  occupation: '',
  email: '',
  phone: '',
  mobile_phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
  insurance_provider: '',
  insurance_policy_number: '',
  insurance_group_number: '',
  blood_type: '',
  allergies: '',
  medical_history: '', // Changed from chronic_conditions to match backend
  current_medications: '',
  family_medical_history: '',
  custom_fields: {},
});

/**
 * Validation rules for form fields
 */
const validationRules: Record<string, (value: any) => string | null> = {
  patient_number: (value) => {
    if (!value || value.trim() === '') return 'Patient number is required';
    return null;
  },
  first_name: (value) => {
    if (!value || value.trim() === '') return 'First name is required';
    if (value.length < 2) return 'First name must be at least 2 characters';
    return null;
  },
  last_name: (value) => {
    if (!value || value.trim() === '') return 'Last name is required';
    if (value.length < 2) return 'Last name must be at least 2 characters';
    return null;
  },
  date_of_birth: (value) => {
    if (!value) return 'Date of birth is required';
    const date = new Date(value);
    const today = new Date();
    if (date > today) return 'Date of birth cannot be in the future';
    const age = today.getFullYear() - date.getFullYear();
    if (age > 150) return 'Please enter a valid date of birth';
    return null;
  },
  email: (value) => {
    if (!value) return null; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  phone: (value) => {
    if (!value) return null; // Phone is optional
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
    if (value.replace(/\D/g, '').length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    return null;
  },
  mobile_phone: (value) => {
    if (!value) return null; // Mobile phone is optional
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
    if (value.replace(/\D/g, '').length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    return null;
  },
};

/**
 * Custom hook for patient form management
 * 
 * @param options - Form options
 * @returns Form state and control functions
 * 
 * @example
 * // Create mode
 * const { formData, errors, handleSubmit, setFieldValue } = usePatientForm({
 *   onSuccess: (patient) => router.push(`/patient-management/${patient.id}`)
 * });
 * 
 * // Edit mode
 * const { formData, errors, handleSubmit } = usePatientForm({
 *   patientId: 123,
 *   initialData: existingPatient,
 *   onSuccess: () => toast({ title: 'Patient updated' })
 * });
 */
export function usePatientForm(
  options: UsePatientFormOptions = {}
): UsePatientFormReturn {
  const { patientId, initialData, onSuccess, onError } = options;
  const { toast } = useToast();
  const isEditMode = !!patientId;

  // State
  const [formData, setFormDataState] = useState<PatientRegistrationForm>(() => ({
    ...getInitialFormData(),
    ...initialData,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Update form data (merge with existing)
   */
  const setFormData = useCallback(
    (data: Partial<PatientRegistrationForm>) => {
      setFormDataState((prev) => ({ ...prev, ...data }));
      
      // Clear errors for updated fields
      const updatedFields = Object.keys(data);
      setErrors((prev) => {
        const newErrors = { ...prev };
        updatedFields.forEach((field) => delete newErrors[field]);
        return newErrors;
      });
    },
    []
  );

  /**
   * Set single field value
   */
  const setFieldValue = useCallback(
    (field: keyof PatientRegistrationForm, value: any) => {
      setFormData({ [field]: value });
    },
    [setFormData]
  );

  /**
   * Validate single field
   */
  const validateField = useCallback(
    (field: keyof PatientRegistrationForm): boolean => {
      const validator = validationRules[field];
      if (!validator) return true;

      const error = validator(formData[field]);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
        return false;
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
    },
    [formData]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate all fields with rules
    Object.keys(validationRules).forEach((field) => {
      const validator = validationRules[field];
      const error = validator(formData[field as keyof PatientRegistrationForm]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let patient: Patient;

      if (isEditMode && patientId) {
        // Update existing patient
        patient = await updatePatient(patientId, formData);
        
        toast({
          title: 'Success',
          description: 'Patient updated successfully',
        });
      } else {
        // Create new patient
        patient = await createPatient(formData);
        
        toast({
          title: 'Success',
          description: 'Patient registered successfully',
        });
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(patient);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error submitting patient form:', error);

      // Handle specific error cases
      if (error.message.includes('Patient number already exists')) {
        setErrors({ patient_number: error.message });
      } else if (error.message.includes('Validation error')) {
        // Parse validation errors from API
        const match = error.message.match(/Validation error: (.+)/);
        if (match) {
          const fieldErrors = match[1].split(', ');
          const newErrors: Record<string, string> = {};
          fieldErrors.forEach((fieldError) => {
            const [field, message] = fieldError.split(': ');
            newErrors[field] = message;
          });
          setErrors(newErrors);
        }
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to save patient',
        variant: 'destructive',
      });

      // Call error callback
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    isEditMode,
    patientId,
    validateForm,
    onSuccess,
    onError,
    toast,
  ]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormDataState({
      ...getInitialFormData(),
      ...initialData,
    });
    setErrors({});
  }, [initialData]);

  /**
   * Load initial data when in edit mode
   */
  useEffect(() => {
    if (initialData) {
      setFormDataState((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  return {
    formData,
    errors,
    loading,
    setFormData,
    setFieldValue,
    handleSubmit,
    validateField,
    validateForm,
    resetForm,
    isEditMode,
  };
}
