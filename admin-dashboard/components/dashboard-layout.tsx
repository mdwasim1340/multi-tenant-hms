"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Bell,
  HardDrive,
  BarChart3,
  Activity,
  Menu,
  X,
  Settings,
  LogOut,
  ChevronDown,
  Mail,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [communicationsOpen, setCommunicationsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isAdmin = user?.signInUserSession?.accessToken?.payload['cognito:groups']?.includes('admin');

  const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tenants", label: "Tenants", icon: Building2 },
    { href: "/users", label: "Users", icon: Users },
    { href: "/roles", label: "Roles", icon: Shield },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/storage", label: "File Storage", icon: HardDrive },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/monitoring", label: "System Monitor", icon: Activity },
  ]

  const communicationSubmenus = [
    { href: "/communications/email", label: "Email", icon: Mail },
    { href: "/communications/sms", label: "SMS", icon: MessageSquare },
    { href: "/communications/notifications", label: "Notifications", icon: Bell },
  ]

  const isCommActive = pathname.startsWith("/communications")

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">AD</span>
              </div>
              <span className="text-sidebar-foreground font-bold text-lg">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-2 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-sidebar">
          {menuItems.filter(item => item.href !== '/tenants' || isAdmin).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Button>
              </Link>
            )
          })}

          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={() => setCommunicationsOpen(!communicationsOpen)}
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                isCommActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
              )}
            >
              <Mail className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="truncate">Communications</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 ml-auto flex-shrink-0 transition-transform duration-300",
                      communicationsOpen && "rotate-180",
                    )}
                  />
                </>
              )}
            </Button>

            {communicationsOpen && sidebarOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-sidebar-accent pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {communicationSubmenus.map((submenu) => {
                  const SubIcon = submenu.icon
                  const isSubActive = pathname === submenu.href
                  return (
                    <Link key={submenu.href} href={submenu.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent text-sm transition-colors",
                          isSubActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{submenu.label}</span>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-2 space-y-2 flex-shrink-0">
          <Link href="/settings">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Settings</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300 flex flex-col", sidebarOpen ? "ml-64" : "ml-20")}>
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="icon" className="relative bg-transparent">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="relative bg-transparent">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">JD</span>
                </div>
              </Button>
            </Link>
            <div className="hidden sm:block pl-4 border-l border-border">
              <p className="text-sm font-medium text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </header>

        {/* Page Content */}
        <div className="overflow-auto flex-1">
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
