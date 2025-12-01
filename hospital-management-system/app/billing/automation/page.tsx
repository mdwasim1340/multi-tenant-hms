"use client"

import { useState } from 'react'
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useBillingJobs } from "@/hooks/use-billing-jobs"
import { 
  Play, 
  RefreshCw, 
  Clock, 
  Mail, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react"

export default function BillingAutomationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { toast } = useToast()
  const {
    jobStatus,
    dailySummary,
    remindersStatus,
    paymentPlansDue,
    loading,
    error,
    actions
  } = useBillingJobs()

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleRunDailyJobs = async () => {
    setActionLoading('daily')
    try {
      await actions.runDailyJobs()
      toast({
        title: "Success",
        description: "Daily billing jobs have been triggered. Check the logs for progress.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunWeeklyJobs = async () => {
    setActionLoading('weekly')
    try {
      await actions.runWeeklyJobs()
      toast({
        title: "Success",
        description: "Weekly billing jobs have been triggered. Check the logs for progress.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkOverdue = async () => {
    setActionLoading('overdue')
    try {
      const result = await actions.markOverdueInvoices()
      toast({
        title: "Success",
        description: result.message,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleApplyLateFees = async () => {
    setActionLoading('latefees')
    try {
      const result = await actions.applyLateFees(2)
      toast({
        title: "Success",
        description: `${result.message}. Total fees: $${result.totalFees.toLocaleString()}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && !dailySummary) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 overflow-auto pt-20 pb-8">
            <div className="container mx-auto p-6">
              <div className="flex items-center gap-2 mb-6">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading billing automation...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing Automation</h1>
          <p className="text-muted-foreground mt-1">
            Manage automated billing tasks and view system status
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={actions.refreshAll}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Notifications</span>
              <Badge variant={jobStatus?.emailsEnabled ? "default" : "secondary"}>
                {jobStatus?.emailsEnabled ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Admin Email</span>
              <span className="text-sm text-muted-foreground">
                {jobStatus?.adminEmail || 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Run</span>
              <span className="text-sm text-muted-foreground">
                {jobStatus?.lastRun || 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      {dailySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Today's Summary
            </CardTitle>
            <CardDescription>
              Billing metrics for {dailySummary.date}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${dailySummary.collected_today?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Collected Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dailySummary.paid_today_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Invoices Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${dailySummary.pending_amount?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  ${dailySummary.overdue_amount?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-muted-foreground">Overdue Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminders Status */}
      {remindersStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Upcoming Reminders
              </CardTitle>
              <CardDescription>
                Invoices that will receive payment reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Due in 3 days</span>
                <Badge variant="outline">
                  {remindersStatus.upcoming.dueIn3Days}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Due in 1 day</span>
                <Badge variant="outline">
                  {remindersStatus.upcoming.dueIn1Day}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Due today</span>
                <Badge variant="destructive">
                  {remindersStatus.upcoming.dueToday}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Overdue Notices
              </CardTitle>
              <CardDescription>
                Invoices that will receive overdue notices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">7 days overdue</span>
                <Badge variant="secondary">
                  {remindersStatus.overdue.overdue7Days}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">14 days overdue</span>
                <Badge variant="destructive">
                  {remindersStatus.overdue.overdue14Days}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">30 days overdue</span>
                <Badge variant="destructive">
                  {remindersStatus.overdue.overdue30Days}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Plans Due */}
      {paymentPlansDue && (paymentPlansDue.dueToday.length > 0 || paymentPlansDue.overdue.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payment Plans Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Due Today ({paymentPlansDue.dueToday.length})</h4>
                {paymentPlansDue.dueToday.slice(0, 3).map((plan: any, index: number) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {plan.first_name} {plan.last_name} - ${plan.installment_amount?.toLocaleString()}
                  </div>
                ))}
                {paymentPlansDue.dueToday.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{paymentPlansDue.dueToday.length - 3} more
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Overdue ({paymentPlansDue.overdue.length})</h4>
                {paymentPlansDue.overdue.slice(0, 3).map((plan: any, index: number) => (
                  <div key={index} className="text-sm text-red-600">
                    {plan.first_name} {plan.last_name} - ${plan.installment_amount?.toLocaleString()}
                  </div>
                ))}
                {paymentPlansDue.overdue.length > 3 && (
                  <div className="text-sm text-red-600">
                    +{paymentPlansDue.overdue.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Manual Actions
          </CardTitle>
          <CardDescription>
            Trigger billing automation tasks manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleRunDailyJobs}
              disabled={actionLoading === 'daily'}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {actionLoading === 'daily' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Run Daily Jobs</div>
                <div className="text-xs opacity-75">Reminders & Overdue</div>
              </div>
            </Button>

            <Button
              onClick={handleRunWeeklyJobs}
              disabled={actionLoading === 'weekly'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {actionLoading === 'weekly' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Run Weekly Jobs</div>
                <div className="text-xs opacity-75">Late Fees</div>
              </div>
            </Button>

            <Button
              onClick={handleMarkOverdue}
              disabled={actionLoading === 'overdue'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {actionLoading === 'overdue' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Mark Overdue</div>
                <div className="text-xs opacity-75">Update Status</div>
              </div>
            </Button>

            <Button
              onClick={handleApplyLateFees}
              disabled={actionLoading === 'latefees'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {actionLoading === 'latefees' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <DollarSign className="w-5 h-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Apply Late Fees</div>
                <div className="text-xs opacity-75">2% Monthly</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

            {/* Configuration Note */}
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                To enable email notifications, configure the following environment variables:
                <code className="block mt-2 p-2 bg-muted rounded text-sm">
                  BILLING_EMAILS_ENABLED=true<br/>
                  BILLING_ADMIN_EMAIL=admin@hospital.com<br/>
                  SES_FROM_EMAIL=billing@hospital.com
                </code>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    </div>
  )
}
