/**
 * Unit Tests for ReportUpload Component
 * Tests file validation and upload flow
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportUpload } from '../ReportUpload';
import * as reportUploadApi from '@/lib/api/report-upload';

// Mock the report upload API
jest.mock('@/lib/api/report-upload');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ReportUpload', () => {
  const mockGetPresignedUrl = jest.fn();
  const mockUploadToS3 = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (reportUploadApi.getPresignedUploadUrl as jest.Mock) = mockGetPresignedUrl;
    (reportUploadApi.uploadFileToS3 as jest.Mock) = mockUploadToS3;
  });

  describe('File Selection', () => {
    it('should render upload area', () => {
      render(<ReportUpload patientId={1} />);

      expect(screen.getByText(/Drop your file here/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF, DOCX, JPG, PNG up to 25MB/i)).toBeInTheDocument();
    });

    it('should accept file via file input', async () => {
      const user = userEvent.setup();
      render(<ReportUpload patientId={1} />);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
      }
    });

    it('should show file preview for images', async () => {
      const user = userEvent.setup();
      render(<ReportUpload patientId={1} />);

      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        // Mock URL.createObjectURL
        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');

        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByAltText('Preview')).toBeInTheDocument();
        });
      }
    });

    it('should allow removing selected file', async () => {
      const user = userEvent.setup();
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });

        // Remove file
        const removeButton = screen.getByRole('button', { name: '' }); // X button
        await user.click(removeButton);

        await waitFor(() => {
          expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('File Validation', () => {
    it('should reject invalid file types', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('Invalid file type')
          );
        });
      }
    });

    it('should reject files larger than 25MB', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      
      render(<ReportUpload patientId={1} />);

      // Create a file larger than 25MB
      const largeFile = new File(
        [new ArrayBuffer(26 * 1024 * 1024)],
        'large.pdf',
        { type: 'application/pdf' }
      );

      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, largeFile);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('exceeds 25MB limit')
          );
        });
      }
    });

    it('should accept valid PDF files', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('File selected successfully');
        });
      }
    });

    it('should accept valid DOCX files', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      
      render(<ReportUpload patientId={1} />);

      const file = new File(
        ['test'],
        'test.docx',
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalled();
        });
      }
    });

    it('should accept valid image files', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');
      
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
        await user.upload(input, file);

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Metadata Form', () => {
    it('should show metadata form after file selection', async () => {
      const user = userEvent.setup();
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByText('Report Metadata')).toBeInTheDocument();
          expect(screen.getByLabelText('Report Type')).toBeInTheDocument();
          expect(screen.getByLabelText('Report Date')).toBeInTheDocument();
          expect(screen.getByLabelText('Author')).toBeInTheDocument();
        });
      }
    });

    it('should have default values in metadata form', async () => {
      const user = userEvent.setup();
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          const dateInput = screen.getByLabelText('Report Date') as HTMLInputElement;
          expect(dateInput.value).toBeTruthy(); // Should have today's date
        });
      }
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByText('Report Metadata')).toBeInTheDocument();
        });

        // Try to submit without filling author
        const submitButton = screen.getByRole('button', { name: /Upload Report/i });
        await user.click(submitButton);

        // Should show validation error
        await waitFor(() => {
          expect(screen.getByText(/Author is required/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Upload Flow', () => {
    it('should upload file and metadata on submit', async () => {
      const user = userEvent.setup();
      const onUploadComplete = jest.fn();

      mockGetPresignedUrl.mockResolvedValue({
        uploadUrl: 'https://s3.amazonaws.com/upload',
        fileUrl: 'https://s3.amazonaws.com/file.pdf'
      });
      mockUploadToS3.mockResolvedValue(undefined);

      render(
        <ReportUpload
          patientId={1}
          onUploadComplete={onUploadComplete}
        />
      );

      // Select file
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByText('Report Metadata')).toBeInTheDocument();
        });

        // Fill metadata
        const authorInput = screen.getByLabelText('Author');
        await user.type(authorInput, 'Dr. Smith');

        // Submit
        const submitButton = screen.getByRole('button', { name: /Upload Report/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockGetPresignedUrl).toHaveBeenCalled();
          expect(mockUploadToS3).toHaveBeenCalled();
          expect(onUploadComplete).toHaveBeenCalledWith(
            'https://s3.amazonaws.com/file.pdf',
            expect.objectContaining({
              author: 'Dr. Smith'
            })
          );
        });
      }
    });

    it('should show upload progress', async () => {
      const user = userEvent.setup();

      mockGetPresignedUrl.mockResolvedValue({
        uploadUrl: 'https://s3.amazonaws.com/upload',
        fileUrl: 'https://s3.amazonaws.com/file.pdf'
      });

      // Mock upload with progress callback
      mockUploadToS3.mockImplementation((url, file, onProgress) => {
        onProgress(50);
        return Promise.resolve();
      });

      render(<ReportUpload patientId={1} />);

      // Select and upload file
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByLabelText('Author')).toBeInTheDocument();
        });

        const authorInput = screen.getByLabelText('Author');
        await user.type(authorInput, 'Dr. Smith');

        const submitButton = screen.getByRole('button', { name: /Upload Report/i });
        await user.click(submitButton);

        // Should show uploading status
        await waitFor(() => {
          expect(screen.getByText(/Uploading/i)).toBeInTheDocument();
        });
      }
    });

    it('should handle upload errors', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      mockGetPresignedUrl.mockRejectedValue(new Error('Upload failed'));

      render(<ReportUpload patientId={1} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByLabelText('Author')).toBeInTheDocument();
        });

        const authorInput = screen.getByLabelText('Author');
        await user.type(authorInput, 'Dr. Smith');

        const submitButton = screen.getByRole('button', { name: /Upload Report/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag and drop', async () => {
      render(<ReportUpload patientId={1} />);

      const dropZone = screen.getByText(/Drop your file here/i).closest('div');
      
      if (dropZone) {
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        const dataTransfer = {
          files: [file],
          types: ['Files']
        };

        fireEvent.dragEnter(dropZone, { dataTransfer });
        fireEvent.drop(dropZone, { dataTransfer });

        await waitFor(() => {
          expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ReportUpload patientId={1} onCancel={onCancel} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByRole('button', { name: /Drop your file here/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      if (input) {
        await user.upload(input, file);

        await waitFor(() => {
          expect(screen.getByText('Report Metadata')).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        await user.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
      }
    });
  });
});
