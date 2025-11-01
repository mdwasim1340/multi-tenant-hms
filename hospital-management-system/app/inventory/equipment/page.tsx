"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Wrench } from "lucide-react"

export default function EquipmentMaintenance() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const equipment = [
    {
      id: "E001",
      name: "Ultrasound Machine",
      location: "Room 301",
      status: "Operational",
      lastMaintenance: "2024-10-15",
      nextMaintenance: "2024-11-15",
      condition: "Good",
    },
    {
      id: "E002",
      name: "ECG Monitor",
      location: "Room 302",
      status: "Maintenance Due",
      lastMaintenance: "2024-09-10",
      nextMaintenance: "2024-10-25",
      condition: "Fair",
    },
    {
      id: "E003",
      name: "Blood Pressure Monitor",
      location: "Room 303",
      status: "Operational",
      lastMaintenance: "2024-10-18",
      nextMaintenance: "2024-11-18",
      condition: "Excellent",
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
                <h1 className="text-3xl font-bold text-foreground">Equipment Maintenance</h1>
                <p className="text-muted-foreground mt-1">Track and schedule equipment maintenance</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Equipment</p>
                  <p className="text-2xl font-bold text-foreground mt-2">24</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Operational</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">22</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Maintenance Due</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">2</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {equipment.map((item) => (
                <Card key={item.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-5 h-5 text-accent" />
                          <h3 className="font-semibold text-foreground">{item.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-semibold text-foreground">{item.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge
                              className={
                                item.status === "Operational"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Maintenance</p>
                            <p className="font-semibold text-foreground">{item.lastMaintenance}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Next Due</p>
                            <p className="font-semibold text-foreground">{item.nextMaintenance}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Condition</p>
                            <Badge variant="outline">{item.condition}</Badge>
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
