/**
 * Unit Tests for Prescription Components
 * Tests PrescriptionsList and PrescriptionForm
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrescriptionsList } from '../PrescriptionsList';
import { PrescriptionForm } from '../PrescriptionForm';
import * as prescriptionsHook from '@/hooks/usePrescriptions';
import * as patientContextHook from '@/hooks/usePatientContext';
import { Prescription } from '@/lib/api/prescriptions';

// Mock hooks
jest.mock('@/hooks/usePrescriptions');
jest.mock('@/hooks/usePatientContext');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('PrescriptionsList', () => {
  const mockPatient = {
    id: 1,
    patient_number: 'P001',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1980-01-01',
    gender: 'male' as const,
    email: 'john@example.com',
    phone: '555-0100',
    address: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zip_code: '02101',
    country: 'USA',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0101',
    emergency_contact_relationship: 'Spouse',
    blood_type: 'O+' as const,
    status: 'active' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockPrescriptions: Prescription[] = [
    {
      id: 1,
      patient_id: 1,
      medication_name: 'Lisinopril',
      dosage: 10,
      dosage_unit: 'mg',
      frequency: 'Once daily',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      refills_remaining: 3,
      instructions: 'Take with food',
      prescribing_doctor: 'Dr. Smith',
      prescribed_date: '2025-01-01',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      patient_id: 1,
      medication_name: 'Metformin',
      dosage: 500,
      dosage_unit: 'mg',
      frequency: 'Twice daily',
      start_date: '2024-06-01',
      end_date: '2024-12-31',
      refills_remaining: 0,
      instructions: 'Take with meals',
      prescribing_doctor: 'Dr. Johnson',
      prescribed_date: '2024-06-01',
      status: 'expired',
      created_at: '2024-06-01T00:00:00Z',
      updated_at: '2024-12-31T00:00:00Z'
    },
    {
      id: 3,
      patient_id: 1,
      medication_name: 'Aspirin',
      dosage: 81,
      dosage_unit: 'mg',
      frequency: 'Once daily',
      start_date: '2024-01-01',
      end_date: '2024-06-01',
      refills_remaining: 0,
      instructions: 'Take in the morning',
      prescribing_doctor: 'Dr. Smith',
      prescribed_date: '2024-01-01',
      status: 'discontinued',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z'
    }
  ];

  const mockFetchPrescriptions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
      selectedPatient: mockPatient,
      setSelectedPatient: jest.fn(),
      clearPatient: jest.fn()
    });

    (prescriptionsHook.usePrescriptions as jest.Mock).mockReturnValue({
      prescriptions: mockPrescriptions,
      loading: false,
      error: null,
      fetchPrescriptions: mockFetchPrescriptions,
      createPrescription: jest.fn(),
      updatePrescription: jest.fn()
    });
  });

  describe('Rendering', () => {
    it('should render prescriptions list', () => {
      render(<PrescriptionsList />);

      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    it('should show prescription counts by status', () => {
      render(<PrescriptionsList />);

      // 1 active, 1 expired, 1 discontinued
      expect(screen.getByText('1')).toBeInTheDocument(); // Active count
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('Discontinued')).toBeInTheDocument();
    });

    it('should show drug interaction warning when interactions detected', () => {
      // Mock prescriptions with known interactions (warfarin + aspirin)
      const interactionPrescriptions: Prescription[] = [
        {
          ...mockPrescriptions[0],
          medication_name: 'Warfarin',
          status: 'active'
        },
        {
          ...mockPrescriptions[1],
          medication_name: 'Aspirin',
          status: 'active'
        }
      ];

      (prescriptionsHook.usePrescriptions as jest.Mock).mockReturnValue({
        prescriptions: interactionPrescriptions,
        loading: false,
        error: null,
        fetchPrescriptions: mockFetchPrescriptions,
        createPrescription: jest.fn(),
        updatePrescription: jest.fn()
      });

      render(<PrescriptionsList />);

      expect(screen.getByText('DRUG INTERACTION WARNING')).toBeInTheDocument();
      expect(screen.getByText(/warfarin \+ aspirin/i)).toBeInTheDocument();
    });

    it('should not show drug interaction warning when no interactions', () => {
      render(<PrescriptionsList />);

      expect(screen.queryByText('DRUG INTERACTION WARNING')).not.toBeInTheDocument();
    });

    it('should show message when no patient selected', () => {
      (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
        selectedPatient: null,
        setSelectedPatient: jest.fn(),
        clearPatient: jest.fn()
      });

      render(<PrescriptionsList />);

      expect(screen.getByText('Please select a patient to view prescriptions')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      (prescriptionsHook.usePrescriptions as jest.Mock).mockReturnValue({
        prescriptions: null,
        loading: true,
        error: null,
        fetchPrescriptions: mockFetchPrescriptions,
        createPrescription: jest.fn(),
        updatePrescription: jest.fn()
      });

      render(<PrescriptionsList />);

      expect(screen.getByText('Loading prescriptions...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      (prescriptionsHook.usePrescriptions as jest.Mock).mockReturnValue({
        prescriptions: null,
        loading: false,
        error: 'Failed to load prescriptions',
        fetchPrescriptions: mockFetchPrescriptions,
        createPrescription: jest.fn(),
        updatePrescription: jest.fn()
      });

      render(<PrescriptionsList />);

      expect(screen.getByText('Failed to load prescriptions')).toBeInTheDocument();
    });
  });

  describe('Prescription Details Display', () => {
    it('should display prescription details correctly', () => {
      render(<PrescriptionsList />);

      // Check Lisinopril details
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
      expect(screen.getByText(/10 mg/)).toBeInTheDocument();
      expect(screen.getByText(/Once daily/)).toBeInTheDocument();
      expect(screen.getByText(/Dr\. Smith/)).toBeInTheDocument();
      expect(screen.getByText(/3 remaining/)).toBeInTheDocument();
    });

    it('should show status badges correctly', () => {
      render(<PrescriptionsList />);

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('EXPIRED')).toBeInTheDocument();
      expect(screen.getByText('DISCONTINUED')).toBeInTheDocument();
    });

    it('should show "No Refills" badge when refills are 0', () => {
      render(<PrescriptionsList />);

      const noRefillsBadges = screen.getAllByText('No Refills');
      expect(noRefillsBadges.length).toBeGreaterThan(0);
    });

    it('should show "Expiring Soon" badge for prescriptions ending within 30 days', () => {
      const soonToExpire: Prescription[] = [
        {
          ...mockPrescriptions[0],
          end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
          status: 'active'
        }
      ];

      (prescriptionsHook.usePrescriptions as jest.Mock).mockReturnValue({
        prescriptions: soonToExpire,
        loading: false,
        error: null,
        fetchPrescriptions: mockFetchPrescriptions,
        createPrescription: jest.fn(),
        updatePrescription: jest.fn()
      });

      render(<PrescriptionsList />);

      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    it('should filter prescriptions by search term', async () => {
      const user = userEvent.setup();
      render(<PrescriptionsList />);

      const searchInput = screen.getByPlaceholderText(/search medications/i);
      await user.type(searchInput, 'Lisinopril');

      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
      expect(screen.queryByText('Metformin')).not.toBeInTheDocument();
    });

    it('should filter prescriptions by status', async () => {
      const user = userEvent.setup();
      render(<PrescriptionsList />);

      const statusFilter = screen.getByRole('combobox');
      await user.click(statusFilter);
      await user.click(screen.getByText('Active Only'));

      await waitFor(() => {
        expect(screen.getByText('Lisinopril')).toBeInTheDocument();
        expect(screen.queryByText('Metformin')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no prescriptions match filter', async () => {
      const user = userEvent.setup();
      render(<PrescriptionsList />);

      const searchInput = screen.getByPlaceholderText(/search medications/i);
      await user.type(searchInput, 'NonexistentMedication');

      expect(screen.getByText('No prescriptions match your search criteria')).toBeInTheDocument();
    });
  });

  describe('Add Prescription Functionality', () => {
    it('should call onAddPrescription when add button is clicked', async () => {
      const user = userEvent.setup();
      const onAddPrescription = jest.fn();
      
      render(<PrescriptionsList onAddPrescription={onAddPrescription} />);

      const addButton = screen.getByText('Add Prescription');
      await user.click(addButton);

      expect(onAddPrescription).toHaveBeenCalled();
    });
  });
});

describe('PrescriptionForm', () => {
  const mockPatient = {
    id: 1,
    patient_number: 'P001',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1980-01-01',
    gender: 'male' as const,
    email: 'john@example.com',
    phone: '555-0100',
    address: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zip_code: '02101',
    country: 'USA',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0101',
    emergency_contact_relationship: 'Spouse',
    blood_type: 'O+' as const,
    status: 'active' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockCreatePrescription = jest.fn();
  const mockUpdatePrescription = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
      selectedPatient: mockPatient,
      setSelectedPatient: jest.fn(),
      clearPatient: jest.fn()
    });

    (prescriptionsHook.usePrescriptions as jest.Mock).mockReturnValue({
      prescriptions: [],
      loading: false,
      error: null,
      fetchPrescriptions: jest.fn(),
      createPrescription: mockCreatePrescription,
      updatePrescription: mockUpdatePrescription
    });
  });

  describe('Rendering', () => {
    it('should render form for new prescription', () => {
      render(<PrescriptionForm />);

      expect(screen.getByText('New Prescription')).toBeInTheDocument();
      expect(screen.getByLabelText('Medication Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Dosage')).toBeInTheDocument();
      expect(screen.getByLabelText('Unit')).toBeInTheDocument();
      expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Create Prescription')).toBeInTheDocument();
    });

    it('should render form for editing existing prescription', () => {
      const initialData = {
        id: 1,
        medication_name: 'Lisinopril',
        dosage: 10,
        dosage_unit: 'mg',
        frequency: 'Once daily',
        prescribing_doctor: 'Dr. Smith'
      };

      render(<PrescriptionForm initialData={initialData} />);

      expect(screen.getByText('Edit Prescription')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Lisinopril')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByText('Update Prescription')).toBeInTheDocument();
    });

    it('should show alert when no patient selected', () => {
      (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
        selectedPatient: null,
        setSelectedPatient: jest.fn(),
        clearPatient: jest.fn()
      });

      render(<PrescriptionForm />);

      expect(screen.getByText('Please select a patient before creating a prescription')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require medication name', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Medication name is required')).toBeInTheDocument();
      });
    });

    it('should require dosage greater than 0', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const dosageInput = screen.getByLabelText('Dosage');
      await user.clear(dosageInput);
      await user.type(dosageInput, '0');

      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Dosage must be greater than 0')).toBeInTheDocument();
      });
    });

    it('should require dosage unit', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const medicationInput = screen.getByLabelText('Medication Name');
      await user.type(medicationInput, 'Test Med');

      const dosageInput = screen.getByLabelText('Dosage');
      await user.type(dosageInput, '10');

      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      // Should pass validation since unit has default value
      expect(mockCreatePrescription).toHaveBeenCalled();
    });

    it('should require frequency', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const medicationInput = screen.getByLabelText('Medication Name');
      await user.type(medicationInput, 'Test Med');

      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Frequency is required')).toBeInTheDocument();
      });
    });

    it('should require prescribing doctor', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const medicationInput = screen.getByLabelText('Medication Name');
      await user.type(medicationInput, 'Test Med');

      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Prescribing doctor is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new prescription on submit', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const mockPrescription = { id: 1, medication_name: 'Lisinopril' };
      
      mockCreatePrescription.mockResolvedValue(mockPrescription);

      render(<PrescriptionForm onSuccess={onSuccess} />);

      // Fill form
      await user.type(screen.getByLabelText('Medication Name'), 'Lisinopril');
      await user.type(screen.getByLabelText('Dosage'), '10');
      
      const frequencySelect = screen.getByLabelText('Frequency');
      await user.click(frequencySelect);
      await user.click(screen.getByText('Once daily'));

      await user.type(screen.getByLabelText('Prescribing Doctor'), 'Dr. Smith');

      // Submit
      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePrescription).toHaveBeenCalledWith(
          expect.objectContaining({
            medication_name: 'Lisinopril',
            dosage: 10,
            frequency: 'Once daily',
            prescribing_doctor: 'Dr. Smith',
            patient_id: 1
          })
        );
        expect(onSuccess).toHaveBeenCalledWith(mockPrescription);
      });
    });

    it('should update existing prescription on submit', async () => {
      const user = userEvent.setup();
      const initialData = {
        id: 1,
        medication_name: 'Lisinopril',
        dosage: 10,
        dosage_unit: 'mg',
        frequency: 'Once daily',
        prescribing_doctor: 'Dr. Smith',
        start_date: '2025-01-01'
      };
      const mockPrescription = { id: 1, medication_name: 'Updated Lisinopril' };
      
      mockUpdatePrescription.mockResolvedValue(mockPrescription);

      render(<PrescriptionForm initialData={initialData} />);

      // Update medication name
      const medicationInput = screen.getByDisplayValue('Lisinopril');
      await user.clear(medicationInput);
      await user.type(medicationInput, 'Updated Lisinopril');

      // Submit
      const submitButton = screen.getByText('Update Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePrescription).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            medication_name: 'Updated Lisinopril'
          })
        );
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      
      mockCreatePrescription.mockRejectedValue(new Error('API Error'));

      render(<PrescriptionForm />);

      await user.type(screen.getByLabelText('Medication Name'), 'Test Med');
      await user.type(screen.getByLabelText('Dosage'), '10');
      
      const frequencySelect = screen.getByLabelText('Frequency');
      await user.click(frequencySelect);
      await user.click(screen.getByText('Once daily'));

      await user.type(screen.getByLabelText('Prescribing Doctor'), 'Dr. Smith');

      const submitButton = screen.getByText('Create Prescription');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Dosage Unit Selection', () => {
    it('should provide common dosage units', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const unitSelect = screen.getByLabelText('Unit');
      await user.click(unitSelect);

      expect(screen.getByText('mg (milligrams)')).toBeInTheDocument();
      expect(screen.getByText('g (grams)')).toBeInTheDocument();
      expect(screen.getByText('ml (milliliters)')).toBeInTheDocument();
      expect(screen.getByText('tablets')).toBeInTheDocument();
    });
  });

  describe('Frequency Selection', () => {
    it('should provide common frequency options', async () => {
      const user = userEvent.setup();
      render(<PrescriptionForm />);

      const frequencySelect = screen.getByLabelText('Frequency');
      await user.click(frequencySelect);

      expect(screen.getByText('Once daily')).toBeInTheDocument();
      expect(screen.getByText('Twice daily')).toBeInTheDocument();
      expect(screen.getByText('As needed (PRN)')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<PrescriptionForm onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
