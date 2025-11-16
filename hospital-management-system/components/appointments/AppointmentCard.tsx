/**
 * Team Alpha - Appointment Card Component
 * Displays individual appointment in a card format
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Appointment } from '@/lib/api/appointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/utils/datetime';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AppointmentDetails } from './AppointmentDetails';
import { useToast } from '@/hooks/use-toast';

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdate: () => void;
}

export function AppointmentCard({ appointment, onUpdate }: AppointmentCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Use utility functions for consistent timezone handling
  const formatDate = (dateString: string) => {
    try {
      return formatDateForDisplay(dateString);
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatTimeForDisplay(dateString);
    } catch {
      return dateString;
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  const handleReschedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to new appointment page with pre-filled data
    router.push(`/appointments/new?reschedule=${appointment.id}`);
  };

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  const handleCancelAppointment = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Show cancel dialog directly
    setShowCancelDialog(true);
  };

  return (
    <>
      <div
        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-card"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start justify-between">
          {/* Left side - Main info */}
          <div className="flex-1 space-y-3">
            {/* Patient Name & Status */}
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">
                {appointment.patient.first_name} {appointment.patient.last_name}
              </h3>
              <Badge className={getStatusColor(appointment.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(appointment.status)}
                  {appointment.status.replace('_', ' ')}
                </span>
              </Badge>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Date */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(appointment.appointment_date)}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(appointment.appointment_date)} ({appointment.duration_minutes} min)
                </span>
              </div>

              {/* Doctor */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                <span>{appointment.doctor.name}</span>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="capitalize">{appointment.appointment_type}</span>
              </div>
            </div>

            {/* Patient Contact */}
            {(appointment.patient.email || appointment.patient.phone) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {appointment.patient.email && (
                  <span>{appointment.patient.email}</span>
                )}
                {appointment.patient.phone && (
                  <span>{appointment.patient.phone}</span>
                )}
              </div>
            )}

            {/* Notes Preview */}
            {appointment.notes && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                <span className="font-medium">Notes:</span> {appointment.notes}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}>
                View Details
              </DropdownMenuItem>
              {appointment.status === 'scheduled' && (
                <>
                  <DropdownMenuItem onClick={handleConfirm}>
                    Confirm
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReschedule}>
                    Reschedule
                  </DropdownMenuItem>
                </>
              )}
              {appointment.status === 'confirmed' && (
                <DropdownMenuItem onClick={handleMarkComplete}>
                  Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleCancelAppointment}
                className="text-destructive"
              >
                Cancel Appointment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <AppointmentDetails
          appointmentId={appointment.id}
          open={showDetails}
          onClose={() => setShowDetails(false)}
          onUpdate={() => {
            onUpdate();
            setShowDetails(false);
          }}
        />
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <AppointmentDetails
          appointmentId={appointment.id}
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onUpdate={() => {
            onUpdate();
            setShowCancelDialog(false);
          }}
          showCancelDialog={true}
        />
      )}
    </>
  );
}
