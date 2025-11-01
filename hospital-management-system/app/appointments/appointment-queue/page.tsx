"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, AlertCircle, CheckCircle, Zap, ArrowUp, ArrowDown } from "lucide-react"

export default function AppointmentQueue() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("queue")

  const queueItems = [
    {
      id: "Q001",
      position: 1,
      patient: "Sarah Johnson",
      type: "Cardiology Consultation",
      scheduledTime: "09:00 AM",
      waitTime: "5 min",
      priority: "High",
      status: "In Progress",
      room: "301",
      provider: "Dr. Emily Rodriguez",
      aiPriority: "Urgent - Early intervention needed",
    },
    {
      id: "Q002",
      position: 2,
      patient: "Michael Chen",
      type: "Follow-up Checkup",
      scheduledTime: "09:30 AM",
      waitTime: "25 min",
      priority: "Medium",
      status: "Waiting",
      room: "205",
      provider: "Dr. James Wilson",
      aiPriority: "Routine - Standard pathway",
    },
    {
      id: "Q003",
      position: 3,
      patient: "Emma Williams",
      type: "Annual Physical",
      scheduledTime: "10:00 AM",
      waitTime: "55 min",
      priority: "Low",
      status: "Waiting",
      room: "TBD",
      provider: "Dr. Lisa Park",
      aiPriority: "Preventive - Can be rescheduled",
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
                <p className="text-muted-foreground mt-1">Real-time queue management with AI prioritization</p>
              </div>
            </div>

            {/* Queue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total in Queue</p>
                  <p className="text-2xl font-bold text-foreground mt-2">12</p>
                  <p className="text-xs text-muted-foreground mt-2">+3 from last hour</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-foreground mt-2">28 min</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">-5 min from yesterday</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">3</p>
                  <p className="text-xs text-muted-foreground mt-2">Require immediate attention</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">24</p>
                  <p className="text-xs text-muted-foreground mt-2">On schedule</p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="queue">Live Queue</TabsTrigger>
                <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
              </TabsList>

              {/* Live Queue Tab */}
              <TabsContent value="queue" className="space-y-4 mt-6">
                {queueItems.map((item) => (
                  <Card key={item.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Position Badge */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {item.position}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{item.patient}</h3>
                              <p className="text-sm text-muted-foreground">{item.type}</p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Scheduled</p>
                              <p className="font-semibold text-foreground">{item.scheduledTime}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Wait Time</p>
                              <p className="font-semibold text-foreground">{item.waitTime}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Room</p>
                              <p className="font-semibold text-foreground">{item.room}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Provider</p>
                              <p className="font-semibold text-foreground text-sm">{item.provider.split(" ")[1]}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge variant="outline" className="mt-1">
                                {item.status}
                              </Badge>
                            </div>
                          </div>

                          {/* AI Insight */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Prioritization</p>
                                <p className="text-sm text-foreground">{item.aiPriority}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                          <Button variant="outline" size="sm">
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* AI Optimization Tab */}
              <TabsContent value="optimization" className="space-y-6 mt-6">
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accent" />
                      Queue Optimization Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Reorder Queue</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Move position 3 to position 2 - Patient can be seen 20 minutes earlier with no impact on
                            others
                          </p>
                          <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                            Apply Recommendation
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Optimal Scheduling</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Current queue is optimally arranged. Average wait time is 28 minutes (below target of 35
                            min)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">Resource Allocation</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Recommend opening Room 302 to reduce wait times by 15 minutes
                          </p>
                          <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                            Request Resource
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
