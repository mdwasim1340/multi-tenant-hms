import { useState, useEffect, useCallback } from 'react';
import { getStaff, createStaff as createStaffApi, updateStaff as updateStaffApi, deleteStaff as deleteStaffApi } from '@/lib/staff';
import { StaffProfile } from '@/lib/types/staff';

interface UseStaffFilters {
  department?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  include_unverified?: boolean;
  verification_status?: string;
}

export function useStaff(filters?: UseStaffFilters) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getStaff({
        department: filters?.department,
        status: filters?.status,
        search: filters?.search,
        limit: filters?.limit,
        offset: filters?.offset,
        include_unverified: filters?.include_unverified,
        verification_status: filters?.verification_status,
      });
      
      if (response.success) {
        // Set staff even if empty array - this is not an error
        setStaff(response.data || []);
      }
    } catch (err: any) {
      // Only set error for actual errors, not empty results
      const errorMessage = err.message || 'Failed to fetch staff';
      setError(errorMessage);
      console.error('❌ Error fetching staff:', err);
      // Set empty array on error so UI can show empty state
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.department, filters?.status, filters?.search, filters?.limit, filters?.offset, filters?.include_unverified, filters?.verification_status]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = async (data: Partial<StaffProfile>) => {
    try {
      const result = await createStaffApi(data);
      await fetchStaff();
      return result;
    } catch (err: any) {
      throw err;
    }
  };

  const updateStaff = async (id: number, data: Partial<StaffProfile>) => {
    try {
      const result = await updateStaffApi(id, data);
      await fetchStaff();
      return result;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteStaff = async (id: number) => {
    try {
      await deleteStaffApi(id);
      await fetchStaff();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff
  };
}

export function useStaffById(id: number) {
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { getStaffById } = await import('@/lib/staff');
      const result = await getStaffById(id);
      setStaff(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch staff');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id, fetchStaff]);

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff
  };
}
