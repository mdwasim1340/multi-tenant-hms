"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, CheckCircle, Clock } from "lucide-react"

export default function TrainingAndDevelopment() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const trainingPrograms = [
    {
      id: "TRAIN001",
      staff: "Dr. Emily Rodriguez",
      program: "Advanced Cardiac Imaging",
      provider: "American Heart Association",
      startDate: "2024-11-01",
      endDate: "2024-11-15",
      status: "Enrolled",
      progress: 0,
    },
    {
      id: "TRAIN002",
      staff: "Dr. James Wilson",
      program: "Patient Communication Skills",
      provider: "Medical Education Institute",
      startDate: "2024-10-01",
      endDate: "2024-10-31",
      status: "In Progress",
      progress: 65,
    },
    {
      id: "TRAIN003",
      staff: "Nurse Lisa Park",
      program: "Critical Care Nursing",
      provider: "AACN",
      startDate: "2024-09-01",
      endDate: "2024-09-30",
      status: "Completed",
      progress: 100,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "Enrolled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
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
                <h1 className="text-3xl font-bold text-foreground">Training & Development</h1>
                <p className="text-muted-foreground mt-1">Manage staff training programs and certifications</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Enroll Staff
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active Programs</p>
                      <p className="text-2xl font-bold text-foreground">12</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completed This Year</p>
                      <p className="text-2xl font-bold text-green-600">28</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">5</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {trainingPrograms.map((program) => (
                <Card key={program.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{program.program}</h3>
                        <p className="text-sm text-muted-foreground">{program.staff}</p>
                      </div>
                      <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Provider</p>
                        <p className="font-semibold text-foreground">{program.provider}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-semibold text-foreground">{program.startDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="font-semibold text-foreground">{program.endDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="font-semibold text-accent">{program.progress}%</p>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${program.progress}%` }}
                      ></div>
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
