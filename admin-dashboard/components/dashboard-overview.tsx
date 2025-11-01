"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
} from "recharts"
import { ArrowUp, ArrowDown, Users, Building2, HardDrive, AlertCircle } from "lucide-react"

const statsData = [
  { label: "Total Tenants", value: "1,248", change: "+12.5%", icon: Building2, trend: "up" },
  { label: "Active Users", value: "8,392", change: "+8.2%", icon: Users, trend: "up" },
  { label: "Storage Used", value: "2.4 TB", change: "+5.1%", icon: HardDrive, trend: "up" },
  { label: "System Health", value: "99.8%", change: "-0.2%", icon: AlertCircle, trend: "down" },
]

const tenantGrowthData = [
  { month: "Jan", tenants: 450, users: 2100 },
  { month: "Feb", tenants: 520, users: 2400 },
  { month: "Mar", tenants: 680, users: 3200 },
  { month: "Apr", tenants: 890, users: 4100 },
  { month: "May", tenants: 1050, users: 5200 },
  { month: "Jun", tenants: 1248, users: 8392 },
]

const storageData = [
  { name: "Documents", value: 45, fill: "#8b5cf6" },
  { name: "Media", value: 30, fill: "#06b6d4" },
  { name: "Database", value: 15, fill: "#10b981" },
  { name: "Other", value: 10, fill: "#f59e0b" },
]

const recentActivityData = [
  { id: 1, action: "New tenant registered", tenant: "Acme Corp", time: "2 hours ago", status: "success" },
  { id: 2, action: "User role updated", user: "john@example.com", time: "4 hours ago", status: "info" },
  { id: 3, action: "Storage limit exceeded", tenant: "Tech Startup Inc", time: "6 hours ago", status: "warning" },
  { id: 4, action: "System backup completed", time: "8 hours ago", status: "success" },
  { id: 5, action: "API rate limit triggered", tenant: "Global Solutions", time: "10 hours ago", status: "warning" },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.trend === "up"
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">{stat.label}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                <div
                  className={`flex items-center gap-1 text-xs mt-2 ${isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                >
                  {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Tenant & User Growth</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--color-foreground))"
                  tick={{ fill: "hsl(var(--color-foreground))", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--color-foreground))"
                  tick={{ fill: "hsl(var(--color-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--color-card))",
                    border: "2px solid hsl(var(--color-border))",
                    borderRadius: "8px",
                    color: "hsl(var(--color-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--color-foreground))" }}
                  cursor={{ stroke: "hsl(var(--color-foreground))" }}
                />
                <Legend wrapperStyle={{ color: "hsl(var(--color-foreground))", paddingTop: "20px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="tenants"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  dot={{ fill: "#a78bfa", r: 4 }}
                  name="Tenants"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  dot={{ fill: "#60a5fa", r: 4 }}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Storage Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Storage Distribution</CardTitle>
            <CardDescription>2.4 TB total</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {storageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--color-card))",
                    border: "2px solid hsl(var(--color-border))",
                    borderRadius: "8px",
                    color: "hsl(var(--color-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--color-foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivityData.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {"tenant" in activity ? activity.tenant : "user" in activity ? activity.user : activity.time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      activity.status === "success"
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : activity.status === "warning"
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
