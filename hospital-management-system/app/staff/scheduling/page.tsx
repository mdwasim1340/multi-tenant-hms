"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Clock } from "lucide-react"

export default function StaffScheduling() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const weekSchedule = [
    {
      day: "Monday",
      date: "Oct 21",
      shifts: [
        { staff: "Dr. Emily Rodriguez", time: "8 AM - 4 PM", department: "Cardiology", status: "Confirmed" },
        { staff: "Dr. James Wilson", time: "9 AM - 5 PM", department: "Internal Medicine", status: "Confirmed" },
        { staff: "Nurse Lisa Park", time: "3 PM - 11 PM", department: "ICU", status: "Confirmed" },
      ],
    },
    {
      day: "Tuesday",
      date: "Oct 22",
      shifts: [
        { staff: "Dr. Emily Rodriguez", time: "Off", department: "-", status: "Off" },
        { staff: "Dr. James Wilson", time: "8 AM - 4 PM", department: "Internal Medicine", status: "Confirmed" },
        { staff: "Nurse Lisa Park", time: "7 AM - 3 PM", department: "ICU", status: "Confirmed" },
      ],
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
                <h1 className="text-3xl font-bold text-foreground">Staff Scheduling</h1>
                <p className="text-muted-foreground mt-1">Manage staff shifts and schedules</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Shift
              </Button>
            </div>

            <div className="space-y-6">
              {weekSchedule.map((day, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      {day.day} - {day.date}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {day.shifts.map((shift, shiftIdx) => (
                        <div key={shiftIdx} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{shift.staff}</h4>
                            <Badge variant={shift.status === "Off" ? "secondary" : "default"}>{shift.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {shift.time}
                            </div>
                            <div className="text-muted-foreground">{shift.department}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
