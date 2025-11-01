"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Key, Lock } from "lucide-react"
import { forgotPassword, resetPassword } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await forgotPassword(email)
      setStep('otp')
    } catch (err: any) {
      console.error('Forgot password error:', err)
      const errorMessage = err.response?.data?.message || "Failed to send reset email. Please try again."
      
      // Provide helpful context for different error scenarios
      if (errorMessage.includes("Account not found") || errorMessage.includes("No account found")) {
        setError("No account found with this email address. Please check your email or create an account first.")
      } else if (errorMessage.includes("not verified")) {
        setError("This email address is not verified in our system. Please contact your administrator or use a verified email address.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    // Enhanced password validation
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasLowercase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChar) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
      setLoading(false)
      return
    }
    
    try {
      await resetPassword(email, otp, newPassword)
      setStep('success')
    } catch (err: any) {
      console.error('Reset password error:', err)
      console.error('Full error response:', err.response?.data)
      const errorMessage = err.response?.data?.message || "Failed to reset password. Please try again."
      
      // Handle specific error types based on status code and message
      const status = err.response?.status
      
      if (status === 400) {
        if (errorMessage.includes("Invalid verification code") || errorMessage.includes("Invalid or expired")) {
          setError("Invalid or expired verification code. Please check your email and try again, or request a new code.")
        } else if (errorMessage.includes("Password requirements not met") || errorMessage.includes("Password does not meet")) {
          setError("Password does not meet security requirements. Please ensure your password has at least 8 characters, including uppercase, lowercase, numbers, and special characters.")
        } else if (errorMessage.includes("Invalid password format")) {
          setError("Invalid password format. Please use a stronger password with mixed case letters, numbers, and special characters.")
        } else {
          // Generic 400 error - show the specific message from backend
          setError(`${errorMessage}. Please check your input and try again.`)
        }
      } else if (status === 404) {
        setError("User account not found. Please contact support.")
      } else if (status === 401) {
        setError("Authorization failed. Please request a new verification code.")
      } else {
        // For other errors, show the backend message or a generic fallback
        setError(errorMessage || "An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AD</span>
            </div>
            <span className="text-foreground font-bold text-lg">Admin Dashboard</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">
              {step === 'email' && "Reset Password"}
              {step === 'otp' && "Enter Verification Code"}
              {step === 'success' && "Password Reset Complete"}
            </CardTitle>
            <CardDescription>
              {step === 'email' && "Enter your email address to receive a verification code"}
              {step === 'otp' && "Check your email for the verification code and enter your new password"}
              {step === 'success' && "Your password has been successfully reset"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            )}

            {/* Step 2: OTP and New Password */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    <p>We've sent a verification code to <strong>{email}</strong></p>
                    <p>Check your email and enter the code below along with your new password.</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm font-medium text-foreground">
                      Verification Code
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.toUpperCase())}
                        className="pl-10 text-center tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        minLength={8}
                        required
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium">Password requirements:</p>
                      <ul className="space-y-0.5 ml-2">
                        <li className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                          {newPassword.length >= 8 ? '✓' : '•'} At least 8 characters
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/[A-Z]/.test(newPassword) ? '✓' : '•'} One uppercase letter
                        </li>
                        <li className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/[a-z]/.test(newPassword) ? '✓' : '•'} One lowercase letter
                        </li>
                        <li className={`flex items-center gap-1 ${/\d/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/\d/.test(newPassword) ? '✓' : '•'} One number
                        </li>
                        <li className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : ''}`}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '✓' : '•'} One special character
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleBackToEmail}
                    disabled={loading}
                  >
                    Request New Code
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    Password Reset Successful!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                </div>
                
                <Link href="/auth/signin">
                  <Button className="w-full">
                    Continue to Sign In
                  </Button>
                </Link>
              </div>
            )}

            {/* Navigation */}
            {step !== 'success' && (
              <div className="mt-6 pt-6 border-t border-border">
                <Link href="/auth/signin" className="flex items-center justify-center gap-2 text-primary hover:underline">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}