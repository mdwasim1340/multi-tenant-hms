"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, Activity, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate password reset email sending
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1500)
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

        {/* Password Reset Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isSubmitted ? "Check Your Email" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSubmitted
                ? "We've sent password reset instructions to your email"
                : "Enter your email address and we'll send you instructions to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@mediflow.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending instructions...
                    </>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We've sent an email to <span className="font-medium text-foreground">{email}</span> with
                    instructions to reset your password.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you don't see the email, check your spam folder or try again.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Return to Login</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setIsSubmitted(false)
                      setEmail("")
                    }}
                  >
                    Try Different Email
                  </Button>
                </div>
              </div>
            )}

            {/* Help Text */}
            {!isSubmitted && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Need help?</strong> Contact your system administrator or IT
                  support team for assistance with account recovery.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Protected by enterprise-grade security</p>
          <p className="mt-1">© 2025 MediFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
