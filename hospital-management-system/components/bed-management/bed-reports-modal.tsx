"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  BarChart3, Download, Calendar, TrendingUp, 
  Clock, Users, Bed, Activity, FileText,
  PieChart, LineChart, Filter, Loader2,
  CheckCircle, AlertCircle, Info
} from "lucide-react"
import { toast } from "sonner"

interface BedReportsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BedReportsModal({ isOpen, onClose }: BedReportsModalProps) {
  const [activeTab, setActiveTab] = useState("occupancy")
  const [loading, setLoading] = useState(false)
  const [reportConfig, setReportConfig] = useState({
    dateRange: "last_30_days",
    startDate: "",
    endDate: "",
    departments: [] as string[],
    bedTypes: [] as string[],
    includeWeekends: true,
    includeHolidays: true,
    groupBy: "daily",
    format: "pdf"
  })

  const reportTypes = [
    {
      id: "occupancy",
      title: "Daily Occupancy Report",
      description: "Bed occupancy rates and trends over time",
      icon: BarChart3,
      metrics: ["Occupancy Rate", "Available Beds", "Turnaround Time", "Peak Hours"]
    },
    {
      id: "turnaround",
      title: "Bed Turnaround Metrics",
      description: "Time between discharge and next admission",
      icon: Clock,
      metrics: ["Average Turnaround", "Cleaning Time", "Maintenance Delays", "Efficiency Score"]
    },
    {
      id: "transfers",
      title: "Patient Transfer Analysis",
      description: "Transfer patterns and frequency analysis",
      icon: Activity,
      metrics: ["Transfer Volume", "Transfer Reasons", "Department Flow", "Transfer Time"]
    },
    {
      id: "utilization",
      title: "Bed Utilization Report",
      description: "Comprehensive bed usage and efficiency metrics",
      icon: PieChart,
      metrics: ["Utilization Rate", "Capacity Planning", "Seasonal Trends", "Forecasting"]
    }
  ]

  const departments = [
    "Cardiology", "ICU", "Emergency", "Pediatrics", 
    "Maternity", "Orthopedics", "Neurology", "General Ward"
  ]

  const bedTypes = [
    "Standard", "ICU", "Isolation", "Pediatric", 
    "Bariatric", "Maternity", "Telemetry"
  ]

