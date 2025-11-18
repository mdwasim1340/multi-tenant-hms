"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, AlertCircle, Zap } from "lucide-react"
import { AppointmentList } from "@/components/appointments/AppointmentList"
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar"
import { Appointment } from "@/lib/api/appointments"

export default function Appointments() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")
  const [refreshKey, setRefreshKey] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for success parameter and show success message
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccess(true)
      // Clear the URL parameter
      router.replace('/appointments', { scroll: false })
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams, router])

  // Refresh data when component mounts (e.g., returning from appointment creation)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.id}`)
  }

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    router.push(`/appointments/new?date=${dateStr}`)
  }

  const handleNewAppointment = () => {
    router.push('/appointments/new')
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 text-green-600">✅</div>
                  <div>
                    <p className="font-medium text-green-900">Appointment Created Successfully!</p>
                    <p className="text-sm text-green-800 mt-1">
                      The appointment has been scheduled and the patient will be notified.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="ml-auto text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Appointment Scheduling</h1>
                <p className="text-muted-foreground mt-1">AI-powered scheduling and prioritization</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => router.push('/patient-registration')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Register New Patient
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleNewAppointment}>
                  <Calendar className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="list">Appointment List</TabsTrigger>
                <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              </TabsList>

              {/* Calendar View Tab */}
              <TabsContent value="calendar" className="space-y-6">
                <AppointmentCalendar
                  key={`calendar-${refreshKey}`}
                  onAppointmentClick={handleAppointmentClick}
                  onDateSelect={handleDateSelect}
                  height="calc(100vh - 350px)"
                />
              </TabsContent>

              {/* Appointment List Tab */}
              <TabsContent value="list" className="space-y-4">
                <AppointmentList key={`list-${refreshKey}`} />
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="ai-insights" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Scheduling Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Recommended Actions
                        </p>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <li>• Move 2 PM appointment to 1:30 PM for optimal provider efficiency</li>
                          <li>• Schedule preventive care during low-demand hours</li>
                          <li>• Allocate additional resources for high-priority cases</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        No-Show Predictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">High Risk Patients</span>
                        <span className="text-lg font-bold text-red-600">3</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Recommended Reminders</span>
                        <span className="text-lg font-bold text-accent">5</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Avg No-Show Rate</span>
                        <span className="text-lg font-bold text-yellow-600">12%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

