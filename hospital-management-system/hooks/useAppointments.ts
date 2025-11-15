/**
 * Team Alpha - useAppointments Hook
 * Custom hook for fetching and managing appointments
 */

import { useState, useEffect, useCallback } from 'react';
import { getAppointments, Appointment, AppointmentFilters } from '@/lib/api/appointments';

interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null;
}

export function useAppointments(filters: AppointmentFilters = {}): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseAppointmentsResult['pagination']>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAppointments(filters);

      if (response.success) {
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    pagination,
  };
}

/**
 * Hook for fetching appointments within a date range (for calendar)
 */
export function useAppointmentsCalendar(dateFrom: string, dateTo: string, doctorId?: number) {
  return useAppointments({
    date_from: dateFrom,
    date_to: dateTo,
    doctor_id: doctorId,
    limit: 1000, // Get all appointments in range
  });
}
