"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Search, User, Settings, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"

interface TopBarProps {
  sidebarOpen: boolean
}

export function TopBar({ sidebarOpen }: TopBarProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleDarkMode = () => {
    const html = document.documentElement
    html.classList.toggle("dark")
    setIsDark(!isDark)
    localStorage.setItem("theme", isDark ? "light" : "dark")
  }

  return (
    <header
      className="fixed top-0 right-0 left-0 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-30"
      style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients, appointments..."
            className="pl-10 bg-muted/50 border-border/50 focus:border-primary"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
