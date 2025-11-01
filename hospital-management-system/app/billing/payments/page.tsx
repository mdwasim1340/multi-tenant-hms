"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Search, CheckCircle, Clock } from "lucide-react"

export default function PaymentProcessing() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const payments = [
    {
      id: "PAY001",
      patient: "Sarah Johnson",
      amount: "$2,450.00",
      date: "2024-10-20",
      method: "Credit Card",
      status: "Completed",
      reference: "TXN-2024-001",
    },
    {
      id: "PAY002",
      patient: "Michael Chen",
      amount: "$1,200.00",
      date: "2024-10-19",
      method: "Bank Transfer",
      status: "Completed",
      reference: "TXN-2024-002",
    },
    {
      id: "PAY003",
      patient: "Emma Williams",
      amount: "$425.00",
      date: "2024-10-18",
      method: "Payment Plan",
      status: "Pending",
      reference: "TXN-2024-003",
    },
  ]

  const getStatusColor = (status: string) => {
    return status === "Completed"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
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
                <h1 className="text-3xl font-bold text-foreground">Payment Processing</h1>
                <p className="text-muted-foreground mt-1">Process and track patient payments</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Process Payment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Processed</p>
                      <p className="text-2xl font-bold text-foreground">$125,450</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
                      <p className="text-2xl font-bold text-yellow-600">$12,800</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">98.5%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient name or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{payment.patient}</h3>
                            <p className="text-sm text-muted-foreground">{payment.reference}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-semibold text-foreground">{payment.amount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-semibold text-foreground">{payment.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Method</p>
                            <p className="font-semibold text-foreground">{payment.method}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge className={`mt-1 ${getStatusColor(payment.status)}`}>{payment.status}</Badge>
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
