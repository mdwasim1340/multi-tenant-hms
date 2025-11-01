"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, Edit, Plus } from "lucide-react"

export default function BedAssignment() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const beds = [
    {
      id: "B301",
      bedNumber: "301",
      department: "Cardiology",
      status: "Occupied",
      patient: "Sarah Johnson",
      admissionDate: "2024-10-18",
      condition: "Stable",
    },
    {
      id: "B302",
      bedNumber: "302",
      department: "Cardiology",
      status: "Available",
      patient: null,
      admissionDate: null,
      condition: null,
    },
    {
      id: "B303",
      bedNumber: "303",
      department: "Orthopedics",
      status: "Occupied",
      patient: "Michael Chen",
      admissionDate: "2024-10-15",
      condition: "Critical",
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
                <h1 className="text-3xl font-bold text-foreground">Bed Assignment</h1>
                <p className="text-muted-foreground mt-1">Assign and manage patient bed allocations</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Beds</p>
                  <p className="text-2xl font-bold text-foreground mt-2">48</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold text-foreground mt-2">38</p>
                  <p className="text-xs text-muted-foreground mt-2">79% occupancy</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">10</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {beds.map((bed) => (
                <Card key={bed.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bed className="w-5 h-5 text-accent" />
                          <h3 className="font-semibold text-foreground">Bed {bed.bedNumber}</h3>
                          <Badge>{bed.department}</Badge>
                        </div>
                        {bed.status === "Occupied" ? (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-semibold text-foreground">{bed.patient}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Admission Date</p>
                                <p className="font-semibold text-foreground">{bed.admissionDate}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Condition</p>
                                <Badge
                                  className={
                                    bed.condition === "Critical"
                                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                                      : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                                  }
                                >
                                  {bed.condition}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge variant="outline">{bed.status}</Badge>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                              Available for Assignment
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
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
