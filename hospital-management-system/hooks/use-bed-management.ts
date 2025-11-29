/**
 * Bed Management Custom Hooks
 * React hooks for bed management functionality
 */

import { useState, useEffect, useCallback } from 'react';
import bedManagementApi, {
  Department,
  DepartmentStats,
  Bed,
  BedAssignment,
  BedTransfer,
  BedOccupancy,
} from '@/lib/api/beds';

// ==========================================
// Department Hooks
// ==========================================

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.departments.getDepartments();
      setDepartments(data.departments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, loading, error, refetch: fetchDepartments };
}

export function useDepartmentStats(departmentId: number | null) {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!departmentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.departments.getDepartmentStats(departmentId);
      setStats(data); // ✅ FIX: Backend returns stats directly, not wrapped
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch department stats');
      console.error('Error fetching department stats:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// ==========================================
// Bed Hooks
// ==========================================

export function useBeds(filters?: {
  department_id?: number;
  bed_type?: string;
  status?: string;
  floor_number?: number;
}) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching beds with filters:', filters);
      const data = await bedManagementApi.beds.getBeds(filters);
      console.log('🔍 Beds API response:', data);
      setBeds(data.beds || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch beds');
      console.error('❌ Error fetching beds:', err);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.department_id,
    filters?.bed_type,
    filters?.status,
    filters?.floor_number
  ]); // ✅ FIX: Use individual properties to avoid object reference issues

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  return { beds, loading, error, pagination, refetch: fetchBeds };
}

export function useBedOccupancy() {
  const [occupancy, setOccupancy] = useState<BedOccupancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOccupancy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.beds.getBedOccupancy();
      setOccupancy(data.occupancy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch occupancy');
      console.error('Error fetching occupancy:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  return { occupancy, loading, error, refetch: fetchOccupancy };
}

export function useAvailableBeds(filters?: {
  department_id?: number;
  bed_type?: string;
}) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.beds.getAvailableBeds(filters);
      setBeds(data.beds);
      setCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available beds');
      console.error('Error fetching available beds:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.department_id, filters?.bed_type]); // ✅ FIX: Use individual properties

  useEffect(() => {
    fetchAvailableBeds();
  }, [fetchAvailableBeds]);

  return { beds, count, loading, error, refetch: fetchAvailableBeds };
}

// ==========================================
// Bed Assignment Hooks
// ==========================================

export function useBedAssignments(filters?: {
  bed_id?: number;
  patient_id?: number;
  status?: string;
}) {
  const [assignments, setAssignments] = useState<BedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.assignments.getAssignments(filters);
      setAssignments(data.assignments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.bed_id, filters?.patient_id, filters?.status]); // ✅ FIX: Use individual properties

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, loading, error, pagination, refetch: fetchAssignments };
}

export function usePatientBedHistory(patientId: number | null) {
  const [history, setHistory] = useState<BedAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.assignments.getPatientHistory(patientId);
      setHistory(data.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient history');
      console.error('Error fetching patient history:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}

// ==========================================
// Bed Transfer Hooks
// ==========================================

export function useBedTransfers(filters?: {
  patient_id?: number;
  status?: string;
}) {
  const [transfers, setTransfers] = useState<BedTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.transfers.getTransfers(filters);
      setTransfers(data.transfers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.patient_id, filters?.status]); // ✅ FIX: Use individual properties

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  return { transfers, loading, error, pagination, refetch: fetchTransfers };
}

export function usePatientTransferHistory(patientId: number | null) {
  const [history, setHistory] = useState<BedTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bedManagementApi.transfers.getPatientTransferHistory(patientId);
      setHistory(data.transfers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transfer history');
      console.error('Error fetching transfer history:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}

// ==========================================
// Action Hooks (for mutations)
// ==========================================

export function useBedActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBed = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.beds.createBed(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBed = async (id: number, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.beds.updateBed(id, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBed = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.beds.deleteBed(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createBed, updateBed, deleteBed, loading, error };
}

export function useAssignmentActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssignment = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.assignments.createAssignment(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const dischargePatient = async (id: number, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.assignments.dischargePatient(id, data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to discharge patient';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createAssignment, dischargePatient, loading, error };
}

export function useTransferActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransfer = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.transfers.createTransfer(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transfer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeTransfer = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.transfers.completeTransfer(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete transfer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelTransfer = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bedManagementApi.transfers.cancelTransfer(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel transfer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createTransfer, completeTransfer, cancelTransfer, loading, error };
}
