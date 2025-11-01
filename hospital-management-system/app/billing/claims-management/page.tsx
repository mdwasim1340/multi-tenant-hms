"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Eye, AlertCircle, TrendingUp } from "lucide-react"

export default function ClaimsManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const claims = [
    {
      id: "CLM001",
      claimNumber: "CLM-2024-10-001",
      patient: "Sarah Johnson",
      amount: "$2,450.00",
      status: "Submitted",
      submittedDate: "2024-10-20",
      daysOutstanding: 5,
      insurance: "Blue Cross",
      aiScore: 9.2,
      recommendation: "High approval probability - Submit immediately",
    },
    {
      id: "CLM002",
      claimNumber: "CLM-2024-10-002",
      patient: "Michael Chen",
      amount: "$1,850.00",
      status: "Approved",
      submittedDate: "2024-10-15",
      daysOutstanding: 10,
      insurance: "Aetna",
      aiScore: 8.7,
      recommendation: "Approved - Process payment",
    },
    {
      id: "CLM003",
      claimNumber: "CLM-2024-10-003",
      patient: "Emma Williams",
      amount: "$3,200.00",
      status: "Denied",
      submittedDate: "2024-10-10",
      daysOutstanding: 15,
      insurance: "United Health",
      aiScore: 4.1,
      recommendation: "Appeal recommended - Missing documentation",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Denied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Pending":
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
                <h1 className="text-3xl font-bold text-foreground">Claims Management</h1>
                <p className="text-muted-foreground mt-1">Track and manage insurance claims with AI insights</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Export Claims
              </Button>
            </div>

            {/* Claims Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Claims</p>
                  <p className="text-2xl font-bold text-foreground mt-2">156</p>
                  <p className="text-xs text-muted-foreground mt-2">This month</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">142</p>
                  <p className="text-xs text-muted-foreground mt-2">91% approval rate</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">8</p>
                  <p className="text-xs text-muted-foreground mt-2">Avg 12 days</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground mt-2">$487,500</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by claim number, patient, or insurance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Status Tabs */}
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Claims</TabsTrigger>
                <TabsTrigger value="submitted">Submitted</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="denied">Denied</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {claims.map((claim) => (
                  <Card key={claim.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{claim.claimNumber}</h3>
                              <p className="text-sm text-muted-foreground">{claim.patient}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">{claim.amount}</p>
                              <p className="text-xs text-muted-foreground">{claim.insurance}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className={`mt-1 ${getStatusColor(claim.status)}`}>{claim.status}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Submitted</p>
                              <p className="font-semibold text-foreground text-sm">{claim.submittedDate}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Days Outstanding</p>
                              <p className="font-semibold text-foreground text-sm">{claim.daysOutstanding}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">AI Score</p>
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="w-4 h-4 text-accent" />
                                <span className="font-semibold text-foreground">{claim.aiScore}</span>
                              </div>
                            </div>
                          </div>

                          {/* AI Recommendation */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Recommendation</p>
                                <p className="text-sm text-foreground">{claim.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
