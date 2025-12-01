"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { usePaymentPlans, usePaymentPlanDetails } from "@/hooks/use-payment-plans"
import {
  CreditCard,
  Search,
  RefreshCw,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"

export default function PaymentPlansPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { paymentPlans, loading, error, refetch } = usePaymentPlans(50, 0, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  const { plan: selectedPlan, loading: planLoading } = usePaymentPlanDetails(selectedPlanId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "defaulted":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "defaulted":
        return <AlertCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredPlans = paymentPlans.filter(plan =>
    plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.patient_id.toString().includes(searchQuery)
  )

  const stats = {
    total: paymentPlans.length,
    active: paymentPlans.filter(p => p.status === 'active').length,
    completed: paymentPlans.filter(p => p.status === 'completed').length,
    defaulted: paymentPlans.filter(p => p.status === 'defaulted').length,
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
                <h1 className="text-3xl font-bold text-foreground">Payment Plans</h1>
                <p className="text-muted-foreground mt-1">Manage installment payment plans for patients</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Plan
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Plans</p>
                      <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active Plans</p>
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completed</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Defaulted</p>
                      <p className="text-2xl font-bold text-red-600">{stats.defaulted}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by plan name or patient ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={statusFilter === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("active")}
                    >
                      Active
                    </Button>
                    <Button
                      variant={statusFilter === "completed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("completed")}
                    >
                      Completed
                    </Button>
                    <Button
                      variant={statusFilter === "defaulted" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("defaulted")}
                    >
                      Defaulted
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Plans Table */}
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load payment plans</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => refetch()} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchQuery ? 'No matching payment plans found' : 'No payment plans yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Create your first payment plan to get started'
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Payment Plan
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Installments</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.map((plan) => (
                        <TableRow
                          key={plan.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <TableCell className="font-medium">{plan.plan_name}</TableCell>
                          <TableCell>{plan.patient_id}</TableCell>
                          <TableCell>{formatCurrency(plan.total_amount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(plan.paid_amount)}</TableCell>
                          <TableCell className="text-orange-600">{formatCurrency(plan.remaining_amount)}</TableCell>
                          <TableCell>{plan.installments}</TableCell>
                          <TableCell>{formatDate(plan.next_due_date)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(plan.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(plan.status)}
                                {plan.status.toUpperCase()}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPlanId(plan.id)
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Plan Details Modal */}
      <Dialog open={selectedPlanId !== null} onOpenChange={() => setSelectedPlanId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Plan Details</DialogTitle>
            <DialogDescription>
              View and manage payment plan information
            </DialogDescription>
          </DialogHeader>

          {planLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedPlan ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan Name</p>
                  <p className="font-semibold">{selectedPlan.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedPlan.status)}>
                    {selectedPlan.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedPlan.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedPlan.paid_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Amount</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(selectedPlan.remaining_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Installment Amount</p>
                  <p className="font-semibold">{formatCurrency(selectedPlan.installment_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-semibold capitalize">{selectedPlan.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Due Date</p>
                  <p className="font-semibold">{formatDate(selectedPlan.next_due_date)}</p>
                </div>
              </div>

              {selectedPlan.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{selectedPlan.notes}</p>
                </div>
              )}

              {selectedPlan.status === 'active' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Schedule
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