  // Mock report data
  const mockReportData = {
    occupancy: {
      currentRate: 78.5,
      trend: "+2.3%",
      peakTime: "14:00-16:00",
      avgTurnaround: "2.4 hours",
      totalBeds: 150,
      occupiedBeds: 118,
      availableBeds: 32
    },
    turnaround: {
      avgTime: "2.4 hours",
      cleaningTime: "45 minutes",
      maintenanceTime: "1.2 hours",
      efficiencyScore: 85
    },
    transfers: {
      dailyAverage: 12,
      topReason: "Medical necessity",
      avgTransferTime: "25 minutes",
      interdepartmental: 68
    }
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock report content
      const reportContent = generateReportContent()
      
      // Download report
      if (reportConfig.format === 'pdf') {
        toast.success("PDF report generated successfully")
      } else if (reportConfig.format === 'excel') {
        downloadExcelReport(reportContent)
      } else {
        downloadCSVReport(reportContent)
      }
      
    } catch (error) {
      toast.error("Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const generateReportContent = () => {
    const currentReport = reportTypes.find(r => r.id === activeTab)
    return {
      title: currentReport?.title || "Bed Management Report",
      dateRange: reportConfig.dateRange,
      data: mockReportData[activeTab as keyof typeof mockReportData] || {},
      timestamp: new Date().toISOString()
    }
  }

  const downloadCSVReport = (content: any) => {
    const csvData = [
      ['Metric', 'Value', 'Trend'],
      ...Object.entries(content.data).map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value,
        ''
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bed-${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success("CSV report downloaded successfully")
  }

  const downloadExcelReport = (content: any) => {
    // Mock Excel download
    toast.success("Excel report downloaded successfully")
  }

  const handleDepartmentToggle = (dept: string) => {
    setReportConfig(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }))
  }

  const handleBedTypeToggle = (type: string) => {
    setReportConfig(prev => ({
      ...prev,
      bedTypes: prev.bedTypes.includes(type)
        ? prev.bedTypes.filter(t => t !== type)
        : [...prev.bedTypes, type]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Bed Management Reports & Analytics
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive reports and analytics for bed management operations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {reportTypes.map((report) => (
                <TabsTrigger key={report.id} value={report.id} className="text-xs">
                  <report.icon className="w-4 h-4 mr-1" />
                  {report.title.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {reportTypes.map((report) => (
              <TabsContent key={report.id} value={report.id} className="space-y-6">
                {/* Report Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <report.icon className="w-5 h-5 text-accent" />
                      {report.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {report.metrics.map((metric, idx) => (
                        <Badge key={idx} variant="outline">{metric}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Current Metrics Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'occupancy' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                          <p className="text-2xl font-bold text-blue-600">{mockReportData.occupancy.currentRate}%</p>
                          <p className="text-xs text-green-600">{mockReportData.occupancy.trend}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Available Beds</p>
                          <p className="text-2xl font-bold text-green-600">{mockReportData.occupancy.availableBeds}</p>
                          <p className="text-xs text-muted-foreground">of {mockReportData.occupancy.totalBeds}</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Peak Hours</p>
                          <p className="text-lg font-bold text-orange-600">{mockReportData.occupancy.peakTime}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Avg Turnaround</p>
                          <p className="text-lg font-bold text-purple-600">{mockReportData.occupancy.avgTurnaround}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'turnaround' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Average Time</p>
                          <p className="text-2xl font-bold text-blue-600">{mockReportData.turnaround.avgTime}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Cleaning Time</p>
                          <p className="text-lg font-bold text-green-600">{mockReportData.turnaround.cleaningTime}</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Maintenance</p>
                          <p className="text-lg font-bold text-orange-600">{mockReportData.turnaround.maintenanceTime}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Efficiency Score</p>
                          <p className="text-2xl font-bold text-purple-600">{mockReportData.turnaround.efficiencyScore}%</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'transfers' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Daily Average</p>
                          <p className="text-2xl font-bold text-blue-600">{mockReportData.transfers.dailyAverage}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Top Reason</p>
                          <p className="text-sm font-bold text-green-600">{mockReportData.transfers.topReason}</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Avg Transfer Time</p>
                          <p className="text-lg font-bold text-orange-600">{mockReportData.transfers.avgTransferTime}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Interdepartmental</p>
                          <p className="text-2xl font-bold text-purple-600">{mockReportData.transfers.interdepartmental}%</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'utilization' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Utilization Rate</p>
                          <p className="text-2xl font-bold text-blue-600">82.3%</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Capacity Score</p>
                          <p className="text-2xl font-bold text-green-600">A+</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Seasonal Trend</p>
                          <p className="text-lg font-bold text-orange-600">+5.2%</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">Forecast</p>
                          <p className="text-lg font-bold text-purple-600">Stable</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-accent" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select value={reportConfig.dateRange} onValueChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportConfig.dateRange === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={reportConfig.startDate}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={reportConfig.endDate}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departments */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Departments</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={reportConfig.departments.includes(dept)}
                          onCheckedChange={() => handleDepartmentToggle(dept)}
                        />
                        <Label htmlFor={`dept-${dept}`} className="text-sm">{dept}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bed Types */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Bed Types</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bedTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={reportConfig.bedTypes.includes(type)}
                          onCheckedChange={() => handleBedTypeToggle(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="groupBy">Group By</Label>
                  <Select value={reportConfig.groupBy} onValueChange={(value) => setReportConfig(prev => ({ ...prev, groupBy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={reportConfig.format} onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeWeekends"
                        checked={reportConfig.includeWeekends}
                        onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeWeekends: !!checked }))}
                      />
                      <Label htmlFor="includeWeekends" className="text-sm">Include weekends</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeHolidays"
                        checked={reportConfig.includeHolidays}
                        onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeHolidays: !!checked }))}
                      />
                      <Label htmlFor="includeHolidays" className="text-sm">Include holidays</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Report Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {reportTypes.find(r => r.id === activeTab)?.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date Range: {reportConfig.dateRange.replace(/_/g, ' ')} • 
                      Format: {reportConfig.format.toUpperCase()} • 
                      Departments: {reportConfig.departments.length || 'All'} • 
                      Bed Types: {reportConfig.bedTypes.length || 'All'}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  This report will include detailed analytics and visualizations based on your selected criteria. 
                  The generated report will contain charts, tables, and summary statistics for the specified time period.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}