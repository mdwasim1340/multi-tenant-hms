"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowRightLeft, CheckCircle, Clock } from "lucide-react"

export default function PatientTransfers() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const transfers = [
    {
      id: "T001",
      patient: "Sarah Johnson",
      fromDept: "Emergency Room",
      toDept: "Cardiology Ward",
      date: "2024-10-20",
      time: "14:30",
      status: "Completed",
      reason: "Acute chest pain - Requires cardiology care",
    },
    {
      id: "T002",
      patient: "Michael Chen",
      fromDept: "ICU",
      toDept: "General Ward",
      date: "2024-10-19",
      time: "10:15",
      status: "In Progress",
      reason: "Stable condition - Ready for step-down care",
    },
    {
      id: "T003",
      patient: "Emma Williams",
      fromDept: "Emergency Room",
      toDept: "Orthopedics Ward",
      date: "2024-10-18",
      time: "16:45",
      status: "Completed",
      reason: "Fracture treatment - Requires orthopedic care",
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
                <h1 className="text-3xl font-bold text-foreground">Patient Transfers</h1>
                <p className="text-muted-foreground mt-1">Manage inter-departmental patient transfers</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Transfer
              </Button>
            </div>

            <div className="space-y-4">
              {transfers.map((transfer) => (
                <Card key={transfer.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{transfer.patient}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{transfer.reason}</p>

                        <div className="flex items-center gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="font-semibold text-foreground">{transfer.fromDept}</p>
                          </div>
                          <ArrowRightLeft className="w-5 h-5 text-accent" />
                          <div>
                            <p className="text-xs text-muted-foreground">To</p>
                            <p className="font-semibold text-foreground">{transfer.toDept}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-semibold text-foreground">{transfer.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="font-semibold text-foreground">{transfer.time}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                              {transfer.status === "Completed" ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-blue-600" />
                              )}
                              <Badge variant="outline">{transfer.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
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
