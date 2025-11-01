"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, Trash2, Share2 } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

const storageStats = [
  { label: "Total Storage", value: "2.4 TB", used: "1.8 TB", percentage: 75 },
  { label: "Documents", value: "1.2 TB", used: "0.9 TB", percentage: 75 },
  { label: "Media", value: "0.8 TB", used: "0.6 TB", percentage: 75 },
  { label: "Database", value: "0.4 TB", used: "0.3 TB", percentage: 75 },
]

const storageByTenant = [
  { tenant: "Acme Corp", used: 450, limit: 500 },
  { tenant: "Tech Startup", used: 280, limit: 300 },
  { tenant: "Global Solutions", used: 620, limit: 700 },
  { tenant: "Innovation Labs", used: 120, limit: 200 },
  { tenant: "Digital Ventures", used: 330, limit: 400 },
]

const filesData = [
  { id: 1, name: "Q4_Financial_Report.pdf", size: "2.4 MB", tenant: "Acme Corp", type: "PDF", date: "2024-06-15" },
  {
    id: 2,
    name: "Marketing_Campaign_2024.pptx",
    size: "5.8 MB",
    tenant: "Tech Startup",
    type: "Presentation",
    date: "2024-06-14",
  },
  {
    id: 3,
    name: "Product_Demo_Video.mp4",
    size: "245 MB",
    tenant: "Global Solutions",
    type: "Video",
    date: "2024-06-13",
  },
  {
    id: 4,
    name: "Database_Backup_June.sql",
    size: "1.2 GB",
    tenant: "Digital Ventures",
    type: "Database",
    date: "2024-06-12",
  },
  {
    id: 5,
    name: "Team_Photos_Archive.zip",
    size: "450 MB",
    tenant: "Innovation Labs",
    type: "Archive",
    date: "2024-06-11",
  },
]

export function StoragePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">File Storage Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage storage across all tenants</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {storageStats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.used}</div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${stat.percentage}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">of {stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage by Tenant */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Storage by Tenant</CardTitle>
          <CardDescription>Usage across all tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storageByTenant}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
              <XAxis
                dataKey="tenant"
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
              <Bar dataKey="used" fill="#a78bfa" name="Used (GB)" />
              <Bar dataKey="limit" fill="#60a5fa" name="Limit (GB)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Files */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Files</CardTitle>
          <CardDescription>Latest uploaded files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">File Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Size</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Tenant</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filesData.map((file) => (
                  <tr key={file.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{file.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{file.size}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{file.tenant}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {file.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{file.date}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
