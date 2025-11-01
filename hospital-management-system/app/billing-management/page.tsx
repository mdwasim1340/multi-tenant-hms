"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CreditCard,
  Download,
  Eye,
  Filter,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  Zap,
} from "lucide-react"

export default function BillingManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  const invoices = [
    {
      id: "INV-2024-001",
      patient: "John Doe",
      amount: "$2,450.00",
      date: "2024-01-15",
      status: "paid",
      dueDate: "2024-02-15",
      services: "Emergency Room Visit, CT Scan",
    },
    {
      id: "INV-2024-002",
      patient: "Jane Smith",
      amount: "$5,200.00",
      date: "2024-01-18",
      status: "pending",
      dueDate: "2024-02-18",
      services: "Surgery, Hospital Stay (3 days)",
    },
    {
      id: "INV-2024-003",
      patient: "Michael Johnson",
      amount: "$1,850.00",
      date: "2024-01-20",
      status: "overdue",
      dueDate: "2024-02-10",
      services: "Consultation, Lab Tests",
    },
    {
      id: "INV-2024-004",
      patient: "Sarah Williams",
      amount: "$3,100.00",
      date: "2024-01-22",
      status: "pending",
      dueDate: "2024-02-22",
      services: "Physical Therapy (5 sessions)",
    },
  ]

  const billingMetrics = [
    {
      label: "Total Revenue (This Month)",
      value: "$125,450",
      change: "+8%",
      icon: DollarSign,
      color: "bg-green-50 dark:bg-green-950",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Outstanding Balance",
      value: "$34,200",
      change: "-12%",
      icon: Clock,
      color: "bg-amber-50 dark:bg-amber-950",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Collection Rate",
      value: "94.2%",
      change: "+2.1%",
      icon: CheckCircle2,
      color: "bg-blue-50 dark:bg-blue-950",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Avg Days to Payment",
      value: "18 days",
      change: "-3 days",
      icon: TrendingUp,
      color: "bg-purple-50 dark:bg-purple-950",
      textColor: "text-purple-600 dark:text-purple-400",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
      case "pending":
        return "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
      case "overdue":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
    }
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
                <h1 className="text-3xl font-bold text-foreground">Billing Management</h1>
                <p className="text-muted-foreground mt-1">Manage invoices, payments, and billing records</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <CreditCard className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </div>

            {/* Billing Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {billingMetrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Card key={metric.label} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.change}</p>
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

            {/* AI Insights */}
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">AI Collection Insights</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Predictive model identifies 3 high-priority accounts for collection follow-up. Recommended action:
                      Send payment reminders to overdue accounts.
                    </p>
                    <Button variant="link" className="mt-2 p-0 h-auto text-primary">
                      View Recommendations →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by invoice ID or patient name..." className="pl-10" />
              </div>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            {/* Invoices Table */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>All billing records and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Invoice ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Services</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Due Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{invoice.id}</td>
                          <td className="py-3 px-4 text-foreground">{invoice.patient}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{invoice.services}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{invoice.amount}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                            >
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{invoice.dueDate}</td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoice(invoice.id)}
                              className="text-primary hover:bg-primary/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Detail Modal */}
            {selectedInvoice && (
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Invoice Details - {selectedInvoice}</CardTitle>
                    <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Patient Name</p>
                      <p className="font-semibold text-foreground">Jane Smith</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Date</p>
                      <p className="font-semibold text-foreground">2024-01-18</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold text-foreground text-lg">$5,200.00</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        Pending
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold text-foreground mb-4">Itemized Services</h3>
                    <div className="space-y-3">
                      {[
                        { service: "Surgical Procedure", cost: "$3,500.00" },
                        { service: "Hospital Stay (3 nights)", cost: "$1,200.00" },
                        { service: "Anesthesia", cost: "$400.00" },
                        { service: "Post-operative Care", cost: "$100.00" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 border border-border/50 rounded"
                        >
                          <span className="text-foreground">{item.service}</span>
                          <span className="font-semibold text-foreground">{item.cost}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline">Send Reminder</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
