import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { StaffProfile, ApiResponse } from '@/lib/types/staff';

interface UseStaffFilters {
  department?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useStaff(filters?: UseStaffFilters) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [filters?.department, filters?.status, filters?.search]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await apiClient.get<ApiResponse<StaffProfile[]>>(
        `/api/staff?${params.toString()}`
      );
      
      if (response.success) {
        setStaff(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (data: Partial<StaffProfile>) => {
    try {
      const response = await apiClient.post<ApiResponse<StaffProfile>>(
        '/api/staff',
        data
      );
      if (response.success) {
        await fetchStaff();
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to create staff');
    }
  };

  const updateStaff = async (id: number, data: Partial<StaffProfile>) => {
    try {
      const response = await apiClient.put<ApiResponse<StaffProfile>>(
        `/api/staff/${id}`,
        data
      );
      if (response.success) {
        await fetchStaff();
        return response.data;
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to update staff');
    }
  };

  const deleteStaff = async (id: number) => {
    try {
      await apiClient.delete(`/api/staff/${id}`);
      await fetchStaff();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to delete staff');
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

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<ApiResponse<StaffProfile>>(
        `/api/staff/${id}`
      );
      
      if (response.success) {
        setStaff(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff
  };
}
