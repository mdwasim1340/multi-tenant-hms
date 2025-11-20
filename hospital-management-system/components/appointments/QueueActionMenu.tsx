"use client"

import { useState } from "react"
import { MoreVertical, Calendar, Clock, AlertCircle, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, parseISO } from "date-fns"
import type { Appointment } from "@/lib/api/appointments"

interface QueueActionMenuProps {
  appointment: Appointment & {
    patient_name: string
    provider_name: string
  }
  onReschedule?: (appointmentId: number, newDate: string, newTime: string) => Promise<void>
  onAdjustWaitTime?: (appointmentId: number, newWaitMinutes: number) => Promise<void>
  onCancel?: (appointmentId: number) => Promise<void>
  onViewDetails?: (appointmentId: number) => void
}

export function QueueActionMenu({
  appointment,
  onReschedule,
  onAdjustWaitTime,
  onCancel,
  onViewDetails,
}: QueueActionMenuProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [adjustWaitOpen, setAdjustWaitOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState<string>("")
  const [rescheduleTime, setRescheduleTime] = useState<string>("")

  // Adjust wait time state
  const [waitAdjustment, setWaitAdjustment] = useState<string>("0")
  const [waitAdjustmentType, setWaitAdjustmentType] = useState<"add" | "subtract">("add")

  // Cancel reason state
  const [cancelReason, setCancelReason] = useState<string>("")

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both date and time")
      return
    }

    try {
      setLoading(true)
      if (onReschedule) {
        await onReschedule(appointment.id, rescheduleDate, rescheduleTime)
        setRescheduleOpen(false)
        setRescheduleDate("")
        setRescheduleTime("")
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
      alert("Failed to reschedule appointment")
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustWaitTime = async () => {
    if (!waitAdjustment || isNaN(Number(waitAdjustment))) {
      alert("Please enter a valid number of minutes")
      return
    }

    try {
      setLoading(true)
      const adjustment = Number(waitAdjustment)
      const finalAdjustment = waitAdjustmentType === "add" ? adjustment : -adjustment

      if (onAdjustWaitTime) {
        await onAdjustWaitTime(appointment.id, finalAdjustment)
        setAdjustWaitOpen(false)
        setWaitAdjustment("0")
        setWaitAdjustmentType("add")
      }
    } catch (error) {
      console.error("Error adjusting wait time:", error)
      alert("Failed to adjust wait time")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setLoading(true)
      if (onCancel) {
        await onCancel(appointment.id)
        setCancelOpen(false)
        setCancelReason("")
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      alert("Failed to cancel appointment")
    } finally {
      setLoading(false)
    }
  }

  const currentDate = parseISO(appointment.appointment_date)
  const tomorrow = addDays(new Date(), 1)
  const nextDay = addDays(new Date(), 2)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => onViewDetails?.(appointment.id)}>
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Queue Management</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Reschedule</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setAdjustWaitOpen(true)}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Adjust Wait Time</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Cancel Appointment</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Reschedule {appointment.patient_name}'s appointment to a different date and time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Select value={rescheduleDate} onValueChange={setRescheduleDate}>
                <SelectTrigger id="reschedule-date">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={format(tomorrow, "yyyy-MM-dd")}>
                    Tomorrow - {format(tomorrow, "MMM d, yyyy")}
                  </SelectItem>
                  <SelectItem value={format(nextDay, "yyyy-MM-dd")}>
                    {format(nextDay, "EEEE")} - {format(nextDay, "MMM d, yyyy")}
                  </SelectItem>
                  <SelectItem value={format(addDays(new Date(), 3), "yyyy-MM-dd")}>
                    {format(addDays(new Date(), 3), "EEEE")} - {format(addDays(new Date(), 3), "MMM d, yyyy")}
                  </SelectItem>
                  <SelectItem value={format(addDays(new Date(), 7), "yyyy-MM-dd")}>
                    Next Week - {format(addDays(new Date(), 7), "MMM d, yyyy")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule-time">New Time</Label>
              <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                <SelectTrigger id="reschedule-time">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="09:30">9:30 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="10:30">10:30 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="11:30">11:30 AM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="14:30">2:30 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="15:30">3:30 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="16:30">4:30 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Current appointment: {format(currentDate, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={loading || !rescheduleDate || !rescheduleTime}>
              {loading ? "Rescheduling..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Wait Time Dialog */}
      <Dialog open={adjustWaitOpen} onOpenChange={setAdjustWaitOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Wait Time</DialogTitle>
            <DialogDescription>
              Increase or decrease the waiting time for {appointment.patient_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wait-adjustment-type">Adjustment Type</Label>
              <Select value={waitAdjustmentType} onValueChange={(value: any) => setWaitAdjustmentType(value)}>
                <SelectTrigger id="wait-adjustment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Increase Wait Time</SelectItem>
                  <SelectItem value="subtract">Decrease Wait Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wait-adjustment-minutes">Minutes</Label>
              <Input
                id="wait-adjustment-minutes"
                type="number"
                min="0"
                max="120"
                step="5"
                value={waitAdjustment}
                onChange={(e) => setWaitAdjustment(e.target.value)}
                placeholder="Enter number of minutes"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {waitAdjustmentType === "add"
                  ? `Wait time will be increased by ${waitAdjustment || 0} minutes`
                  : `Wait time will be decreased by ${waitAdjustment || 0} minutes`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustWaitOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAdjustWaitTime} disabled={loading || !waitAdjustment || waitAdjustment === "0"}>
              {loading ? "Adjusting..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {appointment.patient_name}'s appointment?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for Cancellation (Optional)</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger id="cancel-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient_request">Patient Request</SelectItem>
                  <SelectItem value="doctor_unavailable">Doctor Unavailable</SelectItem>
                  <SelectItem value="facility_issue">Facility Issue</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-900 dark:text-red-200">
                This action cannot be undone. The appointment will be marked as cancelled.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={loading}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
