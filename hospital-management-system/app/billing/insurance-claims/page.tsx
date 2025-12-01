"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useInsuranceClaims, useInsuranceClaimDetails } from "@/hooks/use-insurance-claims"
import {
  FileText,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Upload,
  DollarSign,
} from "lucide-react"

export default function InsuranceClaimsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [approvedAmount, setApprovedAmount] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const { claims, loading, error, refetch, approveClaim, rejectClaim, markAsPaid } = useInsuranceClaims(50, 0, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  const { claim: selectedClaim, loading: claimLoading } = useInsuranceClaimDetails(selectedClaimId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "under_review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "paid":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="w-4 h-4" />
      case "under_review":
        return <AlertCircle className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      case "paid":
        return <DollarSign className="w-4 h-4" />
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

  const handleApproveClaim = async () => {
    if (!selectedClaimId || !approvedAmount) return

    try {
      await approveClaim(selectedClaimId, parseFloat(approvedAmount))
      toast({
        title: "Claim Approved",
        description: "Insurance claim has been approved successfully.",
      })
      setShowApproveModal(false)
      setApprovedAmount("")
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve claim",
        variant: "destructive",
      })
    }
  }

  const handleRejectClaim = async () => {
    if (!selectedClaimId || !rejectionReason) return

    try {
      await rejectClaim(selectedClaimId, rejectionReason)
      toast({
        title: "Claim Rejected",
        description: "Insurance claim has been rejected.",
      })
      setShowRejectModal(false)
      setRejectionReason("")
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject claim",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsPaid = async (claimId: number) => {
    try {
      await markAsPaid(claimId)
      toast({
        title: "Claim Marked as Paid",
        description: "Insurance claim payment has been recorded.",
      })
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark claim as paid",
        variant: "destructive",
      })
    }
  }

  const filteredClaims = claims.filter(claim =>
    claim.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.insurance_provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.policy_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: claims.length,
    submitted: claims.filter(c => c.status === 'submitted').length,
    under_review: claims.filter(c => c.status === 'under_review').length,
    approved: claims.filter(c => c.status === 'approved').length,
    paid: claims.filter(c => c.status === 'paid').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
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
                <h1 className="text-3xl font-bold text-foreground">Insurance Claims</h1>
                <p className="text-muted-foreground mt-1">Manage and track insurance claims</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Claim
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Under Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.under_review}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Paid</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.paid}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
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
                      placeholder="Search by claim number, provider, or policy..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Claims Table */}
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
                    <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load claims</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => refetch()} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : filteredClaims.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {searchQuery ? 'No matching claims found' : 'No insurance claims yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Submit your first insurance claim to get started'
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit Claim
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim Number</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Policy Number</TableHead>
                        <TableHead>Claim Amount</TableHead>
                        <TableHead>Approved Amount</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => (
                        <TableRow
                          key={claim.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedClaimId(claim.id)}
                        >
                          <TableCell className="font-medium">{claim.claim_number}</TableCell>
                          <TableCell>{claim.patient_id}</TableCell>
                          <TableCell>{claim.insurance_provider}</TableCell>
                          <TableCell>{claim.policy_number}</TableCell>
                          <TableCell>{formatCurrency(claim.claim_amount)}</TableCell>
                          <TableCell>
                            {claim.approved_amount ? formatCurrency(claim.approved_amount) : '-'}
                          </TableCell>
                          <TableCell>{formatDate(claim.submission_date)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(claim.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(claim.status)}
                                {claim.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedClaimId(claim.id)
                              }}
                            >
                              <Eye className="w-4 h-4" />
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

      {/* Claim Details Modal */}
      <Dialog open={selectedClaimId !== null} onOpenChange={() => setSelectedClaimId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insurance Claim Details</DialogTitle>
            <DialogDescription>
              View and manage insurance claim information
            </DialogDescription>
          </DialogHeader>

          {claimLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedClaim ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Claim Number</p>
                  <p className="font-semibold">{selectedClaim.claim_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedClaim.status)}>
                    {selectedClaim.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Insurance Provider</p>
                  <p className="font-semibold">{selectedClaim.insurance_provider}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-semibold">{selectedClaim.policy_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claim Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedClaim.claim_amount)}</p>
                </div>
                {selectedClaim.approved_amount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Amount</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedClaim.approved_amount)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Submission Date</p>
                  <p className="font-semibold">{formatDate(selectedClaim.submission_date)}</p>
                </div>
                {selectedClaim.approval_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approval Date</p>
                    <p className="font-semibold">{formatDate(selectedClaim.approval_date)}</p>
                  </div>
                )}
              </div>

              {selectedClaim.documents && selectedClaim.documents.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Documents ({selectedClaim.documents.length})</p>
                  <div className="space-y-2">
                    {selectedClaim.documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1">Document {index + 1}</span>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClaim.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{selectedClaim.notes}</p>
                </div>
              )}

              {selectedClaim.rejection_reason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm font-semibold text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600">{selectedClaim.rejection_reason}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedClaim.status === 'submitted' && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setShowApproveModal(true)
                        setApprovedAmount(selectedClaim.claim_amount.toString())
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Claim
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Claim
                    </Button>
                  </>
                )}
                {selectedClaim.status === 'approved' && (
                  <Button
                    className="flex-1"
                    onClick={() => handleMarkAsPaid(selectedClaim.id)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Approve Claim Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Insurance Claim</DialogTitle>
            <DialogDescription>
              Enter the approved amount for this claim
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approved-amount">Approved Amount (₹)</Label>
              <Input
                id="approved-amount"
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="Enter approved amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveClaim} disabled={!approvedAmount}>
              Approve Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Claim Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Insurance Claim</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this claim
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectClaim}
              disabled={!rejectionReason}
            >
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
