"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function PatientReferrals() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  const referrals = [
    {
      id: "REF001",
      patient: "Sarah Johnson",
      referredTo: "Cardiology",
      referredBy: "Dr. Wilson",
      date: "2024-10-20",
      status: "Pending",
      priority: "High",
      reason: "Chest pain evaluation",
    },
    {
      id: "REF002",
      patient: "Michael Chen",
      referredTo: "Orthopedics",
      referredBy: "Dr. Rodriguez",
      date: "2024-10-18",
      status: "Accepted",
      priority: "Medium",
      reason: "Knee injury assessment",
    },
    {
      id: "REF003",
      patient: "Emma Williams",
      referredTo: "Neurology",
      referredBy: "Dr. Park",
      date: "2024-10-15",
      status: "Completed",
      priority: "Low",
      reason: "Headache management",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "Accepted":
        return <AlertCircle className="w-4 h-4 text-blue-600" />
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return null
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
                <h1 className="text-3xl font-bold text-foreground">Patient Referrals</h1>
                <p className="text-muted-foreground mt-1">Manage patient referrals to specialists</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Referral
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {referrals
                  .filter((r) => r.status === "Pending")
                  .map((referral) => (
                    <Card key={referral.id} className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(referral.status)}
                              <h3 className="font-semibold text-foreground">{referral.patient}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{referral.reason}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Referred To</p>
                                <p className="font-semibold text-foreground">{referral.referredTo}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Referred By</p>
                                <p className="font-semibold text-foreground">{referral.referredBy}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="font-semibold text-foreground">{referral.date}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Priority</p>
                                <Badge className="mt-1">{referral.priority}</Badge>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="all" className="space-y-4 mt-6">
                {referrals.map((referral) => (
                  <Card key={referral.id} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(referral.status)}
                            <h3 className="font-semibold text-foreground">{referral.patient}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{referral.reason}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Referred To</p>
                              <p className="font-semibold text-foreground">{referral.referredTo}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Referred By</p>
                              <p className="font-semibold text-foreground">{referral.referredBy}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold text-foreground">{referral.date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className="mt-1">{referral.status}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
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
