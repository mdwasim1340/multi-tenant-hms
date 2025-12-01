"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { ProfitLossReport } from "@/hooks/use-balance-reports"

interface ProfitLossReportProps {
  report: ProfitLossReport
}

/**
 * Profit & Loss Report Display Component
 * 
 * Displays revenue, expenses, and net profit/loss with:
 * - Color coding (green for profit, red for loss)
 * - Currency formatting with ₹ symbol
 * - Comparison columns when enabled
 * - Variance highlighting (>20%)
 * 
 * Requirements: 1.4, 1.5, 11.1, 11.2, 11.4, 15.2, 15.4
 */
export function ProfitLossReportDisplay({ report }: ProfitLossReportProps) {
  const isProfitable = report.netProfitLoss >= 0

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

  const isHighVariance = (percent: number) => Math.abs(percent) > 20

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
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <span>Metric</span>
                <span className="text-center">Current</span>
                <span className="text-center">Previous</span>
                <span className="text-center">Variance</span>
                <span className="text-center">Variance %</span>
              </div>
              {report.comparison.revenue && (
                <ComparisonRow
                  label="Revenue"
                  current={formatCurrency(report.comparison.revenue.current)}
                  previous={formatCurrency(report.comparison.revenue.previous)}
                  variance={formatCurrency(report.comparison.revenue.variance)}
                  variancePercent={formatPercent(report.comparison.revenue.variancePercent)}
                  isPositive={report.comparison.revenue.variance >= 0}
                  isHighVariance={isHighVariance(report.comparison.revenue.variancePercent)}
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
                  isHighVariance={isHighVariance(report.comparison.expenses.variancePercent)}
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
                  isHighVariance={isHighVariance(report.comparison.netProfitLoss.variancePercent)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ReportRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
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
  isHighVariance,
}: {
  label: string
  current: string
  previous: string
  variance: string
  variancePercent: string
  isPositive: boolean
  isHighVariance: boolean
}) {
  return (
    <div className={`grid grid-cols-5 gap-4 items-center p-3 rounded-lg ${isHighVariance ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-muted'}`}>
      <span className="font-medium">{label}</span>
      <span className="text-center">{current}</span>
      <span className="text-center text-muted-foreground">{previous}</span>
      <span className={`text-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{variance}</span>
      <span className={`text-center font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {variancePercent}
        {isHighVariance && <span className="ml-1">⚠️</span>}
      </span>
    </div>
  )
}

export default ProfitLossReportDisplay
