'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDashboardAnalytics,
  usePatientAnalytics,
  useClinicalAnalytics,
  useFinancialAnalytics,
  useOperationalAnalytics,
} from '@/hooks/use-analytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { analytics: dashboard, loading: dashboardLoading } =
    useDashboardAnalytics();
  const { analytics: patient, loading: patientLoading } = usePatientAnalytics();
  const { analytics: clinical, loading: clinicalLoading } =
    useClinicalAnalytics();
  const { analytics: financial, loading: financialLoading } =
    useFinancialAnalytics();
  const { analytics: operational, loading: operationalLoading } =
    useOperationalAnalytics();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: sidebarOpen ? '256px' : '80px' }}
      >
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights and business intelligence
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="clinical">Clinical</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="operational">Operational</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Total Patients
                              </p>
                              <p className="text-2xl font-bold">
                                {dashboard?.total_patients || 0}
                              </p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500 opacity-20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Active Patients
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {dashboard?.active_patients || 0}
                              </p>
                            </div>
                            <Activity className="w-8 h-8 text-green-600 opacity-20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Appointments
                              </p>
                              <p className="text-2xl font-bold">
                                {dashboard?.total_appointments || 0}
                              </p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-500 opacity-20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Revenue
                              </p>
                              <p className="text-2xl font-bold text-accent">
                                ${dashboard?.total_revenue?.toLocaleString() || 0}
                              </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-accent opacity-20" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Patient Growth Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                              data={patient?.trends || []}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="new_patients"
                                stroke="#8884d8"
                                name="New Patients"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Department Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={clinical?.departments || []}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="department" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar
                                dataKey="total_visits"
                                fill="#8884d8"
                                name="Total Visits"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Patient Analytics Tab */}
              <TabsContent value="patients" className="space-y-6">
                {patientLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Patient Demographics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={patient?.demographics || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => entry.name}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {(patient?.demographics || []).map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Age Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={patient?.age_distribution || []}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="age_group" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Clinical Analytics Tab */}
              <TabsContent value="clinical" className="space-y-6">
                {clinicalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Clinical Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Total Visits
                          </p>
                          <p className="text-2xl font-bold">
                            {clinical?.total_visits || 0}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Unique Patients
                          </p>
                          <p className="text-2xl font-bold">
                            {clinical?.unique_patients || 0}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Avg Visit Duration
                          </p>
                          <p className="text-2xl font-bold">
                            {clinical?.avg_visit_duration || 0} min
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Financial Analytics Tab */}
              <TabsContent value="financial" className="space-y-6">
                {financialLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={financial?.revenue_trends || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              stroke="#82ca9d"
                              name="Revenue"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Financial Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">
                              Total Revenue
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              ${financial?.total_revenue?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">
                              Total Invoices
                            </span>
                            <span className="text-lg font-bold">
                              {financial?.invoice_count || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">
                              Avg Invoice Amount
                            </span>
                            <span className="text-lg font-bold">
                              ${financial?.avg_invoice_amount?.toFixed(2) || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Operational Analytics Tab */}
              <TabsContent value="operational" className="space-y-6">
                {operationalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Bed Occupancy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-accent">
                            {operational?.bed_occupancy_rate || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Current Occupancy Rate
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Staff Utilization</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-blue-600">
                            {operational?.staff_utilization_rate || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Average Utilization
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Equipment Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-green-600">
                            {operational?.equipment_usage_rate || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Equipment Utilization
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
