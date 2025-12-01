"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useBillingJobs } from "@/hooks/use-billing-jobs"
import { AlertTriangle, Mail, Clock, X } from "lucide-react"
import Link from "next/link"

export function AutomationAlerts() {
  const { remindersStatus, paymentPlansDue, dailySummary } = useBillingJobs()
  const [dismissed, setDismissed] = useState<string[]>([])

  const alerts = []

  // High overdue amount alert
  if (dailySummary && dailySummary.overdue_amount > 10000 && !dismissed.includes('high-overdue')) {
    alerts.push({
      id: 'high-overdue',
      type: 'warning' as const,
      icon: AlertTriangle,
      title: 'High Overdue Amount',
      description: `$${dailySummary.overdue_amount.toLocaleString()} in overdue invoices needs attention`,
      action: (
        <Link href="/billing/automation">
          <Button variant="outline" size="sm">
            View Automation
          </Button>
        </Link>
      )
    })
  }

  // Many reminders due alert
  if (remindersStatus) {
    const totalReminders = remindersStatus.upcoming.dueToday + 
                          remindersStatus.overdue.overdue7Days + 
                          remindersStatus.overdue.overdue14Days
    
    if (totalReminders > 10 && !dismissed.includes('many-reminders')) {
      alerts.push({
        id: 'many-reminders',
        type: 'info' as const,
        icon: Mail,
        title: 'Payment Reminders Ready',
        description: `${totalReminders} invoices are ready for payment reminders`,
        action: (
          <Link href="/billing/automation">
            <Button variant="outline" size="sm">
              Send Reminders
            </Button>
          </Link>
        )
      })
    }
  }

  // Payment plans overdue alert
  if (paymentPlansDue && paymentPlansDue.overdue.length > 0 && !dismissed.includes('plans-overdue')) {
    alerts.push({
      id: 'plans-overdue',
      type: 'warning' as const,
      icon: Clock,
      title: 'Payment Plans Overdue',
      description: `${paymentPlansDue.overdue.length} payment plan installments are overdue`,
      action: (
        <Link href="/billing/payment-plans">
          <Button variant="outline" size="sm">
            View Plans
          </Button>
        </Link>
      )
    })
  }

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => [...prev, alertId])
    // Store in localStorage to persist dismissals
    localStorage.setItem('billing-alerts-dismissed', JSON.stringify([...dismissed, alertId]))
  }

  useEffect(() => {
    // Load dismissed alerts from localStorage
    const stored = localStorage.getItem('billing-alerts-dismissed')
    if (stored) {
      try {
        setDismissed(JSON.parse(stored))
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [])

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
          <alert.icon className="h-4 w-4" />
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <div className="font-medium">{alert.title}</div>
              <AlertDescription className="mt-1">
                {alert.description}
              </AlertDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {alert.action}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  )
}
