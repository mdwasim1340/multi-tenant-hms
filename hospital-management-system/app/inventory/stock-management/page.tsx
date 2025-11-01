"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Plus, Zap } from "lucide-react"

export default function StockManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const inventory = [
    {
      id: "INV001",
      name: "Surgical Gloves (Box of 100)",
      sku: "SG-100-001",
      category: "PPE",
      currentStock: 450,
      minStock: 200,
      maxStock: 1000,
      unitCost: "$12.50",
      status: "Optimal",
      lastRestocked: "2024-10-18",
      aiPrediction: "Reorder in 8 days - Predicted usage: 150 units",
    },
    {
      id: "INV002",
      name: "Surgical Masks (Box of 50)",
      sku: "SM-50-001",
      category: "PPE",
      currentStock: 120,
      minStock: 200,
      maxStock: 800,
      unitCost: "$8.75",
      status: "Low Stock",
      lastRestocked: "2024-10-15",
      aiPrediction: "Order immediately - Stock will deplete in 3 days",
    },
    {
      id: "INV003",
      name: "IV Catheters (20G)",
      sku: "IV-20G-001",
      category: "Medical Supplies",
      currentStock: 850,
      minStock: 300,
      maxStock: 1500,
      unitCost: "$2.30",
      status: "Optimal",
      lastRestocked: "2024-10-20",
      aiPrediction: "Reorder in 15 days - Predicted usage: 200 units",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Optimal":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "Low Stock":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Overstock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
                <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
                <p className="text-muted-foreground mt-1">Manage inventory with AI-powered predictions</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Inventory Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-foreground mt-2">1,245</p>
                  <p className="text-xs text-muted-foreground mt-2">Across all categories</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">8</p>
                  <p className="text-xs text-muted-foreground mt-2">Require immediate action</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground mt-2">$125,450</p>
                  <p className="text-xs text-muted-foreground mt-2">Inventory value</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Waste This Month</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">$2,340</p>
                  <p className="text-xs text-muted-foreground mt-2">Expired items</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Status Tabs */}
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="optimal">Optimal</TabsTrigger>
                <TabsTrigger value="low">Low Stock</TabsTrigger>
                <TabsTrigger value="overstock">Overstock</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {inventory.map((item) => (
                  <Card key={item.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.sku}</p>
                            </div>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Current Stock</p>
                              <p className="font-semibold text-foreground">{item.currentStock}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Min/Max</p>
                              <p className="font-semibold text-foreground text-sm">
                                {item.minStock}/{item.maxStock}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Unit Cost</p>
                              <p className="font-semibold text-foreground">{item.unitCost}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Category</p>
                              <p className="font-semibold text-foreground text-sm">{item.category}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Last Restocked</p>
                              <p className="font-semibold text-foreground text-sm">{item.lastRestocked}</p>
                            </div>
                          </div>

                          {/* Stock Level Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Stock Level</span>
                              <span className="text-xs font-semibold text-foreground">
                                {Math.round((item.currentStock / item.maxStock) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(item.currentStock / item.maxStock) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* AI Prediction */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Prediction</p>
                                <p className="text-sm text-foreground">{item.aiPrediction}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
