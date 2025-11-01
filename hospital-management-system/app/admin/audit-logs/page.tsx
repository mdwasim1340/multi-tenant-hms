"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileJson, Search, Download } from "lucide-react"

export default function AuditLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState("all")

  // Sample audit log data
  const auditLogs = [
    {
      id: 1,
      timestamp: "2024-01-15 14:32:45",
      user: "Dr. Sarah Johnson",
      action: "View Patient Record",
      resource: "Patient #2847",
      status: "success",
      details: "Accessed medical records for patient John Doe",
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:28:12",
      user: "Emily Chen",
      action: "Update Medication",
      resource: "Patient #2847",
      status: "success",
      details: "Updated medication dosage",
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:15:33",
      user: "Michael Rodriguez",
      action: "User Login",
      resource: "System",
      status: "success",
      details: "Administrator login from IP 192.168.1.100",
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:05:22",
      user: "Lisa Wang",
      action: "Generate Invoice",
      resource: "Invoice #INV-2024-001",
      status: "success",
      details: "Created invoice for patient billing",
    },
    {
      id: 5,
      timestamp: "2024-01-15 13:52:10",
      user: "James Patterson",
      action: "Failed Login Attempt",
      resource: "System",
      status: "failed",
      details: "Invalid credentials from IP 203.0.113.45",
    },
    {
      id: 6,
      timestamp: "2024-01-15 13:45:55",
      user: "Dr. Sarah Johnson",
      action: "Delete Record",
      resource: "Appointment #5432",
      status: "success",
      details: "Cancelled appointment",
    },
  ]

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = selectedAction === "all" || log.action === selectedAction
    return matchesSearch && matchesAction
  })

  const getActionColor = (action: string) => {
    if (action.includes("Login")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (action.includes("Delete")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (action.includes("Update")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <FileJson className="w-8 h-8 text-accent" />
                  Audit Logs
                </h1>
                <p className="text-muted-foreground mt-1">Track all system activities and user actions</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Download className="w-4 h-4" />
                Export Logs
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="View Patient Record">View Patient Record</SelectItem>
                  <SelectItem value="Update Medication">Update Medication</SelectItem>
                  <SelectItem value="User Login">User Login</SelectItem>
                  <SelectItem value="Generate Invoice">Generate Invoice</SelectItem>
                  <SelectItem value="Delete Record">Delete Record</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audit Logs Table */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>System Activity Log</CardTitle>
                <CardDescription>Complete record of all system activities and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">{log.timestamp}</TableCell>
                          <TableCell className="font-medium">{log.user}</TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.resource}</TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === "success" ? "default" : "destructive"}
                              className={
                                log.status === "success"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : ""
                              }
                            >
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
