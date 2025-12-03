/**
 * useImagingReports Hook
 * 
 * Custom hook for fetching and managing imaging reports with file attachments.
 * Handles loading states, error handling, and file operations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getImagingReports,
  getImagingReport,
  getPatientImagingReports,
  createImagingReport,
  updateImagingReport,
  deleteImagingReport,
  searchImagingReports,
  attachFileToReport,
  getReportFiles,
  deleteReportFile,
  ImagingReport,
  ImagingReportFile,
  CreateReportData,
  UpdateReportData,
  ListReportsParams,
  SearchReportsParams,
  AttachFileData
} from '@/lib/api/imaging-reports';

export interface UseImagingReportsOptions extends ListReportsParams {
  autoFetch?: boolean;
}

export interface UseImagingReportsReturn {
  reports: ImagingReport[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createReport: (data: CreateReportData) => Promise<ImagingReport>;
  updateReport: (id: number, data: UpdateReportData) => Promise<ImagingReport>;
  deleteReport: (id: number) => Promise<void>;
  getReport: (id: number) => Promise<ImagingReport>;
  searchReports: (params: SearchReportsParams) => Promise<ImagingReport[]>;
  attachFile: (reportId: number, data: AttachFileData) => Promise<ImagingReportFile>;
  getFiles: (reportId: number) => Promise<ImagingReportFile[]>;
  deleteFile: (reportId: number, fileId: number) => Promise<void>;
}

/**
 * Custom hook for managing imaging reports
 */
export function useImagingReports(options: UseImagingReportsOptions = {}): UseImagingReportsReturn {
  const { autoFetch = true, ...params } = options;
  const [reports, setReports] = useState<ImagingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = params.patient_id
        ? await getPatientImagingReports(params.patient_id, params)
        : await getImagingReports(params);
      
      setReports(response.reports || response.data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching imaging reports:', err);
    } finally {
      setLoading(false);
    }
  }, [params.patient_id, params.imaging_type, params.status, params.start_date, params.end_date]);

  useEffect(() => {
    if (autoFetch) {
      fetchReports();
    }
  }, [autoFetch, fetchReports]);

  const createReport = useCallback(async (data: CreateReportData): Promise<ImagingReport> => {
    try {
      setLoading(true);
      setError(null);
      const response = await createImagingReport(data);
      await fetchReports(); // Refresh list
      return response.report || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  const updateReport = useCallback(async (id: number, data: UpdateReportData): Promise<ImagingReport> => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateImagingReport(id, data);
      await fetchReports(); // Refresh list
      return response.report || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  const deleteReport = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteImagingReport(id);
      await fetchReports(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  const getReport = useCallback(async (id: number): Promise<ImagingReport> => {
    try {
      const response = await getImagingReport(id);
      return response.report || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const searchReportsFunc = useCallback(async (params: SearchReportsParams): Promise<ImagingReport[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchImagingReports(params);
      const results = response.reports || response.data || [];
      setReports(results);
      return results;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const attachFile = useCallback(async (reportId: number, data: AttachFileData): Promise<ImagingReportFile> => {
    try {
      const response = await attachFileToReport(reportId, data);
      return response.file || response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const getFiles = useCallback(async (reportId: number): Promise<ImagingReportFile[]> => {
    try {
      const response = await getReportFiles(reportId);
      return response.files || response.data || [];
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (reportId: number, fileId: number): Promise<void> => {
    try {
      await deleteReportFile(reportId, fileId);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    createReport,
    updateReport,
    deleteReport,
    getReport,
    searchReports: searchReportsFunc,
    attachFile,
    getFiles,
    deleteFile
  };
}
