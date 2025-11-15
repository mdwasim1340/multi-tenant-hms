import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  DashboardAnalytics, 
  StaffAnalytics,
  ScheduleAnalytics,
  AttendanceAnalytics,
  PerformanceAnalytics,
  PayrollAnalytics,
  CredentialExpiry,
  DepartmentStatistics,
  ApiResponse 
} from '@/lib/types/analytics';

export function useDashboardAnalytics() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<ApiResponse<DashboardAnalytics>>(
        '/api/analytics/dashboard'
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

export function useStaffAnalytics(filters?: {
  department?: string;
  start_date?: string;
  end_date?: string;
}) {
  const [analytics, setAnalytics] = useState<StaffAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [filters?.department, filters?.start_date, filters?.end_date]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.department) params.append('department', filters.department);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await apiClient.get<ApiResponse<StaffAnalytics[]>>(
        `/api/analytics/staff?${params.toString()}`
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff analytics');
      console.error('Error fetching staff analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

export function useScheduleAnalytics(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  const [analytics, setAnalytics] = useState<ScheduleAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [filters?.start_date, filters?.end_date]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await apiClient.get<ApiResponse<ScheduleAnalytics[]>>(
        `/api/analytics/schedules?${params.toString()}`
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch schedule analytics');
      console.error('Error fetching schedule analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

export function useAttendanceAnalytics(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  const [analytics, setAnalytics] = useState<AttendanceAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [filters?.start_date, filters?.end_date]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await apiClient.get<ApiResponse<AttendanceAnalytics[]>>(
        `/api/analytics/attendance?${params.toString()}`
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch attendance analytics');
      console.error('Error fetching attendance analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

export function usePerformanceAnalytics(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [filters?.start_date, filters?.end_date]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await apiClient.get<ApiResponse<PerformanceAnalytics[]>>(
        `/api/analytics/performance?${params.toString()}`
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch performance analytics');
      console.error('Error fetching performance analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

export function usePayrollAnalytics(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  const [analytics, setAnalytics] = useState<PayrollAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [filters?.start_date, filters?.end_date]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await apiClient.get<ApiResponse<PayrollAnalytics[]>>(
        `/api/analytics/payroll?${params.toString()}`
      );
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch payroll analytics');
      console.error('Error fetching payroll analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

export function useCredentialsExpiry(filters?: {
  expiry_status?: string;
  department?: string;
}) {
  const [credentials, setCredentials] = useState<CredentialExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, [filters?.expiry_status, filters?.department]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.expiry_status) params.append('expiry_status', filters.expiry_status);
      if (filters?.department) params.append('department', filters.department);

      const response = await apiClient.get<ApiResponse<CredentialExpiry[]>>(
        `/api/analytics/credentials/expiry?${params.toString()}`
      );
      
      if (response.success) {
        setCredentials(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch credentials');
      console.error('Error fetching credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    credentials,
    loading,
    error,
    refetch: fetchCredentials
  };
}

export function useDepartmentStatistics(department?: string) {
  const [statistics, setStatistics] = useState<DepartmentStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [department]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (department) params.append('department', department);

      const response = await apiClient.get<ApiResponse<DepartmentStatistics[]>>(
        `/api/analytics/departments?${params.toString()}`
      );
      
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch department statistics');
      console.error('Error fetching department statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
}
