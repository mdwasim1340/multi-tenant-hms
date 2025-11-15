/**
 * Team Alpha - Appointment List Component
 * Displays paginated list of appointments with filters
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getAppointments, type Appointment, type AppointmentFilters } from '@/lib/api/appointments';
import { AppointmentCard } from './AppointmentCard';
import { AppointmentFilters as Filters } from './AppointmentFilters';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  });

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments(filters);
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleAppointmentUpdate = () => {
    // Reload appointments after an update
    loadAppointments();
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <h3 className="font-semibold text-destructive">Error Loading Appointments</h3>
        <p className="text-sm text-destructive/80 mt-1">{error}</p>
        <Button
          onClick={loadAppointments}
          variant="outline"
          size="sm"
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Filters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={() => setFilters({ page: 1, limit: 10 })}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {appointments.length} of {pagination.total} appointments
        </div>
        <Button
          onClick={loadAppointments}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {/* Appointment List */}
      {appointments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No appointments found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or create a new appointment
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onUpdate={handleAppointmentUpdate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.has_prev || loading}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.has_next || loading}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
