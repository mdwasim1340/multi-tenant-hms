"use client"

import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card } from "@/components/ui/card"
import { useState } from "react"

export default function Loading() {
  const [sidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={() => {}} />
      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded-lg w-1/3 animate-pulse"></div>
              <div className="h-4 bg-muted rounded-lg w-1/2 animate-pulse"></div>
            </div>
            <Card className="h-32 bg-muted animate-pulse"></Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 bg-muted animate-pulse"></Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
