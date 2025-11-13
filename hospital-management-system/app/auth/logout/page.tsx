"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, LogOut, CheckCircle2 } from "lucide-react"
import { AuthLoading } from "@/components/auth-loading"
import { signOut } from "@/lib/auth"

export default function LogoutPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoggedOut, setIsLoggedOut] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Clear authentication using auth utility
    signOut()

    setIsLoggingOut(false)
    setIsLoggedOut(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsRedirecting(true)

    // Use Next.js router for smooth transition
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push("/auth/login")
  }

  const handleCancel = () => {
    router.push("/dashboard")
  }

  if (isRedirecting) {
    return <AuthLoading message="Redirecting to login..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">MediFlow</h1>
          <p className="text-muted-foreground mt-2">Hospital Management System</p>
        </div>

        {/* Logout Confirmation Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLoggedOut ? "Successfully Logged Out" : "Confirm Logout"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLoggedOut ? "Redirecting to login page..." : "Are you sure you want to log out of your account?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoggedOut ? (
              <div className="space-y-4">
                {/* Warning Message */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex gap-3">
                    <LogOut className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Before you go:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Make sure you've saved all your work</li>
                        <li>Any unsaved changes will be lost</li>
                        <li>You'll need to log in again to access the system</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button onClick={handleLogout} variant="destructive" className="w-full" disabled={isLoggingOut}>
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Yes, Log Me Out
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="w-full bg-transparent"
                    disabled={isLoggingOut}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your session has been terminated and all data has been cleared securely.
                  </p>
                  <p className="text-sm text-muted-foreground">Thank you for using MediFlow.</p>

                  <div className="flex justify-center pt-4">
                    <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Your session data has been securely cleared</p>
          <p className="mt-1">© 2025 MediFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
