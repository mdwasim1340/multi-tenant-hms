/**
 * Medical Records Module Hooks
 * Custom hooks for managing medical records data
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  LabReport,
  ImagingReport,
  ClinicalNote,
  ClinicalDocument,
  MedicalRecordListItem,
  MedicalRecordsFilters,
  PaginationParams,
  PaginatedResponse,
} from '@/types/medical-records';
import * as api from '@/lib/api/medical-records-module';

// ============================================
// Lab Reports Hook
// ============================================

interface UseLabReportsOptions {
  patientId?: number;
  filters?: MedicalRecordsFilters;
  autoFetch?: boolean;
}

export function useLabReports(options: UseLabReportsOptions = {}) {
  const { patientId, filters, autoFetch = true } = options;
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const fetchReports = useCallback(async (page = 1) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchLabReports(patientId, filters, { page, limit: pagination.limit });
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch lab reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filters, pagination.limit]);

  useEffect(() => {
    if (autoFetch && patientId) {
      fetchReports();
    }
  }, [autoFetch, patientId, fetchReports]);

  return { reports, loading, error, pagination, fetchReports, setReports };
}

export function useLabReportDetails(reportId: number | null) {
  const [report, setReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!reportId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchLabReportDetails(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch lab report details');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) fetchDetails();
  }, [reportId, fetchDetails]);

  return { report, loading, error, refetch: fetchDetails };
}

// ============================================
// Imaging Reports Hook
// ============================================

interface UseImagingReportsOptions {
  patientId?: number;
  filters?: MedicalRecordsFilters;
  autoFetch?: boolean;
}

export function useImagingReportsModule(options: UseImagingReportsOptions = {}) {
  const { patientId, filters, autoFetch = true } = options;
  const [reports, setReports] = useState<ImagingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const fetchReports = useCallback(async (page = 1) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchImagingReports(patientId, filters, { page, limit: pagination.limit });
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch imaging reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filters, pagination.limit]);

  useEffect(() => {
    if (autoFetch && patientId) {
      fetchReports();
    }
  }, [autoFetch, patientId, fetchReports]);

  return { reports, loading, error, pagination, fetchReports, setReports };
}

export function useImagingReportDetails(reportId: number | null) {
  const [report, setReport] = useState<ImagingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!reportId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchImagingReportDetails(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch imaging report details');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) fetchDetails();
  }, [reportId, fetchDetails]);

  return { report, loading, error, refetch: fetchDetails };
}

// ============================================
// Clinical Notes Hook
// ============================================

interface UseClinicalNotesModuleOptions {
  patientId?: number;
  filters?: MedicalRecordsFilters;
  autoFetch?: boolean;
}

export function useClinicalNotesModule(options: UseClinicalNotesModuleOptions = {}) {
  const { patientId, filters, autoFetch = true } = options;
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const fetchNotes = useCallback(async (page = 1) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchClinicalNotes(patientId, filters, { page, limit: pagination.limit });
      setNotes(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch clinical notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filters, pagination.limit]);

  useEffect(() => {
    if (autoFetch && patientId) {
      fetchNotes();
    }
  }, [autoFetch, patientId, fetchNotes]);

  return { notes, loading, error, pagination, fetchNotes, setNotes };
}

export function useClinicalNoteDetails(noteId: number | null) {
  const [note, setNote] = useState<ClinicalNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!noteId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchClinicalNoteDetails(noteId);
      setNote(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch clinical note details');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (noteId) fetchDetails();
  }, [noteId, fetchDetails]);

  return { note, loading, error, refetch: fetchDetails };
}

// ============================================
// Clinical Documents Hook
// ============================================

interface UseClinicalDocumentsOptions {
  patientId?: number;
  filters?: MedicalRecordsFilters;
  autoFetch?: boolean;
}

export function useClinicalDocuments(options: UseClinicalDocumentsOptions = {}) {
  const { patientId, filters, autoFetch = true } = options;
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const fetchDocuments = useCallback(async (page = 1) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchClinicalDocuments(patientId, filters, { page, limit: pagination.limit });
      setDocuments(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filters, pagination.limit]);

  useEffect(() => {
    if (autoFetch && patientId) {
      fetchDocuments();
    }
  }, [autoFetch, patientId, fetchDocuments]);

  return { documents, loading, error, pagination, fetchDocuments, setDocuments };
}

// ============================================
// All Records Hook (Combined)
// ============================================

interface UseAllMedicalRecordsOptions {
  patientId?: number;
  filters?: MedicalRecordsFilters;
  autoFetch?: boolean;
}

export function useAllMedicalRecords(options: UseAllMedicalRecordsOptions = {}) {
  const { patientId, filters, autoFetch = true } = options;
  const [records, setRecords] = useState<MedicalRecordListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const fetchRecords = useCallback(async (page = 1) => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchAllMedicalRecords(patientId, filters, { page, limit: pagination.limit });
      setRecords(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch medical records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, filters, pagination.limit]);

  useEffect(() => {
    if (autoFetch && patientId) {
      fetchRecords();
    }
  }, [autoFetch, patientId, fetchRecords]);

  return { records, loading, error, pagination, fetchRecords, setRecords };
}
