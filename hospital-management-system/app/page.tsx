"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthLoading } from "@/components/auth-loading"
import { isAuthenticated } from "@/lib/auth"

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Simulate a brief check to avoid flash
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Check authentication using auth utility
      if (isAuthenticated()) {
        router.push("/dashboard")
      } else {
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  return <AuthLoading message="Checking authentication..." />
}
