"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, AlertCircle, Activity, ChevronRight, Bed, Users, Clock, MapPin } from "lucide-react"

export default function BedManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  // Bed occupancy metrics
  const occupancyMetrics = [
    {
      label: "Total Beds",
      value: "450",
      icon: Bed,
      color: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Occupied Beds",
      value: "312",
      change: "69%",
      icon: Users,
      color: "bg-teal-50 dark:bg-teal-950",
      textColor: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Available Beds",
      value: "138",
      change: "31%",
      icon: Activity,
      color: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Avg Occupancy Time",
      value: "4.2 days",
      icon: Clock,
      color: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
  ]

  // Department data
  const departments = [
    {
      id: "cardiology",
      name: "Cardiology",
      totalBeds: 45,
      occupiedBeds: 38,
      availableBeds: 7,
      occupancyRate: 84,
      criticalPatients: 3,
    },
    {
      id: "orthopedics",
      name: "Orthopedics",
      totalBeds: 35,
      occupiedBeds: 28,
      availableBeds: 7,
      occupancyRate: 80,
      criticalPatients: 1,
    },
    {
      id: "neurology",
      name: "Neurology",
      totalBeds: 40,
      occupiedBeds: 32,
      availableBeds: 8,
      occupancyRate: 80,
      criticalPatients: 2,
    },
    {
      id: "pediatrics",
      name: "Pediatrics",
      totalBeds: 50,
      occupiedBeds: 35,
      availableBeds: 15,
      occupancyRate: 70,
      criticalPatients: 0,
    },
    {
      id: "icu",
      name: "ICU",
      totalBeds: 30,
      occupiedBeds: 28,
      availableBeds: 2,
      occupancyRate: 93,
      criticalPatients: 8,
    },
    {
      id: "emergency",
      name: "Emergency Room",
      totalBeds: 25,
      occupiedBeds: 18,
      availableBeds: 7,
      occupancyRate: 72,
      criticalPatients: 4,
    },
  ]

  // Bed details
  const beds = [
    {
      id: "BED-001",
      bedNumber: "101",
      department: "Cardiology",
      status: "Occupied",
      patient: "Sarah Johnson",
      patientId: "P001",
      admissionDate: "2024-10-15",
      condition: "Stable",
      nurse: "Emily Davis",
    },
    {
      id: "BED-002",
      bedNumber: "102",
      department: "Cardiology",
      status: "Available",
      patient: null,
      patientId: null,
      admissionDate: null,
      condition: null,
      nurse: null,
    },
    {
      id: "BED-003",
      bedNumber: "103",
      department: "Cardiology",
      status: "Occupied",
      patient: "Michael Chen",
      patientId: "P002",
      admissionDate: "2024-10-18",
      condition: "Critical",
      nurse: "John Smith",
    },
    {
      id: "BED-004",
      bedNumber: "201",
      department: "Orthopedics",
      status: "Occupied",
      patient: "Emma Williams",
      patientId: "P003",
      admissionDate: "2024-10-20",
      condition: "Stable",
      nurse: "Sarah Brown",
    },
    {
      id: "BED-005",
      bedNumber: "202",
      department: "Orthopedics",
      status: "Maintenance",
      patient: null,
      patientId: null,
      admissionDate: null,
      condition: null,
      nurse: null,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Occupied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "Available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Critical":
        return "text-red-600 dark:text-red-400"
      case "Stable":
        return "text-green-600 dark:text-green-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const filteredBeds = beds.filter((bed) => {
    const matchesSearch =
      bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || bed.department.toLowerCase() === selectedDepartment
    return matchesSearch && matchesDepartment
  })

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
                <h1 className="text-3xl font-bold text-foreground">Bed Management</h1>
                <p className="text-muted-foreground mt-1">Real-time bed occupancy and patient allocation</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Assign Bed
              </Button>
            </div>

            {/* Occupancy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {occupancyMetrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Card key={metric.label} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                          {metric.change && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.change}</p>
                          )}
                        </div>
                        <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${metric.textColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="overview">Department Overview</TabsTrigger>
                <TabsTrigger value="beds">Bed Details</TabsTrigger>
                <TabsTrigger value="transfers">Patient Transfers</TabsTrigger>
              </TabsList>

              {/* Department Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <Card key={dept.id} className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{dept.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {dept.occupiedBeds} of {dept.totalBeds} beds
                              </p>
                            </div>
                            <Badge variant="outline">{dept.occupancyRate}%</Badge>
                          </div>

                          {/* Occupancy Bar */}
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="bg-accent h-3 rounded-full transition-all"
                              style={{ width: `${dept.occupancyRate}%` }}
                            ></div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-2">
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {dept.availableBeds}
                              </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-2">
                              <p className="text-xs text-muted-foreground">Critical</p>
                              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                {dept.criticalPatients}
                              </p>
                            </div>
                          </div>

                          <Button variant="outline" className="w-full bg-transparent">
                            View Details
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Bed Details Tab */}
              <TabsContent value="beds" className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by bed number, patient name, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBeds.map((bed) => (
                    <Card key={bed.id} className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Bed Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">Bed {bed.bedNumber}</h3>
                              <p className="text-sm text-muted-foreground">{bed.department}</p>
                            </div>
                            <Badge className={getStatusColor(bed.status)}>{bed.status}</Badge>
                          </div>

                          {/* Patient Info */}
                          {bed.patient ? (
                            <div className="bg-muted rounded-lg p-3 space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Patient</p>
                                <p className="font-semibold text-foreground">{bed.patient}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Admitted</p>
                                  <p className="text-sm font-medium text-foreground">{bed.admissionDate}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Condition</p>
                                  <p className={`text-sm font-medium ${getConditionColor(bed.condition)}`}>
                                    {bed.condition}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Assigned Nurse</p>
                                <p className="text-sm font-medium text-foreground">{bed.nurse}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Available for assignment
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {bed.status === "Available" ? (
                              <Button variant="outline" className="flex-1 bg-transparent">
                                Assign Patient
                              </Button>
                            ) : (
                              <>
                                <Button variant="outline" className="flex-1 bg-transparent">
                                  Transfer
                                </Button>
                                <Button variant="outline" className="flex-1 bg-transparent">
                                  Update
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Patient Transfers Tab */}
              <TabsContent value="transfers" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Patient Transfer Workflow
                    </CardTitle>
                    <CardDescription>Manage patient transfers between departments and beds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Transfer Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Select Patient</label>
                          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                            <option>Sarah Johnson (Bed 101)</option>
                            <option>Michael Chen (Bed 103)</option>
                            <option>Emma Williams (Bed 201)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Current Department</label>
                          <Input value="Cardiology" disabled />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Transfer To Department
                          </label>
                          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                            <option>Select Department</option>
                            <option>Orthopedics</option>
                            <option>Neurology</option>
                            <option>ICU</option>
                            <option>Emergency Room</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Target Bed</label>
                          <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                            <option>Select Available Bed</option>
                            <option>Bed 102 - Orthopedics</option>
                            <option>Bed 203 - Neurology</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Transfer Reason</label>
                        <textarea
                          placeholder="Enter reason for transfer..."
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          rows={3}
                        ></textarea>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                              AI Transfer Recommendation
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                              Based on patient condition and department availability, Neurology is recommended with
                              estimated transfer time of 15 minutes.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <MapPin className="w-4 h-4 mr-2" />
                        Initiate Transfer
                      </Button>
                    </div>

                    {/* Recent Transfers */}
                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Recent Transfers</h3>
                      <div className="space-y-3">
                        {[
                          {
                            patient: "John Doe",
                            from: "Emergency → Cardiology",
                            time: "2 hours ago",
                            status: "Completed",
                          },
                          {
                            patient: "Jane Smith",
                            from: "Cardiology → ICU",
                            time: "4 hours ago",
                            status: "Completed",
                          },
                          {
                            patient: "Robert Johnson",
                            from: "Orthopedics → Neurology",
                            time: "6 hours ago",
                            status: "Completed",
                          },
                        ].map((transfer, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">{transfer.patient}</p>
                              <p className="text-sm text-muted-foreground">{transfer.from}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1">
                                {transfer.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{transfer.time}</p>
                            </div>
                          </div>
                        ))}
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
