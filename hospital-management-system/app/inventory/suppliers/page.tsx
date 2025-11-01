"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Phone, Mail, MapPin } from "lucide-react"

export default function SupplierManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const suppliers = [
    {
      id: "SUP001",
      name: "MedSupply Co.",
      category: "Medical Supplies",
      contact: "+1 (555) 123-4567",
      email: "sales@medsupply.com",
      location: "New York, NY",
      status: "Active",
      rating: 4.8,
    },
    {
      id: "SUP002",
      name: "PharmaCare Inc.",
      category: "Pharmaceuticals",
      contact: "+1 (555) 234-5678",
      email: "orders@pharmacare.com",
      location: "Boston, MA",
      status: "Active",
      rating: 4.6,
    },
    {
      id: "SUP003",
      name: "Equipment Plus",
      category: "Medical Equipment",
      contact: "+1 (555) 345-6789",
      email: "support@equipmentplus.com",
      location: "Chicago, IL",
      status: "Inactive",
      rating: 4.2,
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
                <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
                <p className="text-muted-foreground mt-1">Manage vendor and supplier information</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{supplier.name}</h3>
                        <Badge className="mb-4">{supplier.category}</Badge>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold text-foreground">{supplier.contact}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold text-foreground text-xs">{supplier.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold text-foreground">{supplier.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="outline">{supplier.status}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <p className="font-semibold text-foreground">{supplier.rating}/5.0</p>
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
