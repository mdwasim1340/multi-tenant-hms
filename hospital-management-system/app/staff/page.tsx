"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users2, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, Award } from "lucide-react"

export default function StaffManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("staff")

  const staff = [
    {
      id: "S001",
      name: "Dr. Emily Rodriguez",
      role: "Cardiologist",
      department: "Cardiology",
      status: "On Duty",
      certifications: ["MD", "Board Certified"],
      performance: "Excellent",
      aiInsight: "High patient satisfaction (4.8/5) - Consider for mentorship role",
    },
    {
      id: "S002",
      name: "Dr. James Wilson",
      role: "General Practitioner",
      department: "Internal Medicine",
      status: "On Duty",
      certifications: ["MD", "Board Certified"],
      performance: "Good",
      aiInsight: "Workload optimization recommended - Consider schedule adjustment",
    },
    {
      id: "S003",
      name: "Nurse Lisa Park",
      role: "RN - ICU",
      department: "Intensive Care",
      status: "Off Duty",
      certifications: ["RN", "CCRN"],
      performance: "Excellent",
      aiInsight: "Burnout risk detected - Recommend additional support",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
                <p className="text-muted-foreground mt-1">Scheduling, performance, and credentials</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Users2 className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Staff</p>
                      <p className="text-2xl font-bold text-foreground">156</p>
                    </div>
                    <Users2 className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">On Duty Today</p>
                      <p className="text-2xl font-bold text-green-600">124</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Burnout Risk</p>
                      <p className="text-2xl font-bold text-red-600">8</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Certifications Due</p>
                      <p className="text-2xl font-bold text-yellow-600">12</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="staff">Staff Directory</TabsTrigger>
                <TabsTrigger value="schedule">Scheduling</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Staff Directory Tab */}
              <TabsContent value="staff" className="space-y-4">
                {staff.map((member) => (
                  <Card key={member.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{member.name}</h3>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Department</p>
                              <p className="font-semibold text-foreground">{member.department}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge variant="outline" className="mt-1">
                                {member.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Performance</p>
                              <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                                {member.performance}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Certifications</p>
                              <div className="flex gap-1 mt-1">
                                {member.certifications.map((cert) => (
                                  <Badge key={cert} variant="secondary" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* AI Insight */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Insight</p>
                                <p className="text-sm text-foreground">{member.aiInsight}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Scheduling Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      Weekly Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                        <div key={day} className="border border-border rounded-lg p-4">
                          <p className="font-semibold text-foreground mb-3">{day}</p>
                          <div className="space-y-2 text-sm">
                            <div className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 rounded p-2">
                              <p className="font-semibold">8 AM - 4 PM</p>
                              <p className="text-xs">Dr. Rodriguez</p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded p-2">
                              <p className="font-semibold">9 AM - 5 PM</p>
                              <p className="text-xs">Dr. Wilson</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent" />
                        Top Performers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Dr. Emily Rodriguez</span>
                        <span className="text-sm font-bold text-accent">4.8/5.0</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Nurse Lisa Park</span>
                        <span className="text-sm font-bold text-accent">4.7/5.0</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        Burnout Risk
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ High Risk Staff</p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          8 staff members showing burnout indicators - Recommend intervention
                        </p>
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
