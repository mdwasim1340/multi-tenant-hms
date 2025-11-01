"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Users, Wrench } from "lucide-react"

export default function ResourceScheduling() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("rooms")

  const rooms = [
    { id: "R301", name: "Consultation Room 301", capacity: 2, status: "Available", nextBooking: "11:00 AM" },
    { id: "R302", name: "Consultation Room 302", capacity: 2, status: "Occupied", nextBooking: "2:30 PM" },
    { id: "R303", name: "Procedure Room 303", capacity: 4, status: "Available", nextBooking: "1:00 PM" },
  ]

  const equipment = [
    {
      id: "E001",
      name: "Ultrasound Machine",
      location: "Room 301",
      status: "Available",
      lastMaintenance: "2024-10-15",
    },
    { id: "E002", name: "ECG Monitor", location: "Room 302", status: "In Use", lastMaintenance: "2024-10-10" },
    {
      id: "E003",
      name: "Blood Pressure Monitor",
      location: "Room 303",
      status: "Available",
      lastMaintenance: "2024-10-18",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Resource Scheduling</h1>
              <p className="text-muted-foreground mt-1">Manage rooms and equipment availability</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
              </TabsList>

              <TabsContent value="rooms" className="space-y-4 mt-6">
                {rooms.map((room) => (
                  <Card key={room.id} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-accent" />
                            <h3 className="font-semibold text-foreground">{room.name}</h3>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Capacity</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="w-4 h-4" />
                                <p className="font-semibold text-foreground">{room.capacity}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className="mt-1">{room.status}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Next Booking</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-4 h-4" />
                                <p className="font-semibold text-foreground">{room.nextBooking}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4 mt-6">
                {equipment.map((item) => (
                  <Card key={item.id} className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-accent" />
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="font-semibold text-foreground">{item.location}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className="mt-1">{item.status}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Last Maintenance</p>
                              <p className="font-semibold text-foreground text-xs">{item.lastMaintenance}</p>
                            </div>
                          </div>
                        </div>
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
