"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useProfitLoss,
  useBalanceSheet,
  useCashFlow,
  useExportReport,
  useBalanceReports,
  type ReportType,
  type ComparisonType,
} from "@/hooks/use-balance-reports"
import {
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FileDown,
} from "lucide-react"

export default function BalanceReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Use the combined hook for state management
  const {
    mounted,
    reportType,
    setReportType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    asOfDate,
    setAsOfDate,
    departmentId,
    setDepartmentId,
    enableComparison,
    setEnableComparison,
    comparisonType,
    setComparisonType,
  } = useBalanceReports()

  // Fetch reports based on type
  const profitLoss = useProfitLoss(
    reportType === 'profit-loss' ? startDate : undefined,
    reportType === 'profit-loss' ? endDate : undefined,
    departmentId,
    enableComparison,
    comparisonType
  )

  const balanceSheet = useBalanceSheet(
    reportType === 'balance-sheet' ? asOfDate : undefined,
    departmentId,
    enableComparison
  )

  const cashFlow = useCashFlow(
    reportType === 'cash-flow' ? startDate : undefined,
    reportType === 'cash-flow' ? endDate : undefined,
    departmentId,
    enableComparison,
    comparisonType
  )

  const { exportReport, loading: exportLoading, error: exportError } = useExportReport()

  // Get current report data
  const getCurrentReport = () => {
    switch (reportType) {
      case 'profit-loss':
        return profitLoss.report
      case 'balance-sheet':
        return balanceSheet.report
      case 'cash-flow':
        return cashFlow.report
      default:
        return null
    }
  }

  const isLoading = () => {
    switch (reportType) {
      case 'profit-loss':
        return profitLoss.loading
      case 'balance-sheet':
        return balanceSheet.loading
      case 'cash-flow':
        return cashFlow.loading
      default:
        return false
    }
  }

  const getError = () => {
    switch (reportType) {
      case 'profit-loss':
        return profitLoss.error
      case 'balance-sheet':
        return balanceSheet.error
      case 'cash-flow':
        return cashFlow.error
      default:
        return null
    }
  }

  const getWarnings = () => {
    switch (reportType) {
      case 'profit-loss':
        return profitLoss.warnings
      case 'balance-sheet':
        return balanceSheet.warnings
      case 'cash-flow':
        return cashFlow.warnings
      default:
        return []
    }
  }

  const handleRefresh = () => {
    switch (reportType) {
      case 'profit-loss':
        profitLoss.refetch()
        break
      case 'balance-sheet':
        balanceSheet.refetch()
        break
      case 'cash-flow':
        cashFlow.refetch()
        break
    }
  }

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const report = getCurrentReport()
    if (!report) return

    const reportTypeMap = {
      'profit-loss': 'profit_loss' as const,
      'balance-sheet': 'balance_sheet' as const,
      'cash-flow': 'cash_flow' as const,
    }

    await exportReport(reportTypeMap[reportType], format, report)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
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
                <h1 className="text-3xl font-bold text-foreground">Balance Reports</h1>
                <p className="text-muted-foreground mt-1">
                  Financial statements and analysis
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading()}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading() ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Report Parameters</CardTitle>
                <CardDescription>Configure the report type and filters</CardDescription>
              </CardHeader>
              <CardContent>
                {!mounted ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Report Type */}
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                        <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                        <SelectItem value="cash-flow">Cash Flow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range for P&L and Cash Flow */}
                  {(reportType === 'profit-loss' || reportType === 'cash-flow') && (
                    <>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* As of Date for Balance Sheet */}
                  {reportType === 'balance-sheet' && (
                    <div className="space-y-2">
                      <Label>As of Date</Label>
                      <Input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Comparison Toggle */}
                  <div className="space-y-2">
                    <Label>Enable Comparison</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={enableComparison}
                        onCheckedChange={setEnableComparison}
                      />
                      <span className="text-sm text-muted-foreground">
                        {enableComparison ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Comparison Type */}
                  {enableComparison && reportType !== 'balance-sheet' && (
                    <div className="space-y-2">
                      <Label>Comparison Type</Label>
                      <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as ComparisonType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="previous-period">Previous Period</SelectItem>
                          <SelectItem value="year-over-year">Year over Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                )}

                {/* Export Buttons */}
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={!getCurrentReport() || exportLoading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('excel')}
                    disabled={!getCurrentReport() || exportLoading}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    disabled={!getCurrentReport() || exportLoading}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {getError() && (
              <Card className="border-red-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>{getError()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings Display */}
            {getWarnings().length > 0 && (
              <Card className="border-yellow-500">
                <CardContent className="pt-6">
                  {getWarnings().map((warning, index) => (
                    <div key={index} className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-5 h-5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Report Display */}
            {isLoading() ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-64" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Profit & Loss Report */}
                {reportType === 'profit-loss' && profitLoss.report && (
                  <ProfitLossDisplay report={profitLoss.report} formatCurrency={formatCurrency} formatPercent={formatPercent} />
                )}

                {/* Balance Sheet Report */}
                {reportType === 'balance-sheet' && balanceSheet.report && (
                  <BalanceSheetDisplay report={balanceSheet.report} formatCurrency={formatCurrency} />
                )}

                {/* Cash Flow Report */}
                {reportType === 'cash-flow' && cashFlow.report && (
                  <CashFlowDisplay report={cashFlow.report} formatCurrency={formatCurrency} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}


// Profit & Loss Display Component
function ProfitLossDisplay({ 
  report, 
  formatCurrency, 
  formatPercent 
}: { 
  report: any
  formatCurrency: (n: number) => string
  formatPercent: (n: number) => string
}) {
  const isProfitable = report.netProfitLoss >= 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(report.revenue.total)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(report.expenses.total)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={isProfitable ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net {isProfitable ? 'Profit' : 'Loss'}</p>
                <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(report.netProfitLoss))}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${isProfitable ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Consultations" value={formatCurrency(report.revenue.consultations)} />
            <ReportRow label="Procedures" value={formatCurrency(report.revenue.procedures)} />
            <ReportRow label="Medications" value={formatCurrency(report.revenue.medications)} />
            <ReportRow label="Lab Tests" value={formatCurrency(report.revenue.labTests)} />
            <ReportRow label="Other" value={formatCurrency(report.revenue.other)} />
            <div className="border-t pt-3">
              <ReportRow label="Total Revenue" value={formatCurrency(report.revenue.total)} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Salaries" value={formatCurrency(report.expenses.salaries)} />
            <ReportRow label="Supplies" value={formatCurrency(report.expenses.supplies)} />
            <ReportRow label="Utilities" value={formatCurrency(report.expenses.utilities)} />
            <ReportRow label="Maintenance" value={formatCurrency(report.expenses.maintenance)} />
            <ReportRow label="Other" value={formatCurrency(report.expenses.other)} />
            <div className="border-t pt-3">
              <ReportRow label="Total Expenses" value={formatCurrency(report.expenses.total)} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Section */}
      {report.comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.comparison.revenue && (
                <ComparisonRow
                  label="Revenue"
                  current={formatCurrency(report.comparison.revenue.current)}
                  previous={formatCurrency(report.comparison.revenue.previous)}
                  variance={formatCurrency(report.comparison.revenue.variance)}
                  variancePercent={formatPercent(report.comparison.revenue.variancePercent)}
                  isPositive={report.comparison.revenue.variance >= 0}
                />
              )}
              {report.comparison.expenses && (
                <ComparisonRow
                  label="Expenses"
                  current={formatCurrency(report.comparison.expenses.current)}
                  previous={formatCurrency(report.comparison.expenses.previous)}
                  variance={formatCurrency(report.comparison.expenses.variance)}
                  variancePercent={formatPercent(report.comparison.expenses.variancePercent)}
                  isPositive={report.comparison.expenses.variance <= 0}
                />
              )}
              {report.comparison.netProfitLoss && (
                <ComparisonRow
                  label="Net Profit/Loss"
                  current={formatCurrency(report.comparison.netProfitLoss.current)}
                  previous={formatCurrency(report.comparison.netProfitLoss.previous)}
                  variance={formatCurrency(report.comparison.netProfitLoss.variance)}
                  variancePercent={formatPercent(report.comparison.netProfitLoss.variancePercent)}
                  isPositive={report.comparison.netProfitLoss.variance >= 0}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Balance Sheet Display Component
function BalanceSheetDisplay({ 
  report, 
  formatCurrency 
}: { 
  report: any
  formatCurrency: (n: number) => string
}) {
  return (
    <div className="space-y-6">
      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Current Assets</h4>
              <div className="pl-4 space-y-2">
                <ReportRow label="Cash" value={formatCurrency(report.assets.current.cash)} />
                <ReportRow label="Accounts Receivable" value={formatCurrency(report.assets.current.accountsReceivable)} />
                <ReportRow label="Inventory" value={formatCurrency(report.assets.current.inventory)} />
                <ReportRow label="Total Current Assets" value={formatCurrency(report.assets.current.total)} bold />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Fixed Assets</h4>
              <div className="pl-4 space-y-2">
                <ReportRow label="Equipment" value={formatCurrency(report.assets.fixed.equipment)} />
                <ReportRow label="Buildings" value={formatCurrency(report.assets.fixed.buildings)} />
                <ReportRow label="Land" value={formatCurrency(report.assets.fixed.land)} />
                <ReportRow label="Vehicles" value={formatCurrency(report.assets.fixed.vehicles)} />
                <ReportRow label="Total Fixed Assets" value={formatCurrency(report.assets.fixed.total)} bold />
              </div>
            </div>
            <div className="border-t pt-3">
              <ReportRow label="TOTAL ASSETS" value={formatCurrency(report.assets.total)} bold className="text-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Current Liabilities</h4>
              <div className="pl-4 space-y-2">
                <ReportRow label="Accounts Payable" value={formatCurrency(report.liabilities.current.accountsPayable)} />
                <ReportRow label="Accrued Expenses" value={formatCurrency(report.liabilities.current.accruedExpenses)} />
                <ReportRow label="Total Current Liabilities" value={formatCurrency(report.liabilities.current.total)} bold />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Long-term Liabilities</h4>
              <div className="pl-4 space-y-2">
                <ReportRow label="Loans" value={formatCurrency(report.liabilities.longTerm.loans)} />
                <ReportRow label="Mortgages" value={formatCurrency(report.liabilities.longTerm.mortgages)} />
                <ReportRow label="Total Long-term Liabilities" value={formatCurrency(report.liabilities.longTerm.total)} bold />
              </div>
            </div>
            <div className="border-t pt-3">
              <ReportRow label="TOTAL LIABILITIES" value={formatCurrency(report.liabilities.total)} bold className="text-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-600">Equity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Retained Earnings" value={formatCurrency(report.equity.retainedEarnings)} />
            <div className="border-t pt-3">
              <ReportRow label="TOTAL EQUITY" value={formatCurrency(report.equity.total)} bold className="text-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounting Equation */}
      <Card className={report.accountingEquationBalanced ? 'border-green-500' : 'border-red-500'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Accounting Equation</p>
              <p className="text-lg font-semibold">
                Assets = Liabilities + Equity
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(report.assets.total)} = {formatCurrency(report.liabilities.total)} + {formatCurrency(report.equity.total)}
              </p>
            </div>
            {report.accountingEquationBalanced ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


// Cash Flow Display Component
function CashFlowDisplay({ 
  report, 
  formatCurrency 
}: { 
  report: any
  formatCurrency: (n: number) => string
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Beginning Cash</p>
            <p className="text-xl font-bold">{formatCurrency(report.beginningCash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Cash Flow</p>
            <p className={`text-xl font-bold ${report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(report.netCashFlow)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ending Cash</p>
            <p className="text-xl font-bold">{formatCurrency(report.endingCash)}</p>
          </CardContent>
        </Card>
        <Card className={report.netCashFlow >= 0 ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cash Position</p>
            <p className={`text-xl font-bold ${report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {report.netCashFlow >= 0 ? 'Positive' : 'Negative'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operating Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Operating Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Cash Inflows" value={formatCurrency(report.operatingActivities.inflows.total)} className="text-green-600" />
            <ReportRow label="Cash Outflows" value={formatCurrency(report.operatingActivities.outflows.total)} className="text-red-600" />
            <div className="border-t pt-3">
              <ReportRow 
                label="Net Operating Cash Flow" 
                value={formatCurrency(report.operatingActivities.net)} 
                bold 
                className={report.operatingActivities.net >= 0 ? 'text-green-600' : 'text-red-600'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investing Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Investing Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Cash Inflows" value={formatCurrency(report.investingActivities.inflows.total)} className="text-green-600" />
            <ReportRow label="Cash Outflows" value={formatCurrency(report.investingActivities.outflows.total)} className="text-red-600" />
            <div className="border-t pt-3">
              <ReportRow 
                label="Net Investing Cash Flow" 
                value={formatCurrency(report.investingActivities.net)} 
                bold 
                className={report.investingActivities.net >= 0 ? 'text-green-600' : 'text-red-600'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-600">Financing Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Cash Inflows" value={formatCurrency(report.financingActivities.inflows.total)} className="text-green-600" />
            <ReportRow label="Cash Outflows" value={formatCurrency(report.financingActivities.outflows.total)} className="text-red-600" />
            <div className="border-t pt-3">
              <ReportRow 
                label="Net Financing Cash Flow" 
                value={formatCurrency(report.financingActivities.net)} 
                bold 
                className={report.financingActivities.net >= 0 ? 'text-green-600' : 'text-red-600'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportRow label="Beginning Cash Balance" value={formatCurrency(report.beginningCash)} />
            <ReportRow 
              label="Net Operating Cash Flow" 
              value={formatCurrency(report.operatingActivities.net)} 
              className={report.operatingActivities.net >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <ReportRow 
              label="Net Investing Cash Flow" 
              value={formatCurrency(report.investingActivities.net)} 
              className={report.investingActivities.net >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <ReportRow 
              label="Net Financing Cash Flow" 
              value={formatCurrency(report.financingActivities.net)} 
              className={report.financingActivities.net >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <div className="border-t pt-3">
              <ReportRow 
                label="Total Net Cash Flow" 
                value={formatCurrency(report.netCashFlow)} 
                bold 
                className={report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}
              />
              <ReportRow label="Ending Cash Balance" value={formatCurrency(report.endingCash)} bold className="text-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper Components
function ReportRow({ 
  label, 
  value, 
  bold = false, 
  className = '' 
}: { 
  label: string
  value: string
  bold?: boolean
  className?: string
}) {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className={bold ? 'font-semibold' : ''}>{label}</span>
      <span className={bold ? 'font-bold' : 'font-medium'}>{value}</span>
    </div>
  )
}

function ComparisonRow({
  label,
  current,
  previous,
  variance,
  variancePercent,
  isPositive,
}: {
  label: string
  current: string
  previous: string
  variance: string
  variancePercent: string
  isPositive: boolean
}) {
  return (
    <div className="grid grid-cols-5 gap-4 items-center p-3 bg-muted rounded-lg">
      <span className="font-medium">{label}</span>
      <span className="text-center">{current}</span>
      <span className="text-center text-muted-foreground">{previous}</span>
      <span className={`text-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{variance}</span>
      <span className={`text-center font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {variancePercent}
      </span>
    </div>
  )
}
