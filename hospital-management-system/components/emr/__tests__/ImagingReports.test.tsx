/**
 * Unit Tests for Imaging Report Components
 * Tests ImagingReportsList, ImagingReportForm, and ImagingReportDetails
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagingReportsList } from '../ImagingReportsList';
import { ImagingReportForm } from '../ImagingReportForm';
import { ImagingReportDetails } from '../ImagingReportDetails';
import * as imagingReportsHook from '@/hooks/useImagingReports';
import * as patientContextHook from '@/hooks/usePatientContext';
import { ImagingReport } from '@/lib/api/imaging-reports';

// Mock hooks
jest.mock('@/hooks/useImagingReports');
jest.mock('@/hooks/usePatientContext');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock ReportUpload component
jest.mock('../ReportUpload', () => ({
  ReportUpload: ({ onSuccess, onCancel }: any) => (
    <div data-testid="report-upload">
      <button onClick={() => onSuccess([{ name: 'test.dcm', url: '/test.dcm' }])}>
        Upload Success
      </button>
      <button onClick={onCancel}>Cancel Upload</button>
    </div>
  )
}));

describe('ImagingReportsList', () => {
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

  const mockReports: ImagingReport[] = [
    {
      id: 1,
      patient_id: 1,
      imaging_type: 'X-Ray',
      body_part: 'Chest',
      radiologist: 'Dr. Smith',
      report_date: '2025-01-15',
      findings: 'No acute findings. Lungs are clear.',
      impression: 'Normal chest X-ray',
      recommendations: 'No follow-up needed',
      file_count: 2,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    },
    {
      id: 2,
      patient_id: 1,
      imaging_type: 'MRI',
      body_part: 'Brain',
      radiologist: 'Dr. Johnson',
      report_date: '2024-12-20',
      findings: 'Small lesion noted in left frontal lobe.',
      impression: 'Possible benign lesion, recommend follow-up',
      recommendations: 'Follow-up MRI in 6 months',
      file_count: 5,
      created_at: '2024-12-20T14:30:00Z',
      updated_at: '2024-12-20T14:30:00Z'
    },
    {
      id: 3,
      patient_id: 1,
      imaging_type: 'CT Scan',
      body_part: 'Abdomen',
      radiologist: 'Dr. Williams',
      report_date: '2024-11-10',
      findings: 'Normal abdominal structures.',
      impression: 'No abnormalities detected',
      file_count: 0,
      created_at: '2024-11-10T09:15:00Z',
      updated_at: '2024-11-10T09:15:00Z'
    }
  ];

  const mockFetchReports = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
      selectedPatient: mockPatient,
      setSelectedPatient: jest.fn(),
      clearPatient: jest.fn()
    });

    (imagingReportsHook.useImagingReports as jest.Mock).mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      fetchReports: mockFetchReports,
      createReport: jest.fn(),
      updateReport: jest.fn()
    });
  });

  describe('Rendering', () => {
    it('should render imaging reports list', () => {
      render(<ImagingReportsList />);

      expect(screen.getByText('Imaging Reports')).toBeInTheDocument();
      expect(screen.getByText('X-Ray')).toBeInTheDocument();
      expect(screen.getByText('MRI')).toBeInTheDocument();
      expect(screen.getByText('CT Scan')).toBeInTheDocument();
    });

    it('should group reports by imaging type', () => {
      render(<ImagingReportsList />);

      expect(screen.getByText('X-Ray (1)')).toBeInTheDocument();
      expect(screen.getByText('MRI (1)')).toBeInTheDocument();
      expect(screen.getByText('CT Scan (1)')).toBeInTheDocument();
    });

    it('should show file attachment indicators', () => {
      render(<ImagingReportsList />);

      expect(screen.getByText('2 files')).toBeInTheDocument();
      expect(screen.getByText('5 files')).toBeInTheDocument();
    });

    it('should show message when no patient selected', () => {
      (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
        selectedPatient: null,
        setSelectedPatient: jest.fn(),
        clearPatient: jest.fn()
      });

      render(<ImagingReportsList />);

      expect(screen.getByText('Please select a patient to view imaging reports')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      (imagingReportsHook.useImagingReports as jest.Mock).mockReturnValue({
        reports: null,
        loading: true,
        error: null,
        fetchReports: mockFetchReports,
        createReport: jest.fn(),
        updateReport: jest.fn()
      });

      render(<ImagingReportsList />);

      expect(screen.getByText('Loading imaging reports...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      (imagingReportsHook.useImagingReports as jest.Mock).mockReturnValue({
        reports: null,
        loading: false,
        error: 'Failed to load reports',
        fetchReports: mockFetchReports,
        createReport: jest.fn(),
        updateReport: jest.fn()
      });

      render(<ImagingReportsList />);

      expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    it('should filter reports by search term', async () => {
      const user = userEvent.setup();
      render(<ImagingReportsList />);

      const searchInput = screen.getByPlaceholderText(/search reports/i);
      await user.type(searchInput, 'Brain');

      expect(screen.getByText('MRI')).toBeInTheDocument();
      expect(screen.queryByText('X-Ray')).not.toBeInTheDocument();
    });

    it('should filter reports by imaging type', async () => {
      const user = userEvent.setup();
      render(<ImagingReportsList />);

      const typeFilter = screen.getAllByRole('combobox')[0];
      await user.click(typeFilter);
      await user.click(screen.getByText('X-Ray'));

      await waitFor(() => {
        expect(screen.getByText('Chest')).toBeInTheDocument();
        expect(screen.queryByText('Brain')).not.toBeInTheDocument();
      });
    });

    it('should filter reports by date range', async () => {
      const user = userEvent.setup();
      render(<ImagingReportsList />);

      const dateFilter = screen.getAllByRole('combobox')[1];
      await user.click(dateFilter);
      await user.click(screen.getByText('Last 30 Days'));

      await waitFor(() => {
        expect(screen.getByText('X-Ray')).toBeInTheDocument();
        expect(screen.queryByText('CT Scan')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no reports match filter', async () => {
      const user = userEvent.setup();
      render(<ImagingReportsList />);

      const searchInput = screen.getByPlaceholderText(/search reports/i);
      await user.type(searchInput, 'NonexistentReport');

      expect(screen.getByText('No reports match your search criteria')).toBeInTheDocument();
    });
  });

  describe('Report Actions', () => {
    it('should call onAddReport when add button is clicked', async () => {
      const user = userEvent.setup();
      const onAddReport = jest.fn();
      
      render(<ImagingReportsList onAddReport={onAddReport} />);

      const addButton = screen.getByText('Add Report');
      await user.click(addButton);

      expect(onAddReport).toHaveBeenCalled();
    });

    it('should call onViewReport when view button is clicked', async () => {
      const user = userEvent.setup();
      const onViewReport = jest.fn();
      
      render(<ImagingReportsList onViewReport={onViewReport} />);

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(onViewReport).toHaveBeenCalledWith(mockReports[0]);
    });
  });
});

describe('ImagingReportForm', () => {
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

  const mockCreateReport = jest.fn();
  const mockUpdateReport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
      selectedPatient: mockPatient,
      setSelectedPatient: jest.fn(),
      clearPatient: jest.fn()
    });

    (imagingReportsHook.useImagingReports as jest.Mock).mockReturnValue({
      reports: [],
      loading: false,
      error: null,
      fetchReports: jest.fn(),
      createReport: mockCreateReport,
      updateReport: mockUpdateReport
    });
  });

  describe('Rendering', () => {
    it('should render form for new report', () => {
      render(<ImagingReportForm />);

      expect(screen.getByText('New Imaging Report')).toBeInTheDocument();
      expect(screen.getByLabelText('Imaging Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Radiologist')).toBeInTheDocument();
      expect(screen.getByText('Create Report')).toBeInTheDocument();
    });

    it('should render form for editing existing report', () => {
      const initialData = {
        id: 1,
        imaging_type: 'X-Ray',
        body_part: 'Chest',
        radiologist: 'Dr. Smith',
        report_date: '2025-01-15'
      };

      render(<ImagingReportForm initialData={initialData} />);

      expect(screen.getByText('Edit Imaging Report')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Update Report')).toBeInTheDocument();
    });

    it('should show alert when no patient selected', () => {
      (patientContextHook.usePatientContext as jest.Mock).mockReturnValue({
        selectedPatient: null,
        setSelectedPatient: jest.fn(),
        clearPatient: jest.fn()
      });

      render(<ImagingReportForm />);

      expect(screen.getByText('Please select a patient before creating an imaging report')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require imaging type', async () => {
      const user = userEvent.setup();
      render(<ImagingReportForm />);

      const submitButton = screen.getByText('Create Report');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Imaging type is required')).toBeInTheDocument();
      });
    });

    it('should require radiologist', async () => {
      const user = userEvent.setup();
      render(<ImagingReportForm />);

      const submitButton = screen.getByText('Create Report');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Radiologist name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new report on submit', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const mockReport = { id: 1, imaging_type: 'X-Ray' };
      
      mockCreateReport.mockResolvedValue(mockReport);

      render(<ImagingReportForm onSuccess={onSuccess} />);

      // Fill form
      const imagingTypeSelect = screen.getByLabelText('Imaging Type');
      await user.click(imagingTypeSelect);
      await user.click(screen.getByText('X-Ray'));

      await user.type(screen.getByLabelText('Radiologist'), 'Dr. Smith');

      // Submit
      const submitButton = screen.getByText('Create Report');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith(
          expect.objectContaining({
            imaging_type: 'X-Ray',
            radiologist: 'Dr. Smith',
            patient_id: 1
          })
        );
        expect(onSuccess).toHaveBeenCalledWith(mockReport);
      });
    });

    it('should update existing report on submit', async () => {
      const user = userEvent.setup();
      const initialData = {
        id: 1,
        imaging_type: 'X-Ray',
        radiologist: 'Dr. Smith',
        report_date: '2025-01-15'
      };
      const mockReport = { id: 1, imaging_type: 'X-Ray' };
      
      mockUpdateReport.mockResolvedValue(mockReport);

      render(<ImagingReportForm initialData={initialData} />);

      // Update radiologist
      const radiologistInput = screen.getByDisplayValue('Dr. Smith');
      await user.clear(radiologistInput);
      await user.type(radiologistInput, 'Dr. Johnson');

      // Submit
      const submitButton = screen.getByText('Update Report');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateReport).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            radiologist: 'Dr. Johnson'
          })
        );
      });
    });
  });

  describe('File Upload', () => {
    it('should show file upload component when upload button clicked', async () => {
      const user = userEvent.setup();
      render(<ImagingReportForm />);

      const uploadButton = screen.getByText('Upload Files');
      await user.click(uploadButton);

      expect(screen.getByTestId('report-upload')).toBeInTheDocument();
    });

    it('should handle successful file upload', async () => {
      const user = userEvent.setup();
      render(<ImagingReportForm />);

      const uploadButton = screen.getByText('Upload Files');
      await user.click(uploadButton);

      const uploadSuccessButton = screen.getByText('Upload Success');
      await user.click(uploadSuccessButton);

      await waitFor(() => {
        expect(screen.getByText('Uploaded Files (1):')).toBeInTheDocument();
        expect(screen.getByText('test.dcm')).toBeInTheDocument();
      });
    });
  });
});

describe('ImagingReportDetails', () => {
  const mockReport: ImagingReport = {
    id: 1,
    patient_id: 1,
    imaging_type: 'X-Ray',
    body_part: 'Chest',
    radiologist: 'Dr. Smith',
    report_date: '2025-01-15',
    findings: 'No acute findings. Lungs are clear. Heart size is normal.',
    impression: 'Normal chest X-ray',
    recommendations: 'No follow-up needed at this time.',
    file_count: 2,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  };

  describe('Rendering', () => {
    it('should render report details', () => {
      render(<ImagingReportDetails report={mockReport} />);

      expect(screen.getByText('X-Ray Report')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Chest')).toBeInTheDocument();
    });

    it('should render findings section', () => {
      render(<ImagingReportDetails report={mockReport} />);

      expect(screen.getByText('Findings')).toBeInTheDocument();
      expect(screen.getByText(/No acute findings/)).toBeInTheDocument();
    });

    it('should render impression section', () => {
      render(<ImagingReportDetails report={mockReport} />);

      expect(screen.getByText('Impression')).toBeInTheDocument();
      expect(screen.getByText('Normal chest X-ray')).toBeInTheDocument();
    });

    it('should render recommendations section', () => {
      render(<ImagingReportDetails report={mockReport} />);

      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/No follow-up needed/)).toBeInTheDocument();
    });

    it('should show attached files when file_count > 0', () => {
      render(<ImagingReportDetails report={mockReport} />);

      expect(screen.getByText('Attached Files (2)')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<ImagingReportDetails report={mockReport} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should have print button', () => {
      render(<ImagingReportDetails report={mockReport} />);

      expect(screen.getByText('Print')).toBeInTheDocument();
    });
  });
});
