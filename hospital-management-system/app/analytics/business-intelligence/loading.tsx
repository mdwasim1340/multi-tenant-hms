"use client"

import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

export default function BusinessIntelligenceLoading() {
  const [sidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={() => {}} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="h-10 bg-muted rounded-lg animate-pulse w-1/3" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="h-6 bg-muted rounded-lg animate-pulse mb-4" />
                    <div className="h-8 bg-muted rounded-lg animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="h-64 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
