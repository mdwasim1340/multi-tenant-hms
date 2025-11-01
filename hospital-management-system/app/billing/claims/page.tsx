"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, Plus, Search, TrendingUp } from "lucide-react"

export default function InsuranceClaims() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const claims = [
    {
      id: "CLM001",
      patient: "Sarah Johnson",
      insurance: "Blue Cross Blue Shield",
      amount: "$2,450.00",
      submitted: "2024-10-20",
      status: "Approved",
      approvalProbability: "98%",
      aiRecommendation: "Claim optimized - Expected reimbursement 98%",
    },
    {
      id: "CLM002",
      patient: "Michael Chen",
      insurance: "Aetna",
      amount: "$1,200.00",
      submitted: "2024-10-18",
      status: "Pending",
      approvalProbability: "85%",
      aiRecommendation: "Pre-authorization submitted - Approval pending",
    },
    {
      id: "CLM003",
      patient: "Emma Williams",
      insurance: "United Healthcare",
      amount: "$850.00",
      submitted: "2024-10-15",
      status: "Denied",
      approvalProbability: "45%",
      aiRecommendation: "Appeal recommended - Resubmit with additional documentation",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Denied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
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
                <h1 className="text-3xl font-bold text-foreground">Insurance Claims</h1>
                <p className="text-muted-foreground mt-1">Manage and track insurance claims</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Claim
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or claim ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{claim.id}</h3>
                          <p className="text-sm text-muted-foreground">{claim.patient}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Insurance</p>
                        <p className="font-semibold text-foreground">{claim.insurance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-semibold text-foreground">{claim.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="font-semibold text-foreground">{claim.submitted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Approval Probability</p>
                        <p className="font-semibold text-accent">{claim.approvalProbability}</p>
                      </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-accent mb-1">AI Recommendation</p>
                          <p className="text-sm text-foreground">{claim.aiRecommendation}</p>
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
