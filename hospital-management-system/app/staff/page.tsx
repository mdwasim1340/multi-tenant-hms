"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users2, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, Award, Loader2 } from "lucide-react"
import { useStaff } from "@/hooks/use-staff"
import { useDashboardAnalytics } from "@/hooks/use-analytics"
import { StaffList } from "@/components/staff/staff-list"
import { deleteStaff } from "@/lib/staff"
import { toast } from "sonner"

export default function StaffManagement() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("staff")
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    search: '',
    include_unverified: true, // Show all users by default
    verification_status: ''
  })

  // Use real API data
  const { staff, loading: staffLoading, error: staffError } = useStaff(filters)
  const { analytics, loading: analyticsLoading } = useDashboardAnalytics()

  // Log for debugging
  console.log('Staff data:', { staff, loading: staffLoading, error: staffError })
  console.log('Analytics data:', { analytics, loading: analyticsLoading })

  const handleAddStaff = () => {
    router.push('/staff/new')
  }

  const handleEdit = (id: number) => {
    router.push(`/staff/${id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id)
        toast.success('Staff member deleted successfully')
        window.location.reload()
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete staff member')
      }
    }
  }

  const handleViewSchedule = (id: number) => {
    toast.info('Schedule feature coming soon')
  }

  const handleViewPerformance = (id: number) => {
    toast.info('Performance feature coming soon')
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
                <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
                <p className="text-muted-foreground mt-1">Scheduling, performance, and credentials</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleAddStaff}>
                <Users2 className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Staff</p>
                      {analyticsLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{analytics?.total_staff || 0}</p>
                      )}
                    </div>
                    <Users2 className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active Staff</p>
                      {analyticsLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold text-green-600">{analytics?.active_staff || 0}</p>
                      )}
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">On Leave</p>
                      {analyticsLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold text-yellow-600">{analytics?.staff_on_leave || 0}</p>
                      )}
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Performance</p>
                      {analyticsLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold text-accent">
                          {analytics?.avg_performance_score?.toFixed(1) || 'N/A'}
                        </p>
                      )}
                    </div>
                    <Award className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="staff">Staff Directory</TabsTrigger>
                <TabsTrigger value="schedule">Scheduling</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Staff Directory Tab */}
              <TabsContent value="staff" className="space-y-4">
                {/* Filter Controls */}
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant={filters.include_unverified ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, include_unverified: !prev.include_unverified }))}
                        >
                          {filters.include_unverified ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Showing All Users
                            </>
                          ) : (
                            <>
                              <Users2 className="w-4 h-4 mr-2" />
                              Show All Users
                            </>
                          )}
                        </Button>
                        {filters.include_unverified && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant={filters.verification_status === 'verified' ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setFilters(prev => ({ 
                                ...prev, 
                                verification_status: prev.verification_status === 'verified' ? '' : 'verified' 
                              }))}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verified Only
                            </Button>
                            <Button
                              variant={filters.verification_status === 'pending' ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setFilters(prev => ({ 
                                ...prev, 
                                verification_status: prev.verification_status === 'pending' ? '' : 'pending' 
                              }))}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Pending Only
                            </Button>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {staff?.length || 0} {filters.include_unverified ? 'users' : 'staff members'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {staffLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <span className="ml-2 text-muted-foreground">Loading staff...</span>
                  </div>
                ) : staffError && staff.length === 0 ? (
                  <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-5 h-5" />
                          <p className="font-semibold">Error loading staff</p>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-200">{staffError}</p>
                        <div className="flex gap-2 mt-2">
                          {staffError.includes('authenticated') && (
                            <Button 
                              onClick={() => window.location.href = '/auth/login'}
                              className="w-fit"
                            >
                              Go to Login
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="w-fit"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : !staff || staff.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">No staff members yet</p>
                        <p className="text-muted-foreground mb-4">Get started by adding your first staff member</p>
                        <Button className="mt-4" onClick={handleAddStaff}>
                          <Users2 className="w-4 h-4 mr-2" />
                          Add First Staff Member
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <StaffList
                    staff={staff || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewSchedule={handleViewSchedule}
                    onViewPerformance={handleViewPerformance}
                  />
                )}
              </TabsContent>

              {/* Scheduling Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      Weekly Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                        <div key={day} className="border border-border rounded-lg p-4">
                          <p className="font-semibold text-foreground mb-3">{day}</p>
                          <div className="space-y-2 text-sm">
                            <div className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 rounded p-2">
                              <p className="font-semibold">8 AM - 4 PM</p>
                              <p className="text-xs">Dr. Rodriguez</p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 rounded p-2">
                              <p className="font-semibold">9 AM - 5 PM</p>
                              <p className="text-xs">Dr. Wilson</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent" />
                        Top Performers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Dr. Emily Rodriguez</span>
                        <span className="text-sm font-bold text-accent">4.8/5.0</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Nurse Lisa Park</span>
                        <span className="text-sm font-bold text-accent">4.7/5.0</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        Burnout Risk
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ High Risk Staff</p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          8 staff members showing burnout indicators - Recommend intervention
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
