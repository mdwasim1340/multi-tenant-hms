"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Eye, Edit, FileText, Calendar } from "lucide-react"

export default function PatientRecords() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const records = [
    {
      id: "R001",
      patient: "Sarah Johnson",
      mrn: "MRN-2024-001",
      recordType: "Medical History",
      date: "2024-10-20",
      provider: "Dr. Rodriguez",
      status: "Complete",
      summary: "Annual physical examination completed",
    },
    {
      id: "R002",
      patient: "Michael Chen",
      mrn: "MRN-2024-002",
      recordType: "Lab Results",
      date: "2024-10-18",
      provider: "Lab Services",
      status: "Reviewed",
      summary: "Blood work results - All values normal",
    },
    {
      id: "R003",
      patient: "Emma Williams",
      mrn: "MRN-2024-003",
      recordType: "Imaging Report",
      date: "2024-10-15",
      provider: "Dr. Park",
      status: "Pending",
      summary: "X-ray imaging - Awaiting radiologist review",
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
                <h1 className="text-3xl font-bold text-foreground">Patient Records</h1>
                <p className="text-muted-foreground mt-1">Access and manage comprehensive patient medical records</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Records
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name or MRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Patient</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Record Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Provider</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-foreground">{record.patient}</p>
                          <p className="text-xs text-muted-foreground">{record.mrn}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent" />
                          <span className="text-sm text-foreground">{record.recordType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calendar className="w-4 h-4" />
                          {record.date}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">{record.provider}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{record.status}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
