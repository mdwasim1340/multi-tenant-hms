/**
 * useExport Hook
 * 
 * Provides functionality to export data to CSV with selection and filtering
 */

import { useState } from 'react';
import { api } from '@/lib/api';

interface ExportOptions {
  endpoint: string;
  filename?: string;
  filters?: Record<string, any>;
  selectedIds?: number[];
}

interface ExportState {
  isExporting: boolean;
  error: string | null;
}

export function useExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    error: null,
  });

  const exportToCSV = async (options: ExportOptions) => {
    setState({ isExporting: true, error: null });

    try {
      // Build query parameters
      const params: Record<string, any> = {
        ...options.filters,
      };

      // Add selected IDs if provided
      if (options.selectedIds && options.selectedIds.length > 0) {
        params.patient_ids = options.selectedIds.join(',');
      }

      // Make API request
      const response = await api.get(options.endpoint, {
        params,
        responseType: 'blob', // Important for file download
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use provided filename
      const contentDisposition = response.headers['content-disposition'];
      let filename = options.filename || 'export.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setState({ isExporting: false, error: null });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to export data';
      setState({ isExporting: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  return {
    exportToCSV,
    isExporting: state.isExporting,
    error: state.error,
  };
}
