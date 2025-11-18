/**
 * Team Alpha - Appointment Details Modal
 * Displays full appointment details with actions
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getAppointmentById,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  markNoShow,
  type Appointment,
} from '@/lib/api/appointments';
import { formatDateForDisplay, formatTimeForDisplay, formatDateTimeForDisplay } from '@/lib/utils/datetime';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppointmentDetailsProps {
  appointmentId: number;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  showCancelDialog?: boolean;
}

export function AppointmentDetails({
  appointmentId,
  open,
  onClose,
  onUpdate,
  showCancelDialog: initialShowCancelDialog = false,
}: AppointmentDetailsProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(initialShowCancelDialog);
  const [cancellationReason, setCancellationReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAppointment();
    }
  }, [open, appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentById(appointmentId);
      setAppointment(response.data.appointment);
    } catch (error: any) {
      console.error('Error loading appointment:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load appointment details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);
      // Use confirmAppointment API to change status to confirmed
      await confirmAppointment(appointment.id);
      toast({
        title: 'Success',
        description: 'Appointment confirmed successfully',
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to confirm appointment',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);
      await completeAppointment(appointment.id);
      toast({
        title: 'Success',
        description: 'Appointment marked as complete',
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to complete appointment',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);
      await markNoShow(appointment.id);
      toast({
        title: 'Success',
        description: 'Appointment marked as no-show',
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to mark as no-show',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !cancellationReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a cancellation reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      await cancelAppointment(appointment.id, cancellationReason);
      toast({
        title: 'Success',
        description: 'Appointment cancelled successfully',
      });
      setShowCancelDialog(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to cancel appointment',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!appointment) {
    return null;
  }

  if (showCancelDialog) {
    return (
      <Dialog open={showCancelDialog} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowCancelDialog(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              {!cancellationReason.trim() && (
                <p className="text-xs text-destructive">Cancellation reason is required</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancellationReason('');
              }}
              disabled={actionLoading}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading || !cancellationReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Appointment Details</DialogTitle>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span>{' '}
                {appointment.patient.first_name} {appointment.patient.last_name}
              </div>
              {appointment.patient.patient_number && (
                <div>
                  <span className="font-medium">Patient #:</span>{' '}
                  {appointment.patient.patient_number}
                </div>
              )}
              {appointment.patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {appointment.patient.email}
                </div>
              )}
              {appointment.patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {appointment.patient.phone}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Appointment Information */}
          <div>
            <h3 className="font-semibold mb-3">Appointment Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Date</div>
                  <div>{formatDateForDisplay(appointment.appointment_date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Time</div>
                  <div>
                    {formatTimeForDisplay(appointment.appointment_date)} (
                    {appointment.duration_minutes} min)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Doctor</div>
                  <div>{appointment.doctor.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Type</div>
                  <div className="capitalize">{appointment.appointment_type}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{appointment.notes}</p>
              </div>
            </>
          )}

          {/* Cancellation Reason */}
          {appointment.cancellation_reason && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Cancellation Reason</h3>
                <p className="text-sm text-muted-foreground">{appointment.cancellation_reason}</p>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Created: {formatDateTimeForDisplay(appointment.created_at)}</div>
            <div>Updated: {formatDateTimeForDisplay(appointment.updated_at)}</div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {appointment.status === 'scheduled' && (
            <>
              <Button onClick={handleConfirm} disabled={actionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <Button onClick={handleComplete} disabled={actionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
              <Button
                variant="outline"
                onClick={handleNoShow}
                disabled={actionLoading}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Mark No-Show
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
