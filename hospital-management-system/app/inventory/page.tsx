"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, AlertTriangle, TrendingDown, Zap, AlertCircle, Clock } from "lucide-react"

export default function Inventory() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("supplies")

  const supplies = [
    {
      id: "SUP001",
      name: "Surgical Gloves (Box)",
      category: "PPE",
      quantity: 45,
      minLevel: 50,
      status: "Low Stock",
      supplier: "MedSupply Co.",
      aiRecommendation: "Auto-reorder triggered - 100 units recommended",
    },
    {
      id: "SUP002",
      name: "IV Catheters",
      category: "Medical Supplies",
      quantity: 320,
      minLevel: 200,
      status: "Adequate",
      supplier: "HealthCare Plus",
      aiRecommendation: "Stock level optimal - No action needed",
    },
    {
      id: "SUP003",
      name: "Oxygen Tanks",
      category: "Equipment",
      quantity: 12,
      minLevel: 15,
      status: "Critical",
      supplier: "Gas Supply Inc.",
      aiRecommendation: "Emergency order recommended - 20 units",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "Adequate":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
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
                <h1 className="text-3xl font-bold text-foreground">Inventory Control</h1>
                <p className="text-muted-foreground mt-1">Supplies, equipment, and stock management</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Package className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                      <p className="text-2xl font-bold text-foreground">1,247</p>
                    </div>
                    <Package className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-600">23</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Critical Items</p>
                      <p className="text-2xl font-bold text-red-600">3</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Inventory Value</p>
                      <p className="text-2xl font-bold text-foreground">$487K</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-accent opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="supplies">Supplies</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
              </TabsList>

              {/* Supplies Tab */}
              <TabsContent value="supplies" className="space-y-4">
                {supplies.map((item) => (
                  <Card key={item.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Current Stock</p>
                              <p className="font-semibold text-foreground">{item.quantity} units</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Min Level</p>
                              <p className="font-semibold text-foreground">{item.minLevel} units</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Supplier</p>
                              <p className="font-semibold text-foreground">{item.supplier}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className={`mt-1 ${getStatusColor(item.status)}`}>{item.status}</Badge>
                            </div>
                          </div>

                          {/* AI Recommendation */}
                          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-accent mb-1">AI Recommendation</p>
                                <p className="text-sm text-foreground">{item.aiRecommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Equipment Tab */}
              <TabsContent value="equipment" className="space-y-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Equipment Maintenance Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">CT Scanner - Unit 1</h4>
                          <p className="text-sm text-muted-foreground">Last serviced: 2024-09-15</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                          Operational
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Next maintenance: 2024-12-15</span>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">MRI Machine - Unit 2</h4>
                          <p className="text-sm text-muted-foreground">Last serviced: 2024-08-20</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                          Maintenance Due
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span>Maintenance overdue - Schedule immediately</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Predictive Inventory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Forecast Insights</p>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <li>• Surgical gloves demand increasing 15% next month</li>
                          <li>• Seasonal demand spike predicted for Q4</li>
                          <li>• Recommend bulk ordering for cost savings</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-accent" />
                        Cost Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Potential Savings</span>
                        <span className="text-lg font-bold text-green-600">$12,450</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Waste Reduction</span>
                        <span className="text-lg font-bold text-accent">8.3%</span>
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
