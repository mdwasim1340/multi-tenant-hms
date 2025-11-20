"use client"
import Link from "next/link"
import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calendar,
  FileText,
  CreditCard,
  Package,
  Users2,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  UserCircle,
  Plus,
  FileCheck,
  Shield,
  Lock,
  FileJson,
  ChevronDown,
  BarChart3,
  Bell,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Pill,
  Wrench,
  Database,
  Eye,
  UserCheck,
  Clock,
  DollarSign,
  Receipt,
  Zap,
  Bed,
  Activity,
  ArrowRightLeft,
  Briefcase,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MenuItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  submenu?: MenuItem[]
}

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Patient Management",
      icon: Users,
      submenu: [
        {
          label: "Patient Directory",
          href: "/patient-management",
          icon: Users,
        },
        {
          label: "Register New Patient",
          href: "/patient-registration",
          icon: Plus,
        },
        {
          label: "Patient Records",
          href: "/patient-management/records",
          icon: FileText,
        },
        {
          label: "Patient Referrals",
          href: "/patient-management/referrals",
          icon: Stethoscope,
        },
        {
          label: "Patient Transfers",
          href: "/patient-management/transfers",
          icon: Users,
        },
      ],
    },
    {
      label: "Appointments",
      icon: Calendar,
      submenu: [
        {
          label: "Appointment Calendar",
          href: "/appointments",
          icon: Calendar,
        },
        {
          label: "Create Appointment",
          href: "/appointment-creation",
          icon: Plus,
        },
        {
          label: "Appointment Queue",
          href: "/appointments/queue",
          icon: Clock,
        },
        {
          label: "Resource Scheduling",
          href: "/appointments/resources",
          icon: Wrench,
        },
        {
          label: "Waitlist Management",
          href: "/appointments/waitlist",
          icon: ClipboardList,
        },
      ],
    },
    {
      label: "Bed Management",
      icon: Bed,
      submenu: [
        {
          label: "Bed Occupancy",
          href: "/bed-management",
          icon: Activity,
        },
        {
          label: "Bed Assignment",
          href: "/bed-management/assignment",
          icon: Bed,
        },
        {
          label: "Patient Transfers",
          href: "/bed-management/transfers",
          icon: ArrowRightLeft,
        },
      ],
    },
    {
      label: "Medical Records",
      icon: FileText,
      submenu: [
        {
          label: "Electronic Medical Records",
          href: "/emr",
          icon: FileText,
        },
        {
          label: "Clinical Notes",
          href: "/emr/clinical-notes",
          icon: FileText,
        },
        {
          label: "Lab Results",
          href: "/emr/lab-results",
          icon: Zap,
        },
        {
          label: "Imaging Reports",
          href: "/emr/imaging",
          icon: Eye,
        },
        {
          label: "Prescriptions",
          href: "/emr/prescriptions",
          icon: Pill,
        },
        {
          label: "Medical History",
          href: "/emr/history",
          icon: Clock,
        },
      ],
    },
    {
      label: "Billing & Finance",
      icon: CreditCard,
      submenu: [
        {
          label: "Billing Dashboard",
          href: "/billing",
          icon: CreditCard,
        },
        {
          label: "Manage Invoices",
          href: "/billing-management",
          icon: FileCheck,
        },
        {
          label: "Insurance Claims",
          href: "/billing/claims",
          icon: Receipt,
        },
        {
          label: "Payment Processing",
          href: "/billing/payments",
          icon: DollarSign,
        },
        {
          label: "Accounts Receivable",
          href: "/billing/receivables",
          icon: TrendingUp,
        },
        {
          label: "Financial Reports",
          href: "/billing/reports",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Staff Management",
      icon: Users2,
      submenu: [
        {
          label: "Staff Directory",
          href: "/staff",
          icon: Users2,
        },
        {
          label: "Scheduling",
          href: "/staff/scheduling",
          icon: Calendar,
        },
        {
          label: "Performance Reviews",
          href: "/staff/performance",
          icon: TrendingUp,
        },
        {
          label: "Credentials & Licenses",
          href: "/staff/credentials",
          icon: FileCheck,
        },
        {
          label: "Payroll",
          href: "/staff/payroll",
          icon: DollarSign,
        },
        {
          label: "Training & Development",
          href: "/staff/training",
          icon: Stethoscope,
        },
      ],
    },
    {
      label: "Workforce Management",
      icon: Briefcase,
      submenu: [
        {
          label: "Staffing Forecast",
          href: "/workforce-management/forecast",
          icon: TrendingUp,
        },
        {
          label: "AI Scheduling",
          href: "/workforce-management/scheduling",
          icon: Calendar,
        },
        {
          label: "Staff Analytics",
          href: "/workforce-management/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Pharmacy Management",
      icon: Pill,
      submenu: [
        {
          label: "Prescriptions",
          href: "/pharmacy-management/prescriptions",
          icon: Pill,
        },
        {
          label: "Inventory",
          href: "/pharmacy-management/inventory",
          icon: Package,
        },
        {
          label: "Drug Utilization",
          href: "/pharmacy-management/utilization",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Inventory & Supply",
      icon: Package,
      submenu: [
        {
          label: "Inventory Dashboard",
          href: "/inventory",
          icon: Package,
        },
        {
          label: "Stock Management",
          href: "/inventory/stock",
          icon: Package,
        },
        {
          label: "Equipment Maintenance",
          href: "/inventory/equipment",
          icon: Wrench,
        },
        {
          label: "Supplier Management",
          href: "/inventory/suppliers",
          icon: Users,
        },
        {
          label: "Purchase Orders",
          href: "/inventory/orders",
          icon: FileText,
        },
        {
          label: "Inventory Reports",
          href: "/inventory/reports",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Analytics & Reports",
      icon: BarChart3,
      submenu: [
        {
          label: "Dashboard Analytics",
          href: "/analytics/dashboard",
          icon: BarChart3,
        },
        {
          label: "Patient Analytics",
          href: "/analytics/patients",
          icon: Users,
        },
        {
          label: "Clinical Analytics",
          href: "/analytics/clinical",
          icon: Stethoscope,
        },
        {
          label: "Financial Analytics",
          href: "/analytics/financial",
          icon: DollarSign,
        },
        {
          label: "Operational Reports",
          href: "/analytics/operations",
          icon: Wrench,
        },
        {
          label: "Business Intelligence",
          href: "/analytics/business-intelligence",
          icon: Brain,
        },
        {
          label: "Custom Reports",
          href: "/analytics/custom",
          icon: FileText,
        },
      ],
    },
    {
      label: "Notifications & Alerts",
      icon: Bell,
      submenu: [
        {
          label: "Notification Center",
          href: "/notifications",
          icon: Bell,
        },
        {
          label: "Critical Alerts",
          href: "/notifications/critical",
          icon: AlertCircle,
        },
        {
          label: "System Alerts",
          href: "/notifications/system",
          icon: Zap,
        },
        {
          label: "Notification Settings",
          href: "/notifications/settings",
          icon: Settings,
        },
      ],
    },
  ]

  const adminMenuItems: MenuItem[] = [
    {
      label: "User Management",
      href: "/admin/user-management",
      icon: UserCheck,
    },
    {
      label: "Access Controls",
      href: "/admin/access-controls",
      icon: Lock,
    },
    {
      label: "System Settings",
      href: "/admin/system-settings",
      icon: Settings,
    },
    {
      label: "Audit Logs",
      href: "/admin/audit-logs",
      icon: FileJson,
    },
    {
      label: "Database Management",
      href: "/admin/database",
      icon: Database,
    },
    {
      label: "System Maintenance",
      href: "/admin/maintenance",
      icon: Wrench,
    },
  ]

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + "/")
    }
    if (item.submenu) {
      return item.submenu.some((subitem) => pathname === subitem.href || pathname.startsWith(subitem.href + "/"))
    }
    return false
  }

  const isAdminActive = adminMenuItems.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))

  const renderMenuItem = (item: MenuItem, isAdmin = false) => {
    const Icon = item.icon
    const isActive = isMenuActive(item)
    const isExpanded = expandedMenus.includes(item.label)
    const hasSubmenu = item.submenu && item.submenu.length > 0

    if (hasSubmenu) {
      return (
        <div key={item.label}>
          <Button
            variant="ghost"
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
              isActive && "bg-sidebar-primary/10 text-sidebar-primary font-semibold",
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && (
              <>
                <span className="text-sm flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
              </>
            )}
          </Button>

          {/* Submenu */}
          {isExpanded && isOpen && (
            <div className="ml-2 mt-1 space-y-1 border-l border-sidebar-border/50 pl-2">
              {item.submenu!.map((subitem) => {
                const SubIcon = subitem.icon
                const isSubActive = pathname === subitem.href || pathname.startsWith(subitem.href + "/")

                return (
                  <Link key={subitem.href} href={subitem.href!}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 text-xs text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
                        isSubActive && "bg-sidebar-primary/10 text-sidebar-primary font-semibold",
                      )}
                    >
                      <SubIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{subitem.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link key={item.href} href={item.href!}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
            isActive && "bg-sidebar-primary/10 text-sidebar-primary font-semibold",
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="text-sm">{item.label}</span>}
        </Button>
      </Link>
    )
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    localStorage.clear()
    sessionStorage.clear()

    router.push("/auth/login")
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col",
          isOpen ? "w-64" : "w-20",
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-sidebar-border flex items-center justify-between px-4 flex-shrink-0">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-bold text-sidebar-primary-foreground">M</span>
              </div>
              <span className="font-bold text-sidebar-foreground">MediFlow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation - Added flex-1 with min-height-0 and overflow-y-auto for proper scrolling */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin scrollbar-thumb-sidebar-accent/40 scrollbar-track-sidebar/0">
          {menuItems.map((item) => renderMenuItem(item))}

          {/* Admin Functions Section */}
          <div className="pt-2 border-t border-sidebar-border/50">
            <Button
              variant="ghost"
              onClick={() => toggleMenu("Admin Functions")}
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
                isAdminActive && "bg-sidebar-primary/10 text-sidebar-primary font-semibold",
              )}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="text-sm flex-1 text-left">Admin Functions</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedMenus.includes("Admin Functions") && "rotate-180",
                    )}
                  />
                </>
              )}
            </Button>

            {/* Admin Submenu */}
            {expandedMenus.includes("Admin Functions") && isOpen && (
              <div className="ml-2 mt-1 space-y-1 border-l border-sidebar-border/50 pl-2">
                {adminMenuItems.map((item) => renderMenuItem(item, true))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer - Added flex-shrink-0 to prevent footer from being compressed */}
        <div className="border-t border-sidebar-border p-3 space-y-2 flex-shrink-0">
          <Link href="/profile">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20"
            >
              <UserCircle className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm">Profile</span>}
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm">Settings</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            {isLoggingOut ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                {isOpen && <span className="text-sm">Logging out...</span>}
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="text-sm">Logout</span>}
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
