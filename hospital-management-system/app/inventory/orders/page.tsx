"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Calendar, DollarSign } from "lucide-react"

export default function PurchaseOrders() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const orders = [
    {
      id: "PO001",
      orderNumber: "PO-2024-001",
      supplier: "MedSupply Co.",
      items: "Surgical Gloves (1000 boxes)",
      date: "2024-10-20",
      amount: "$5,000",
      status: "Delivered",
      dueDate: "2024-10-25",
    },
    {
      id: "PO002",
      orderNumber: "PO-2024-002",
      supplier: "PharmaCare Inc.",
      items: "Antibiotics (various)",
      date: "2024-10-18",
      amount: "$12,500",
      status: "In Transit",
      dueDate: "2024-10-28",
    },
    {
      id: "PO003",
      orderNumber: "PO-2024-003",
      supplier: "Equipment Plus",
      items: "Ultrasound Gel (50 bottles)",
      date: "2024-10-15",
      amount: "$1,200",
      status: "Pending",
      dueDate: "2024-10-30",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
                <p className="text-muted-foreground mt-1">Manage purchase orders and deliveries</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-accent" />
                          <h3 className="font-semibold text-foreground">{order.orderNumber}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{order.supplier}</p>
                        <p className="text-sm text-foreground mb-4">{order.items}</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Order Date</p>
                            <p className="font-semibold text-foreground">{order.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Due Date</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="w-4 h-4" />
                              <p className="font-semibold text-foreground">{order.dueDate}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <div className="flex items-center gap-1 mt-1">
                              <DollarSign className="w-4 h-4" />
                              <p className="font-semibold text-foreground">{order.amount}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
