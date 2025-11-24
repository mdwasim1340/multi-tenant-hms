/**
 * Custom hooks for bed management operations
 */

import { useState, useEffect, useCallback } from 'react';
import { BedManagementAPI, Bed, DepartmentStats, Transfer, Discharge, BedHistory } from '@/lib/api/bed-management';
import { toast } from 'sonner';

/**
 * Hook for managing department beds
 */
export function useDepartmentBeds(departmentName: string) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const fetchBeds = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    bedType?: string;
    floor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getDepartmentBeds(departmentName, params);
      
      setBeds(response.beds || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch beds');
      toast.error('Failed to load beds');
    } finally {
      setLoading(false);
    }
  }, [departmentName]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  return {
    beds,
    loading,
    error,
    pagination,
    refetch: fetchBeds
  };
}

/**
 * Hook for department statistics
 */
export function useDepartmentStats(departmentName: string) {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getDepartmentStats(departmentName);
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch department stats');
      toast.error('Failed to load department statistics');
    } finally {
      setLoading(false);
    }
  }, [departmentName]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

/**
 * Hook for bed history
 */
export function useBedHistory(bedId: number | null) {
  const [history, setHistory] = useState<BedHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (limit?: number) => {
    if (!bedId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getBedHistory(bedId, limit);
      setHistory(response.history || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bed history');
      toast.error('Failed to load bed history');
    } finally {
      setLoading(false);
    }
  }, [bedId]);

  useEffect(() => {
    if (bedId) {
      fetchHistory();
    }
  }, [fetchHistory, bedId]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
}

/**
 * Hook for transfer operations
 */
export function useTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async (params?: {
    patientId?: number;
    bedId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getTransfers(params);
      setTransfers(response.transfers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transfers');
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransfer = useCallback(async (transferData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const transfer = await BedManagementAPI.createTransfer(transferData);
      toast.success('Transfer created successfully');
      
      // Refresh transfers list
      await fetchTransfers();
      
      return transfer;
    } catch (err: any) {
      setError(err.message || 'Failed to create transfer');
      toast.error('Failed to create transfer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTransfers]);

  const executeTransfer = useCallback(async (transferId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const transfer = await BedManagementAPI.executeTransfer(transferId);
      toast.success('Transfer executed successfully');
      
      // Refresh transfers list
      await fetchTransfers();
      
      return transfer;
    } catch (err: any) {
      setError(err.message || 'Failed to execute transfer');
      toast.error('Failed to execute transfer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTransfers]);

  return {
    transfers,
    loading,
    error,
    fetchTransfers,
    createTransfer,
    executeTransfer
  };
}

/**
 * Hook for discharge operations
 */
export function useDischarges() {
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDischarges = useCallback(async (params?: {
    patientId?: number;
    bedId?: number;
    dischargeType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getDischarges(params);
      setDischarges(response.discharges || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch discharges');
      toast.error('Failed to load discharges');
    } finally {
      setLoading(false);
    }
  }, []);

  const dischargePatient = useCallback(async (dischargeData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const discharge = await BedManagementAPI.dischargePatient(dischargeData);
      toast.success('Patient discharged successfully');
      
      // Refresh discharges list
      await fetchDischarges();
      
      return discharge;
    } catch (err: any) {
      setError(err.message || 'Failed to discharge patient');
      toast.error('Failed to discharge patient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDischarges]);

  return {
    discharges,
    loading,
    error,
    fetchDischarges,
    dischargePatient
  };
}

/**
 * Hook for available beds
 */
export function useAvailableBeds() {
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableBeds = useCallback(async (params?: {
    departmentId?: number;
    bedType?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getAvailableBeds(params);
      setAvailableBeds(response.beds || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch available beds');
      toast.error('Failed to load available beds');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    availableBeds,
    loading,
    error,
    fetchAvailableBeds
  };
}

/**
 * Hook for bed occupancy statistics
 */
export function useBedOccupancy() {
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOccupancy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await BedManagementAPI.getBedOccupancy();
      setOccupancy(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bed occupancy');
      toast.error('Failed to load bed occupancy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  return {
    occupancy,
    loading,
    error,
    refetch: fetchOccupancy
  };
}