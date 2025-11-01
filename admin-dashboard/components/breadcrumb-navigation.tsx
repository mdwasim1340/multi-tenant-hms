"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  "/": [{ label: "Dashboard", href: "/" }],
  "/tenants": [
    { label: "Dashboard", href: "/" },
    { label: "Tenants", href: "/tenants" },
  ],
  "/users": [
    { label: "Dashboard", href: "/" },
    { label: "Users", href: "/users" },
  ],
  "/roles": [
    { label: "Dashboard", href: "/" },
    { label: "Roles", href: "/roles" },
  ],
  "/notifications": [
    { label: "Dashboard", href: "/" },
    { label: "Notifications", href: "/notifications" },
  ],
  "/storage": [
    { label: "Dashboard", href: "/" },
    { label: "File Storage", href: "/storage" },
  ],
  "/analytics": [
    { label: "Dashboard", href: "/" },
    { label: "Analytics", href: "/analytics" },
  ],
  "/monitoring": [
    { label: "Dashboard", href: "/" },
    { label: "System Monitoring", href: "/monitoring" },
  ],
  "/settings": [
    { label: "Dashboard", href: "/" },
    { label: "Settings", href: "/settings" },
  ],
  "/profile": [
    { label: "Dashboard", href: "/" },
    { label: "Profile", href: "/profile" },
  ],
  "/communications/email": [
    { label: "Dashboard", href: "/" },
    { label: "Communications", href: "/communications/email" },
    { label: "Email", href: "/communications/email" },
  ],
  "/communications/sms": [
    { label: "Dashboard", href: "/" },
    { label: "Communications", href: "/communications/sms" },
    { label: "SMS", href: "/communications/sms" },
  ],
  "/communications/notifications": [
    { label: "Dashboard", href: "/" },
    { label: "Communications", href: "/communications/notifications" },
    { label: "Notifications", href: "/communications/notifications" },
  ],
}

export function BreadcrumbNavigation() {
  const pathname = usePathname()
  const breadcrumbs = breadcrumbMap[pathname] || [{ label: "Dashboard", href: "/" }]

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
      <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
