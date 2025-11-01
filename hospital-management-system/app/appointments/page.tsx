"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, MapPin, AlertCircle, Zap, CheckCircle, XCircle, ChevronRight } from "lucide-react"

export default function Appointments() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")

  const appointments = [
    {
      id: "APT001",
      patient: "Sarah Johnson",
      provider: "Dr. Emily Rodriguez",
      type: "Cardiology Consultation",
      date: "2024-10-25",
      time: "09:00 AM",
      status: "Confirmed",
      priority: "High",
      room: "301",
      aiPriority: "Urgent - Patient flagged for early intervention",
      noShowRisk: "Low",
    },
    {
      id: "APT002",
      patient: "Michael Chen",
      provider: "Dr. James Wilson",
      type: "Follow-up Checkup",
      date: "2024-10-25",
      time: "10:30 AM",
      status: "Confirmed",
      priority: "Medium",
      room: "205",
      aiPriority: "Routine - Standard care pathway",
      noShowRisk: "Very Low",
    },
    {
      id: "APT003",
      patient: "Emma Williams",
      provider: "Dr. Lisa Park",
      type: "Annual Physical",
      date: "2024-10-25",
      time: "02:00 PM",
      status: "Pending",
      priority: "Low",
      room: "TBD",
      aiPriority: "Preventive - Schedule optimization recommended",
      noShowRisk: "Medium",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "Cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
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
                <h1 className="text-3xl font-bold text-foreground">Appointment Scheduling</h1>
                <p className="text-muted-foreground mt-1">AI-powered scheduling and prioritization</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Calendar className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="list">Appointment List</TabsTrigger>
                <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              </TabsList>

              {/* Calendar View Tab */}
              <TabsContent value="calendar" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>October 2024 - Week View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {["Mon 21", "Tue 22", "Wed 23", "Thu 24", "Fri 25"].map((day) => (
                        <div key={day} className="border border-border rounded-lg p-4">
                          <p className="font-semibold text-foreground mb-4">{day}</p>
                          <div className="space-y-2">
                            {day === "Thu 24" && (
                              <>
                                <div className="bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 rounded p-2 text-xs">
                                  <p className="font-semibold text-blue-900 dark:text-blue-100">09:00 AM</p>
                                  <p className="text-blue-800 dark:text-blue-200">Cardiology</p>
                                </div>
                                <div className="bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded p-2 text-xs">
                                  <p className="font-semibold text-green-900 dark:text-green-100">10:30 AM</p>
                                  <p className="text-green-800 dark:text-green-200">Follow-up</p>
                                </div>
                              </>
                            )}
                            {day === "Fri 25" && (
                              <div className="bg-yellow-100 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-xs">
                                <p className="font-semibold text-yellow-900 dark:text-yellow-100">02:00 PM</p>
                                <p className="text-yellow-800 dark:text-yellow-200">Physical</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appointment List Tab */}
              <TabsContent value="list" className="space-y-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="hover:shadow-md transition-shadow border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{apt.patient}</h3>
                              <p className="text-sm text-muted-foreground">{apt.type}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{apt.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{apt.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">Room {apt.room}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Provider:</span>
                              <span className="text-sm font-medium text-foreground">{apt.provider.split(" ")[1]}</span>
                            </div>
                          </div>

                          {/* AI Insight */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Prioritization</p>
                                <p className="text-sm text-foreground">{apt.aiPriority}</p>
                                <p className="text-xs text-muted-foreground mt-1">No-show risk: {apt.noShowRisk}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className={getPriorityColor(apt.priority)}>{apt.priority}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getStatusIcon(apt.status)}
                              {apt.status}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
