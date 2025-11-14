/**
 * usePatients Hook
 * 
 * Custom hook for fetching and managing patient list with search, filters, and pagination.
 * Implements debounced search and automatic refetching on filter changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPatients } from '@/lib/patients';
import {
  Patient,
  PatientSearchParams,
  PaginationInfo,
} from '@/types/patient';

/**
 * Options for usePatients hook
 */
export interface UsePatientsOptions extends PatientSearchParams {
  // Additional options can be added here
  autoFetch?: boolean; // Whether to fetch automatically on mount (default: true)
}

/**
 * Return type for usePatients hook
 */
export interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Partial<PatientSearchParams>) => void;
  clearFilters: () => void;
}

/**
 * Custom hook for managing patient list
 * 
 * @param options - Search and filter options
 * @returns Patient list state and control functions
 * 
 * @example
 * const { patients, loading, error, setSearch, setPage } = usePatients({
 *   page: 1,
 *   limit: 25,
 *   status: 'active'
 * });
 */
export function usePatients(
  options: UsePatientsOptions = {}
): UsePatientsReturn {
  const { autoFetch = true, ...initialParams } = options;

  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [params, setParams] = useState<PatientSearchParams>({
    page: 1,
    limit: 25,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialParams,
  });

  // Refs for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch patients from API
   */
  const fetchPatients = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getPatients(params);
      setPatients(response.data.patients);
      setPagination(response.data.pagination);
    } catch (err) {
      const error = err as Error;
      // Don't set error if request was aborted
      if (error.name !== 'AbortError') {
        setError(error);
        console.error('Error fetching patients:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  /**
   * Refetch patients manually
   */
  const refetch = useCallback(async () => {
    await fetchPatients();
  }, [fetchPatients]);

  /**
   * Set current page
   */
  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Set search query with debouncing
   */
  const setSearch = useCallback((search: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      setParams((prev) => ({
        ...prev,
        search: search || undefined,
        page: 1, // Reset to first page on search
      }));
    }, 300);
  }, []);

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback((filters: Partial<PatientSearchParams>) => {
    setParams((prev) => ({
      ...prev,
      ...filters,
      page: 1, // Reset to first page on filter change
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setParams({
      page: 1,
      limit: params.limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  }, [params.limit]);

  /**
   * Fetch patients when params change
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPatients();
    }

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPatients, autoFetch]);

  return {
    patients,
    loading,
    error,
    pagination,
    refetch,
    setPage,
    setSearch,
    setFilters,
    clearFilters,
  };
}
