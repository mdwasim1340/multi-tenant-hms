/**
 * PatientSelector Component Tests
 * Unit tests for patient selector functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PatientSelector, PatientSelectorButton } from '../PatientSelector';

// Mock hooks
vi.mock('@/hooks/usePatients', () => ({
  usePatients: vi.fn(() => ({
    patients: [
      {
        id: 1,
        patient_number: 'P001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-01-01',
        email: 'john@example.com',
        phone: '555-0001',
        status: 'active'
      },
      {
        id: 2,
        patient_number: 'P002',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1990-05-15',
        email: 'jane@example.com',
        phone: '555-0002',
        status: 'active'
      }
    ],
    loading: false,
    error: null,
    setSearch: vi.fn()
  }))
}));

vi.mock('@/hooks/usePatientContext', () => ({
  usePatientContext: vi.fn(() => ({
    selectedPatient: null,
    setSelectedPatient: vi.fn(),
    clearPatient: vi.fn(),
    isPatientSelected: false
  }))
}));

vi.mock('@/hooks/useMedicalHistory', () => ({
  useMedicalHistory: vi.fn(() => ({
    getCriticalAllergies: vi.fn().mockResolvedValue([])
  }))
}));

describe('PatientSelector', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patient selector dialog when open', () => {
    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Select Patient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });

  it('should display list of patients', () => {
    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.getByText('P002')).toBeInTheDocument();
  });

  it('should show patient details when patient is clicked', async () => {
    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    const johnDoe = screen.getByText('John Doe');
    fireEvent.click(johnDoe);
    
    await waitFor(() => {
      expect(screen.getByText('Patient Details')).toBeInTheDocument();
    });
  });

  it('should handle search input', () => {
    const { usePatients } = require('@/hooks/usePatients');
    const mockSetSearch = vi.fn();
    usePatients.mockReturnValue({
      patients: [],
      loading: false,
      error: null,
      setSearch: mockSetSearch
    });

    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Search is debounced, so we need to wait
    setTimeout(() => {
      expect(mockSetSearch).toHaveBeenCalledWith('John');
    }, 350);
  });

  it('should display loading state', () => {
    const { usePatients } = require('@/hooks/usePatients');
    usePatients.mockReturnValue({
      patients: [],
      loading: true,
      error: null,
      setSearch: vi.fn()
    });

    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Loading patients...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const { usePatients } = require('@/hooks/usePatients');
    usePatients.mockReturnValue({
      patients: [],
      loading: false,
      error: new Error('Failed to load'),
      setSearch: vi.fn()
    });

    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/failed to load patients/i)).toBeInTheDocument();
  });

  it('should display empty state when no patients found', () => {
    const { usePatients } = require('@/hooks/usePatients');
    usePatients.mockReturnValue({
      patients: [],
      loading: false,
      error: null,
      setSearch: vi.fn()
    });

    render(<PatientSelector open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('No active patients found')).toBeInTheDocument();
  });
});

describe('PatientSelectorButton', () => {
  const mockOnOpenSelector = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Select Patient" button when no patient selected', () => {
    render(<PatientSelectorButton onOpenSelector={mockOnOpenSelector} />);
    
    expect(screen.getByText('Select Patient')).toBeInTheDocument();
  });

  it('should show patient info when patient is selected', () => {
    const { usePatientContext } = require('@/hooks/usePatientContext');
    usePatientContext.mockReturnValue({
      selectedPatient: {
        id: 1,
        patient_number: 'P001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-01-01'
      },
      clearPatient: vi.fn(),
      isPatientSelected: true
    });

    render(<PatientSelectorButton onOpenSelector={mockOnOpenSelector} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('should call onOpenSelector when button is clicked', () => {
    render(<PatientSelectorButton onOpenSelector={mockOnOpenSelector} />);
    
    const button = screen.getByText('Select Patient');
    fireEvent.click(button);
    
    expect(mockOnOpenSelector).toHaveBeenCalled();
  });
});
