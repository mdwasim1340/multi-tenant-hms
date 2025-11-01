"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Plus, Search, AlertCircle } from "lucide-react"

export default function AccountsReceivable() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const receivables = [
    {
      id: "AR001",
      patient: "Sarah Johnson",
      balance: "$850.00",
      daysOutstanding: 45,
      priority: "High",
      lastPayment: "2024-09-15",
      aiRecommendation: "Payment plan recommended - 3 installments",
    },
    {
      id: "AR002",
      patient: "Michael Chen",
      balance: "$1,200.00",
      daysOutstanding: 60,
      priority: "Critical",
      lastPayment: "2024-08-20",
      aiRecommendation: "Escalate to collections - Legal action may be necessary",
    },
    {
      id: "AR003",
      patient: "Emma Williams",
      balance: "$425.00",
      daysOutstanding: 30,
      priority: "Medium",
      lastPayment: "2024-09-20",
      aiRecommendation: "Send payment reminder - Follow up in 7 days",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
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
                <h1 className="text-3xl font-bold text-foreground">Accounts Receivable</h1>
                <p className="text-muted-foreground mt-1">Track outstanding patient balances</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
                      <p className="text-2xl font-bold text-foreground">$34,200</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Accounts in Collections</p>
                      <p className="text-2xl font-bold text-red-600">8</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Collection Rate</p>
                      <p className="text-2xl font-bold text-green-600">87.3%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {receivables.map((account) => (
                <Card key={account.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{account.patient}</h3>
                        <p className="text-sm text-muted-foreground">{account.id}</p>
                      </div>
                      <Badge className={getPriorityColor(account.priority)}>{account.priority}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                        <p className="font-semibold text-foreground">{account.balance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Days Outstanding</p>
                        <p className="font-semibold text-foreground">{account.daysOutstanding}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Payment</p>
                        <p className="font-semibold text-foreground">{account.lastPayment}</p>
                      </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-accent mb-1">Collection Strategy</p>
                          <p className="text-sm text-foreground">{account.aiRecommendation}</p>
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
