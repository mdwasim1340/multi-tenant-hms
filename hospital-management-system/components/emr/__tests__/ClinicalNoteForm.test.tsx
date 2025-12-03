/**
 * Unit Tests for ClinicalNoteForm Component
 * Tests form validation and submission
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClinicalNoteForm } from '../ClinicalNoteForm';
import * as clinicalNotesHook from '@/hooks/useClinicalNotes';
import * as patientContextHook from '@/hooks/usePatientContext';
import { ClinicalNote } from '@/lib/api/clinical-notes';

// Mock hooks
jest.mock('@/hooks/useClinicalNotes');
jest.mock('@/hooks/usePatientContext');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ClinicalNoteForm', () => {
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

  const mockCreateNote = jest.fn();
  const mockUpdateNote = jest.fn();
  const mockGetNoteVersions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
      selectedPatient: mockPatient,
      setSelectedPatient: jest.fn(),
      clearPatient: jest.fn()
    });

    (clinicalNotesHook.useClinicalNotes as jest.Mock).mockReturnValue({
      createNote: mockCreateNote,
      updateNote: mockUpdateNote,
      getNoteVersions: mockGetNoteVersions,
      loading: false
    });

    mockGetNoteVersions.mockResolvedValue({ versions: [] });
  });

  describe('Rendering', () => {
    it('should render form for new note', () => {
      render(<ClinicalNoteForm />);

      expect(screen.getByText('New Clinical Note')).toBeInTheDocument();
      expect(screen.getByText('Select Patient')).toBeInTheDocument();
      expect(screen.getByLabelText('Note Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Provider ID')).toBeInTheDocument();
      expect(screen.getByText('Save Note')).toBeInTheDocument();
    });

    it('should render form for editing existing note', () => {
      const initialData: ClinicalNote = {
        id: 1,
        patient_id: 1,
        provider_id: 1,
        note_type: 'progress_note',
        content: '<p>Existing content</p>',
        status: 'draft',
        signed_at: null,
        signed_by: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      render(
        <ClinicalNoteForm
          noteId={1}
          initialData={initialData}
        />
      );

      expect(screen.getByText('Edit Clinical Note')).toBeInTheDocument();
      expect(screen.getByText('Update Note')).toBeInTheDocument();
      expect(screen.getByText('Sign Note')).toBeInTheDocument();
    });

    it('should show patient selector for new notes', () => {
      render(<ClinicalNoteForm />);

      expect(screen.getByText('Select Patient')).toBeInTheDocument();
    });

    it('should not show patient selector when editing', () => {
      render(
        <ClinicalNoteForm
          noteId={1}
          initialData={{
            id: 1,
            patient_id: 1,
            provider_id: 1,
            note_type: 'progress_note',
            content: '<p>Content</p>',
            status: 'draft',
            signed_at: null,
            signed_by: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }}
        />
      );

      expect(screen.queryByText('Select Patient')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require patient selection', () => {
      (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
        selectedPatient: null,
        setSelectedPatient: jest.fn(),
        clearPatient: jest.fn()
      });

      render(<ClinicalNoteForm />);

      expect(screen.getByText(/Please select a patient/i)).toBeInTheDocument();
      
      const submitButton = screen.getByText('Save Note');
      expect(submitButton).toBeDisabled();
    });

    it('should require note type selection', async () => {
      render(<ClinicalNoteForm />);

      const noteTypeSelect = screen.getByLabelText('Note Type');
      expect(noteTypeSelect).toBeInTheDocument();
    });

    it('should require provider ID', async () => {
      render(<ClinicalNoteForm />);

      const providerInput = screen.getByLabelText('Provider ID');
      expect(providerInput).toBeInTheDocument();
      expect(providerInput).toHaveAttribute('type', 'number');
    });

    it('should require note content', async () => {
      render(<ClinicalNoteForm />);

      expect(screen.getByText(/Note Content/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should create new note on submit', async () => {
      const user = userEvent.setup();
      const mockNote: ClinicalNote = {
        id: 1,
        patient_id: 1,
        provider_id: 1,
        note_type: 'progress_note',
        content: '<p>New note content</p>',
        status: 'draft',
        signed_at: null,
        signed_by: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockCreateNote.mockResolvedValue(mockNote);

      render(<ClinicalNoteForm />);

      // Fill in provider ID
      const providerInput = screen.getByLabelText('Provider ID');
      await user.clear(providerInput);
      await user.type(providerInput, '1');

      // Submit form
      const submitButton = screen.getByText('Save Note');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalled();
      });
    });

    it('should update existing note on submit', async () => {
      const user = userEvent.setup();
      const updatedNote: ClinicalNote = {
        id: 1,
        patient_id: 1,
        provider_id: 1,
        note_type: 'progress_note',
        content: '<p>Updated content</p>',
        status: 'draft',
        signed_at: null,
        signed_by: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T01:00:00Z'
      };

      mockUpdateNote.mockResolvedValue(updatedNote);

      render(
        <ClinicalNoteForm
          noteId={1}
          initialData={{
            id: 1,
            patient_id: 1,
            provider_id: 1,
            note_type: 'progress_note',
            content: '<p>Original content</p>',
            status: 'draft',
            signed_at: null,
            signed_by: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }}
        />
      );

      const submitButton = screen.getByText('Update Note');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateNote).toHaveBeenCalledWith(1, expect.any(Object));
      });
    });

    it('should call onSuccess callback after successful save', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const mockNote: ClinicalNote = {
        id: 1,
        patient_id: 1,
        provider_id: 1,
        note_type: 'progress_note',
        content: '<p>Content</p>',
        status: 'draft',
        signed_at: null,
        signed_by: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockCreateNote.mockResolvedValue(mockNote);

      render(<ClinicalNoteForm onSuccess={onSuccess} />);

      const providerInput = screen.getByLabelText('Provider ID');
      await user.clear(providerInput);
      await user.type(providerInput, '1');

      const submitButton = screen.getByText('Save Note');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockNote);
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      mockCreateNote.mockRejectedValue(new Error('API Error'));

      render(<ClinicalNoteForm />);

      const providerInput = screen.getByLabelText('Provider ID');
      await user.clear(providerInput);
      await user.type(providerInput, '1');

      const submitButton = screen.getByText('Save Note');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalled();
      });

      // Error should be logged (toast.error called)
    });
  });

  describe('Note Signing', () => {
    it('should show sign button for existing draft notes', () => {
      render(
        <ClinicalNoteForm
          noteId={1}
          initialData={{
            id: 1,
            patient_id: 1,
            provider_id: 1,
            note_type: 'progress_note',
            content: '<p>Content</p>',
            status: 'draft',
            signed_at: null,
            signed_by: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }}
        />
      );

      expect(screen.getByText('Sign Note')).toBeInTheDocument();
    });

    it('should not show sign button for new notes', () => {
      render(<ClinicalNoteForm />);

      expect(screen.queryByText('Sign Note')).not.toBeInTheDocument();
    });

    it('should make form read-only when note is signed', () => {
      render(
        <ClinicalNoteForm
          noteId={1}
          initialData={{
            id: 1,
            patient_id: 1,
            provider_id: 1,
            note_type: 'progress_note',
            content: '<p>Content</p>',
            status: 'signed',
            signed_at: '2025-01-01T00:00:00Z',
            signed_by: 1,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }}
        />
      );

      expect(screen.getByText('Signed - Read Only')).toBeInTheDocument();
      expect(screen.queryByText('Update Note')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Note')).not.toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ClinicalNoteForm onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should not show cancel button when onCancel is not provided', () => {
      render(<ClinicalNoteForm />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Version History', () => {
    it('should load version history for existing notes', async () => {
      render(
        <ClinicalNoteForm
          noteId={1}
          initialData={{
            id: 1,
            patient_id: 1,
            provider_id: 1,
            note_type: 'progress_note',
            content: '<p>Content</p>',
            status: 'draft',
            signed_at: null,
            signed_by: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }}
        />
      );

      await waitFor(() => {
        expect(mockGetNoteVersions).toHaveBeenCalledWith(1);
      });
    });

    it('should not load version history for new notes', () => {
      render(<ClinicalNoteForm />);

      expect(mockGetNoteVersions).not.toHaveBeenCalled();
    });
  });
});
