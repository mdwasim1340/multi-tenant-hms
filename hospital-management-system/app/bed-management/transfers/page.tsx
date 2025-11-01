"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowRightLeft } from "lucide-react"

export default function BedTransfers() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const transfers = [
    {
      id: "BT001",
      patient: "Sarah Johnson",
      fromBed: "B301",
      toBed: "B305",
      fromDept: "Cardiology",
      toDept: "Cardiology",
      date: "2024-10-20",
      reason: "Bed upgrade for better monitoring",
      status: "Completed",
    },
    {
      id: "BT002",
      patient: "Michael Chen",
      fromBed: "B401",
      toBed: "B302",
      fromDept: "ICU",
      toDept: "Cardiology",
      date: "2024-10-19",
      reason: "Step-down care",
      status: "In Progress",
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
                <h1 className="text-3xl font-bold text-foreground">Bed Transfers</h1>
                <p className="text-muted-foreground mt-1">Manage bed transfers between departments</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Transfer
              </Button>
            </div>

            <div className="space-y-4">
              {transfers.map((transfer) => (
                <Card key={transfer.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-3">{transfer.patient}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{transfer.reason}</p>

                        <div className="flex items-center gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="font-semibold text-foreground">
                              {transfer.fromBed} ({transfer.fromDept})
                            </p>
                          </div>
                          <ArrowRightLeft className="w-5 h-5 text-accent" />
                          <div>
                            <p className="text-xs text-muted-foreground">To</p>
                            <p className="font-semibold text-foreground">
                              {transfer.toBed} ({transfer.toDept})
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-semibold text-foreground">{transfer.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="outline">{transfer.status}</Badge>
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
