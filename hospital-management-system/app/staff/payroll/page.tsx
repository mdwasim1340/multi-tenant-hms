"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Download } from "lucide-react"

export default function Payroll() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const payrollRecords = [
    {
      id: "PAY001",
      staff: "Dr. Emily Rodriguez",
      position: "Cardiologist",
      salary: "$8,500.00",
      period: "Oct 1-31, 2024",
      status: "Processed",
      deductions: "$1,275.00",
      netPay: "$7,225.00",
    },
    {
      id: "PAY002",
      staff: "Dr. James Wilson",
      position: "General Practitioner",
      salary: "$6,200.00",
      period: "Oct 1-31, 2024",
      status: "Processed",
      deductions: "$930.00",
      netPay: "$5,270.00",
    },
    {
      id: "PAY003",
      staff: "Nurse Lisa Park",
      position: "RN - ICU",
      salary: "$4,800.00",
      period: "Oct 1-31, 2024",
      status: "Pending",
      deductions: "$720.00",
      netPay: "$4,080.00",
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
                <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
                <p className="text-muted-foreground mt-1">Manage staff salaries and payments</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Payroll (Oct)</p>
                      <p className="text-2xl font-bold text-foreground">$156,800</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                      <p className="text-2xl font-bold text-foreground">$23,520</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Net Payroll</p>
                      <p className="text-2xl font-bold text-green-600">$133,280</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {payrollRecords.map((record) => (
                <Card key={record.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{record.staff}</h3>
                        <p className="text-sm text-muted-foreground">{record.position}</p>
                      </div>
                      <Badge variant={record.status === "Processed" ? "default" : "secondary"}>{record.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Salary</p>
                        <p className="font-semibold text-foreground">{record.salary}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deductions</p>
                        <p className="font-semibold text-foreground">{record.deductions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net Pay</p>
                        <p className="font-semibold text-green-600">{record.netPay}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Period</p>
                        <p className="font-semibold text-foreground text-xs">{record.period}</p>
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
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
