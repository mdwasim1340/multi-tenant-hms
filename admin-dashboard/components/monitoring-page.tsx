"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AlertCircle, CheckCircle, Clock, Zap, Database, Server } from "lucide-react"

const systemHealthData = [
  { time: "00:00", cpu: 45, memory: 62, disk: 58 },
  { time: "04:00", cpu: 52, memory: 68, disk: 60 },
  { time: "08:00", cpu: 48, memory: 65, disk: 59 },
  { time: "12:00", cpu: 65, memory: 75, disk: 65 },
  { time: "16:00", cpu: 72, memory: 82, disk: 70 },
  { time: "20:00", cpu: 58, memory: 70, disk: 62 },
  { time: "24:00", cpu: 50, memory: 65, disk: 60 },
]

const servicesData = [
  { name: "API Server", status: "healthy", uptime: "99.98%", responseTime: "145ms", icon: Server },
  { name: "Database", status: "healthy", uptime: "99.99%", responseTime: "12ms", icon: Database },
  { name: "Cache Server", status: "healthy", uptime: "99.95%", responseTime: "5ms", icon: Zap },
  { name: "Message Queue", status: "healthy", uptime: "99.97%", responseTime: "8ms", icon: Clock },
]

const alertsData = [
  { id: 1, severity: "warning", title: "High CPU Usage", message: "CPU usage exceeded 80%", time: "2 hours ago" },
  {
    id: 2,
    severity: "info",
    title: "Backup Completed",
    message: "Daily backup completed successfully",
    time: "4 hours ago",
  },
  { id: 3, severity: "warning", title: "Memory Pressure", message: "Memory usage at 82%", time: "6 hours ago" },
  {
    id: 4,
    severity: "success",
    title: "System Recovered",
    message: "System recovered from temporary issue",
    time: "8 hours ago",
  },
]

export function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
        <p className="text-muted-foreground mt-1">Real-time system health and performance metrics</p>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {servicesData.map((service) => {
          const Icon = service.icon
          return (
            <Card key={service.name} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">{service.name}</CardTitle>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">{service.status}</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Uptime: {service.uptime}</p>
                  <p>Response: {service.responseTime}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Resources */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">System Resources</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={systemHealthData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
              <XAxis
                dataKey="time"
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
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#a78bfa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCpu)"
                name="CPU %"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#60a5fa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMemory)"
                name="Memory %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">System Alerts</CardTitle>
          <CardDescription>Recent system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertsData.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {alert.severity === "warning" ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  ) : alert.severity === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
