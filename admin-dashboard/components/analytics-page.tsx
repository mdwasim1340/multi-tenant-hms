"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Users, Activity, Zap } from "lucide-react"

const analyticsData = [
  { date: "Jun 1", requests: 2400, users: 1200, errors: 24 },
  { date: "Jun 2", requests: 2210, users: 1390, errors: 22 },
  { date: "Jun 3", requests: 2290, users: 980, errors: 29 },
  { date: "Jun 4", requests: 2000, users: 1800, errors: 20 },
  { date: "Jun 5", requests: 2181, users: 1890, errors: 18 },
  { date: "Jun 6", requests: 2500, users: 2390, errors: 25 },
  { date: "Jun 7", requests: 2100, users: 2100, errors: 21 },
]

const apiUsageData = [
  { endpoint: "/api/users", calls: 4500, avgTime: 145 },
  { endpoint: "/api/tenants", calls: 3200, avgTime: 98 },
  { endpoint: "/api/storage", calls: 2800, avgTime: 234 },
  { endpoint: "/api/analytics", calls: 2100, avgTime: 567 },
  { endpoint: "/api/auth", calls: 1900, avgTime: 89 },
]

const metricsData = [
  { label: "Total Requests", value: "15.2M", change: "+12.5%", icon: Activity },
  { label: "Active Sessions", value: "8,392", change: "+8.2%", icon: Users },
  { label: "API Uptime", value: "99.98%", change: "+0.02%", icon: Zap },
  { label: "Avg Response Time", value: "145ms", change: "-5.3%", icon: TrendingUp },
]

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
        <p className="text-muted-foreground mt-1">System performance and usage analytics</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">{metric.label}</CardTitle>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{metric.value}</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">{metric.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Request Trends */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Request Trends</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
              <XAxis
                dataKey="date"
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
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#a78bfa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRequests)"
                name="Requests"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Top API Endpoints</CardTitle>
          <CardDescription>Most used endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={apiUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
              <XAxis
                dataKey="endpoint"
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
                cursor={{ fill: "hsl(var(--color-muted))" }}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--color-foreground))", paddingTop: "20px" }} iconType="square" />
              <Bar dataKey="calls" fill="#a78bfa" name="API Calls" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed API Stats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">API Performance Details</CardTitle>
          <CardDescription>Endpoint statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Endpoint</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Calls</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Avg Response Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiUsageData.map((api) => (
                  <tr key={api.endpoint} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{api.endpoint}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{api.calls.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{api.avgTime}ms</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                        Healthy
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
