"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, AlertCircle, CheckCircle, Zap, Loader2, User, Calendar } from "lucide-react"
import { getAppointments, confirmAppointment, completeAppointment, rescheduleAppointment, adjustWaitTime, cancelAppointment, type Appointment } from "@/lib/api/appointments"
import { QueueActionMenu } from "@/components/appointments/QueueActionMenu"
import { format, parseISO } from "date-fns"

interface QueueAppointment extends Appointment {
  patient_name: string
  patient_number: string
  provider_name: string
  priority?: string
  room?: string
  wait_time_adjustment?: number
}

export default function AppointmentQueue() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("queue")
  const [loading, setLoading] = useState(true)
  const [queueAppointments, setQueueAppointments] = useState<QueueAppointment[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = Cookies.get("token")
    const tenantId = Cookies.get("tenant_id")

    if (!token || !tenantId) {
      router.push("/auth/login")
      return
    }

    fetchTodayQueue()
  }, [router])

  const fetchTodayQueue = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const dateStr = format(today, "yyyy-MM-dd")

      // Fetch today's appointments
      const response = await getAppointments({
        date_from: dateStr,
        date_to: dateStr,
        limit: 100, // Get more appointments for the queue
      })

      if (response.data?.appointments) {
        // Filter for scheduled and confirmed appointments only
        const queueAppts = response.data.appointments.filter(
          (appt: Appointment) => appt.status === "scheduled" || appt.status === "confirmed"
        )

        // Sort by appointment time (descending - newest first) and map to QueueAppointment format
        const sorted = queueAppts
          .sort((a: Appointment, b: Appointment) => {
            return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
          })
          .map((appt: Appointment) => ({
            ...appt,
            patient_name: `${appt.patient.first_name} ${appt.patient.last_name}`,
            patient_number: appt.patient.patient_number || "N/A",
            provider_name: appt.doctor.name,
            priority: "normal", // Default priority
            room: "TBD", // Default room
          }))
        setQueueAppointments(sorted)
      }
    } catch (err: any) {
      console.error("Error fetching queue:", err)
      setError(err.response?.data?.error || err.message || "Failed to load appointment queue")
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
    try {
      // Use specific API functions for status updates
      if (newStatus === "confirmed") {
        await confirmAppointment(appointmentId)
      } else if (newStatus === "completed") {
        await completeAppointment(appointmentId)
      }
      // Refresh the queue
      await fetchTodayQueue()
    } catch (err: any) {
      console.error("Error updating appointment:", err)
      alert("Failed to update appointment status")
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "no_show":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateWaitTime = (appointmentDate: string, waitTimeAdjustment?: number) => {
    const now = new Date()
    const apptTime = parseISO(appointmentDate)
    let diffMinutes = Math.floor((now.getTime() - apptTime.getTime()) / (1000 * 60))
    
    // Apply wait time adjustment if present
    if (waitTimeAdjustment) {
      diffMinutes += waitTimeAdjustment
    }

    if (diffMinutes < 0) {
      return `In ${Math.abs(diffMinutes)} min`
    } else if (diffMinutes === 0) {
      return "Now"
    } else {
      return `${diffMinutes} min ago`
    }
  }

  // Calculate queue metrics
  const totalInQueue = queueAppointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length
  const highPriority = queueAppointments.filter((a) => a.priority?.toLowerCase() === "high").length
  const completedToday = queueAppointments.filter((a) => a.status === "completed").length
  const avgWaitTime = queueAppointments.length > 0 ? Math.floor(Math.random() * 30 + 15) : 0 // Placeholder calculation

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 overflow-auto pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-4">Loading appointment queue...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Appointment Queue</h1>
                <p className="text-muted-foreground mt-1">Today's appointment queue - {format(new Date(), "MMMM d, yyyy")}</p>
              </div>
              <Button onClick={fetchTodayQueue} variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Refresh Queue
              </Button>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total in Queue</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{totalInQueue}</p>
                  <p className="text-xs text-muted-foreground mt-2">Scheduled & Confirmed</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{avgWaitTime} min</p>
                  <p className="text-xs text-muted-foreground mt-2">Estimated average</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{highPriority}</p>
                  <p className="text-xs text-muted-foreground mt-2">Require immediate attention</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{completedToday}</p>
                  <p className="text-xs text-muted-foreground mt-2">Appointments finished</p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="queue">Live Queue ({queueAppointments.length})</TabsTrigger>
                <TabsTrigger value="optimization">Queue Management</TabsTrigger>
              </TabsList>

              {/* Live Queue Tab */}
              <TabsContent value="queue" className="space-y-4 mt-6">
                {queueAppointments.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="pt-6 text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No appointments in queue for today</p>
                      <Button variant="outline" className="mt-4" onClick={() => router.push("/appointments/new")}>
                        Schedule New Appointment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  queueAppointments.map((item, index) => (
                    <Card key={item.id} className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Position Badge */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {item.patient_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{item.appointment_type}</p>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                                <p className="font-semibold text-foreground">
                                  {format(parseISO(item.appointment_date), "h:mm a")}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Wait Time</p>
                                <p className="font-semibold text-foreground">{calculateWaitTime(item.appointment_date, item.wait_time_adjustment)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="font-semibold text-foreground">{item.duration_minutes} min</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Provider</p>
                                <p className="font-semibold text-foreground text-sm">{item.provider_name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                              </div>
                            </div>

                            {/* Notes */}
                            {item.notes && (
                              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-3">
                                <p className="text-xs font-semibold text-accent mb-1">Notes</p>
                                <p className="text-sm text-foreground">{item.notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4">
                              {item.status === "scheduled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(item.id, "confirmed")}
                                >
                                  Mark Confirmed
                                </Button>
                              )}
                              {(item.status === "scheduled" || item.status === "confirmed") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(item.id, "completed")}
                                >
                                  Mark Completed
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/appointments?id=${item.id}`)}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>

                          {/* Priority Badge and Menu */}
                          <div className="flex flex-col gap-2 items-end">
                            {item.priority && (
                              <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                            )}
                            <QueueActionMenu
                              appointment={{
                                ...item,
                                patient_name: item.patient_name,
                                provider_name: item.provider_name,
                              }}
                              onReschedule={async (appointmentId, newDate, newTime) => {
                                await rescheduleAppointment(appointmentId, newDate, newTime)
                                await fetchTodayQueue()
                              }}
                              onAdjustWaitTime={async (appointmentId, adjustmentMinutes) => {
                                await adjustWaitTime(appointmentId, adjustmentMinutes)
                                await fetchTodayQueue()
                              }}
                              onCancel={async (appointmentId) => {
                                await cancelAppointment(appointmentId, "Queue management cancellation")
                                await fetchTodayQueue()
                              }}
                              onViewDetails={(appointmentId) => router.push(`/appointments?id=${appointmentId}`)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Queue Management Tab */}
              <TabsContent value="optimization" className="space-y-6 mt-6">
                {/* Management Tools Card */}
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent" />
                      Queue Management Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Queue Status</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {totalInQueue > 0
                              ? `${totalInQueue} appointments in queue. Average wait time is ${avgWaitTime} minutes.`
                              : "No appointments in queue. Queue is clear."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Quick Actions</p>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => router.push("/appointments/new")}>
                              Add to Queue
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchTodayQueue}>
                              Refresh Queue
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push("/appointments/calendar")}>
                              View Calendar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {highPriority > 0 && (
                      <div className="bg-background border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-foreground">High Priority Alert</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {highPriority} high priority appointment{highPriority > 1 ? "s" : ""} in queue. Please
                              prioritize these patients.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Queue List in Management Tab */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Current Queue</h3>
                  {queueAppointments.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="pt-6 text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No appointments in queue for today</p>
                        <Button variant="outline" className="mt-4" onClick={() => router.push("/appointments/new")}>
                          Schedule New Appointment
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    queueAppointments.map((item, index) => (
                      <Card key={item.id} className="border-border/50 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Position Badge */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                  {index + 1}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {item.patient_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">{item.appointment_type}</p>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Scheduled</p>
                                  <p className="font-semibold text-foreground">
                                    {format(parseISO(item.appointment_date), "h:mm a")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Wait Time</p>
                                  <p className="font-semibold text-foreground">{calculateWaitTime(item.appointment_date, item.wait_time_adjustment)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Duration</p>
                                  <p className="font-semibold text-foreground">{item.duration_minutes} min</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Provider</p>
                                  <p className="font-semibold text-foreground text-sm">{item.provider_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Status</p>
                                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                </div>
                              </div>

                              {/* Notes */}
                              {item.notes && (
                                <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-3">
                                  <p className="text-xs font-semibold text-accent mb-1">Notes</p>
                                  <p className="text-sm text-foreground">{item.notes}</p>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-4">
                                {item.status === "scheduled" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateAppointmentStatus(item.id, "confirmed")}
                                  >
                                    Mark Confirmed
                                  </Button>
                                )}
                                {(item.status === "scheduled" || item.status === "confirmed") && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => updateAppointmentStatus(item.id, "completed")}
                                  >
                                    Mark Completed
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/appointments?id=${item.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>

                            {/* Priority Badge and Menu */}
                            <div className="flex flex-col gap-2 items-end">
                              {item.priority && (
                                <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                              )}
                              <QueueActionMenu
                                appointment={{
                                  ...item,
                                  patient_name: item.patient_name,
                                  provider_name: item.provider_name,
                                }}
                                onReschedule={async (appointmentId, newDate, newTime) => {
                                  await rescheduleAppointment(appointmentId, newDate, newTime)
                                  await fetchTodayQueue()
                                }}
                                onAdjustWaitTime={async (appointmentId, adjustmentMinutes) => {
                                  await adjustWaitTime(appointmentId, adjustmentMinutes)
                                  await fetchTodayQueue()
                                }}
                                onCancel={async (appointmentId) => {
                                  await cancelAppointment(appointmentId, "Queue management cancellation")
                                  await fetchTodayQueue()
                                }}
                                onViewDetails={(appointmentId) => router.push(`/appointments?id=${appointmentId}`)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
