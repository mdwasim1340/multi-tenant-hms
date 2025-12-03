import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'

export function useWaitTime(appointmentDate: string, waitTimeAdjustment?: number) {
  const [waitTime, setWaitTime] = useState('')

  useEffect(() => {
    const updateWaitTime = () => {
      const now = new Date()
      const apptTime = parseISO(appointmentDate)
      let diffMinutes = Math.floor((now.getTime() - apptTime.getTime()) / (1000 * 60))
      
      // Apply wait time adjustment if present
      if (waitTimeAdjustment) {
        diffMinutes += waitTimeAdjustment
      }

      // Convert to hours, minutes, seconds
      const hours = Math.floor(Math.abs(diffMinutes) / 60)
      const minutes = Math.abs(diffMinutes) % 60
      const seconds = Math.floor((now.getTime() % 60000) / 1000)

      // Format as HH:MM:SS
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

      if (diffMinutes < 0) {
        setWaitTime(`-${formattedTime}`)
      } else {
        setWaitTime(formattedTime)
      }
    }

    // Update immediately
    updateWaitTime()

    // Update every second
    const interval = setInterval(updateWaitTime, 1000)

    return () => clearInterval(interval)
  }, [appointmentDate, waitTimeAdjustment])

  return waitTime
}
