"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  FileText, Calendar, User, Activity, Clock, 
  ArrowRightLeft, UserPlus, UserMinus, Wrench, 
  RefreshCw, AlertCircle, CheckCircle, Loader2,
  Download, Filter, Search, Eye
} from "lucide-react"
import { toast } from "sonner"

interface BedHistoryEntry {
  id: string
  timestamp: string
  eventType: 'admission' | 'discharge' | 'transfer_in' | 'transfer_out' | 'maintenance_start' | 'maintenance_end' | 'cleaning' | 'status_change' | 'reservation'
  patientName?: string
  patientMRN?: string
  staffMember: string
  staffRole: string
  fromBed?: string
  toBed?: string
  notes?: string
  duration?: number // in minutes
  details?: Record<string, any>
}

interface BedHistoryModalProps {
  bed: any
  isOpen: boolean
  onClose: () => void
}

export function BedHistoryModal({ bed, isOpen, onClose }: BedHistoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<BedHistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<BedHistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("")
  const [dateRangeFilter, setDateRangeFilter] = useState("")
  const [selectedEntry, setSelectedEntry] = useState<BedHistoryEntry | null>(null)

  // Mock history data
  const mockHistory: BedHistoryEntry[] = [
    {
      id: "1",
      timestamp: "2025-11-24T14:30:00Z",
      eventType: "admission",
      patientName: "John Smith",
      patientMRN: "MRN-12345",
      staffMember: "Nurse Johnson",
      staffRole: "Registered Nurse",
      notes: "Patient admitted from Emergency Department",
      details: {
        admissionType: "Emergency",
        condition: "Stable",
        assignedDoctor: "Dr. Wilson"
      }
    },
    {
      id: "2",
      timestamp: "2025-11-24T10:15:00Z",
      eventType: "cleaning",
      staffMember: "Maria Garcia",
      staffRole: "Housekeeping",
      notes: "Deep cleaning completed after discharge",
      duration: 45,
      details: {
        cleaningType: "Terminal cleaning",
        disinfectionLevel: "High"
      }
    },
    {
      id: "3",
      timestamp: "2025-11-24T08:45:00Z",
      eventType: "discharge",
      patientName: "Sarah Wilson",
      patientMRN: "MRN-11223",
      staffMember: "Dr. Brown",
      staffRole: "Attending Physician",
      notes: "Patient discharged home in stable condition",
      details: {
        dischargeType: "Home",
        followUpRequired: true,
        followUpDate: "2025-11-30"
      }
    },
    {
      id: "4",
      timestamp: "2025-11-23T16:20:00Z",
      eventType: "transfer_in",
      patientName: "Sarah Wilson",
      patientMRN: "MRN-11223",
      staffMember: "Nurse Davis",
      staffRole: "Charge Nurse",
      fromBed: "ICU-205",
      notes: "Transfer from ICU for step-down care",
      details: {
        transferReason: "Condition improved",
        newDoctor: "Dr. Brown"
      }
    },
    {
      id: "5",
      timestamp: "2025-11-22T14:00:00Z",
      eventType: "maintenance_start",
      staffMember: "Tech Support",
      staffRole: "Biomedical Technician",
      notes: "Bed frame repair - loose side rail",
      duration: 120,
      details: {
        maintenanceType: "Repair",
        equipmentAffected: "Side rail mechanism",
        priority: "Medium"
      }
    },
    {
      id: "6",
      timestamp: "2025-11-22T12:00:00Z",
      eventType: "maintenance_end",
      staffMember: "Tech Support",
      staffRole: "Biomedical Technician",
      notes: "Bed frame repair completed successfully",
      details: {
        maintenanceType: "Repair",
        outcome: "Successful",
        testingCompleted: true
      }
    },
    {
      id: "7",
      timestamp: "2025-11-21T09:30:00Z",
      eventType: "reservation",
      patientName: "Michael Chen",
      patientMRN: "MRN-33445",
      staffMember: "Dr. Anderson",
      staffRole: "Surgeon",
      notes: "Bed reserved for post-operative recovery",
      details: {
        reservationType: "Surgery recovery",
        surgeryDate: "2025-11-22",
        estimatedStay: "2-3 days"
      }
    }
  ]

  // Load history when modal opens
  useEffect(() => {
    if (isOpen) {
      loadBedHistory()
    }
  }, [isOpen])

  // Filter history based on search and filters
  useEffect(() => {
    let filtered = history

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.patientMRN?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.staffMember.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Event type filter
    if (eventTypeFilter) {
      filtered = filtered.filter(entry => entry.eventType === eventTypeFilter)
    }

    // Date range filter
    if (dateRangeFilter) {
      const now = new Date()
      let cutoffDate = new Date()
      
      switch (dateRangeFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3)
          break
      }
      
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoffDate)
    }

    setFilteredHistory(filtered)
  }, [history, searchQuery, eventTypeFilter, dateRangeFilter])

  const loadBedHistory = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      setHistory(mockHistory)
    } catch (error) {
      toast.error("Failed to load bed history")
    } finally {
      setLoading(false)
    }
  }

  const exportHistory = () => {
    // Create CSV content
    const headers = ['Timestamp', 'Event Type', 'Patient', 'MRN', 'Staff Member', 'Role', 'Notes', 'Duration (min)']
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(entry => [
        new Date(entry.timestamp).toLocaleString(),
        getEventTypeLabel(entry.eventType),
        entry.patientName || '',
        entry.patientMRN || '',
        entry.staffMember,
        entry.staffRole,
        `"${entry.notes || ''}"`,
        entry.duration || ''
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bed-${bed?.bedNumber}-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success("History exported successfully")
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels = {
      admission: 'Patient Admission',
      discharge: 'Patient Discharge',
      transfer_in: 'Transfer In',
      transfer_out: 'Transfer Out',
      maintenance_start: 'Maintenance Started',
      maintenance_end: 'Maintenance Completed',
      cleaning: 'Cleaning',
      status_change: 'Status Change',
      reservation: 'Bed Reservation'
    }
    return labels[eventType as keyof typeof labels] || eventType
  }

  const getEventIcon = (eventType: string) => {
    const icons = {
      admission: UserPlus,
      discharge: UserMinus,
      transfer_in: ArrowRightLeft,
      transfer_out: ArrowRightLeft,
      maintenance_start: Wrench,
      maintenance_end: CheckCircle,
      cleaning: RefreshCw,
      status_change: Activity,
      reservation: Clock
    }
    return icons[eventType as keyof typeof icons] || Activity
  }

  const getEventColor = (eventType: string) => {
    const colors = {
      admission: 'text-green-600 bg-green-50 border-green-200',
      discharge: 'text-blue-600 bg-blue-50 border-blue-200',
      transfer_in: 'text-purple-600 bg-purple-50 border-purple-200',
      transfer_out: 'text-purple-600 bg-purple-50 border-purple-200',
      maintenance_start: 'text-orange-600 bg-orange-50 border-orange-200',
      maintenance_end: 'text-green-600 bg-green-50 border-green-200',
      cleaning: 'text-blue-600 bg-blue-50 border-blue-200',
      status_change: 'text-gray-600 bg-gray-50 border-gray-200',
      reservation: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    return colors[eventType as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diffMs = now.getTime() - eventTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Bed History - {bed?.bedNumber}
          </DialogTitle>
          <DialogDescription>
            Complete audit trail of all bed activities and patient movements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bed Information */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Bed {bed?.bedNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bed?.department} • Floor {bed?.floor} • {bed?.bedType} bed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredHistory.length} events
                  </Badge>
                  <Button variant="outline" size="sm" onClick={exportHistory}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-64 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient, staff, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Events</SelectItem>
                    <SelectItem value="admission">Admissions</SelectItem>
                    <SelectItem value="discharge">Discharges</SelectItem>
                    <SelectItem value="transfer_in">Transfers In</SelectItem>
                    <SelectItem value="transfer_out">Transfers Out</SelectItem>
                    <SelectItem value="maintenance_start">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="reservation">Reservations</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || eventTypeFilter || dateRangeFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setEventTypeFilter("")
                      setDateRangeFilter("")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading bed history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No history entries found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || eventTypeFilter || dateRangeFilter 
                  ? "Try adjusting your filters" 
                  : "No activities have been recorded for this bed yet"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((entry, index) => {
                const EventIcon = getEventIcon(entry.eventType)
                const isLast = index === filteredHistory.length - 1
                
                return (
                  <div key={entry.id} className="relative">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-border"></div>
                    )}
                    
                    <Card className="ml-0 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedEntry(entry)}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          {/* Event Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getEventColor(entry.eventType)}`}>
                            <EventIcon className="w-5 h-5" />
                          </div>
                          
                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">
                                    {getEventTypeLabel(entry.eventType)}
                                  </h4>
                                  {entry.duration && (
                                    <Badge variant="outline" className="text-xs">
                                      {formatDuration(entry.duration)}
                                    </Badge>
                                  )}
                                </div>
                                
                                {entry.patientName && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {entry.patientName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-foreground">
                                      {entry.patientName}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {entry.patientMRN}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <User className="w-4 h-4" />
                                  <span>{entry.staffMember}</span>
                                  <span>•</span>
                                  <span>{entry.staffRole}</span>
                                </div>
                                
                                {entry.notes && (
                                  <p className="text-sm text-foreground mb-2">
                                    {entry.notes}
                                  </p>
                                )}
                                
                                {(entry.fromBed || entry.toBed) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    {entry.fromBed && <span>From: {entry.fromBed}</span>}
                                    {entry.fromBed && entry.toBed && <span>→</span>}
                                    {entry.toBed && <span>To: {entry.toBed}</span>}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <p className="text-sm font-medium text-foreground">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getTimeAgo(entry.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Entry Details Modal */}
        {selectedEntry && (
          <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Event Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Event Type</Label>
                    <p className="text-sm text-foreground">{getEventTypeLabel(selectedEntry.eventType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Timestamp</Label>
                    <p className="text-sm text-foreground">{new Date(selectedEntry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedEntry.patientName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Patient</Label>
                      <p className="text-sm text-foreground">{selectedEntry.patientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">MRN</Label>
                      <p className="text-sm text-foreground">{selectedEntry.patientMRN}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Staff Member</Label>
                    <p className="text-sm text-foreground">{selectedEntry.staffMember}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <p className="text-sm text-foreground">{selectedEntry.staffRole}</p>
                  </div>
                </div>
                
                {selectedEntry.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-foreground">{selectedEntry.notes}</p>
                  </div>
                )}
                
                {selectedEntry.duration && (
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm text-foreground">{formatDuration(selectedEntry.duration)}</p>
                  </div>
                )}
                
                {selectedEntry.details && Object.keys(selectedEntry.details).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Additional Details</Label>
                    <div className="bg-muted rounded-lg p-3 mt-1">
                      {Object.entries(selectedEntry.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="text-sm text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="text-sm text-foreground">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}