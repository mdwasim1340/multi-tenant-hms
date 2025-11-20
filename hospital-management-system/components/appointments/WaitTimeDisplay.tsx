'use client'

import { useWaitTime } from '@/hooks/useWaitTime'

interface WaitTimeDisplayProps {
  appointmentDate: string
  waitTimeAdjustment?: number
  className?: string
}

export function WaitTimeDisplay({ appointmentDate, waitTimeAdjustment, className = '' }: WaitTimeDisplayProps) {
  const waitTime = useWaitTime(appointmentDate, waitTimeAdjustment)

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-md bg-green-100 border border-green-200 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-mono font-semibold text-green-800">
          {waitTime}
        </span>
      </div>
    </div>
  )
}
