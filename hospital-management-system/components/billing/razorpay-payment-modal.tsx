"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, AlertCircle, CheckCircle, Shield } from "lucide-react"
import { Invoice } from "@/types/billing"
import Cookies from "js-cookie"

// Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayPaymentModalProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RazorpayPaymentModal({ invoice, open, onOpenChange, onSuccess }: RazorpayPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [razorpayConfig, setRazorpayConfig] = useState<any>(null)
  
  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setRazorpayLoaded(true)
    script.onerror = () => {
      setError('Failed to load Razorpay SDK')
      setRazorpayLoaded(false)
    }
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  
  // Fetch Razorpay configuration
  useEffect(() => {
    if (open && !razorpayConfig) {
      fetchRazorpayConfig()
    }
  }, [open])
  
  const fetchRazorpayConfig = async () => {
    try {
      const token = Cookies.get("auth_token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/billing/razorpay-config`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch Razorpay configuration")
      }
      
      const data = await response.json()
      setRazorpayConfig(data.config)
    } catch (err) {
      console.error("Error fetching Razorpay config:", err)
      setError("Failed to load payment configuration")
    }
  }
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null)
      setSuccess(false)
    }
    onOpenChange(newOpen)
  }
  
  const handlePayment = async () => {
    if (!invoice || !razorpayLoaded || !razorpayConfig) {
      setError("Payment system not ready. Please try again.")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const tenantId = Cookies.get("tenant_id")
      const token = Cookies.get("auth_token")
      
      if (!tenantId || !token) {
        throw new Error("Missing authentication context")
      }
      
      // Create Razorpay order
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/billing/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
        }),
      })
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || "Failed to create payment order")
      }
      
      const orderData = await orderResponse.json()
      
      // Check if in demo mode
      if (razorpayConfig.demo_mode) {
        // Simulate successful payment in demo mode
        await simulateDemoPayment(orderData.order_id)
        return
      }
      
      // Initialize Razorpay checkout
      const options = {
        key: razorpayConfig.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hospital Management System",
        description: `Payment for Invoice ${invoice.invoice_number}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          await verifyPayment(response)
        },
        prefill: {
          name: invoice.tenant_name || "",
          email: invoice.tenant_email || "",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
            setError("Payment cancelled by user")
          }
        }
      }
      
      const razorpay = new window.Razorpay(options)
      razorpay.open()
      
    } catch (err) {
      console.error("Error processing payment:", err)
      setError(err instanceof Error ? err.message : "Failed to process payment. Please try again.")
      setLoading(false)
    }
  }
  
  const simulateDemoPayment = async (orderId: string) => {
    try {
      // In demo mode, simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
      setLoading(false)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleOpenChange(false)
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError("Demo payment simulation failed")
      setLoading(false)
    }
  }
  
  const verifyPayment = async (response: any) => {
    try {
      const tenantId = Cookies.get("tenant_id")
      const token = Cookies.get("auth_token")
      
      // Verify payment with backend
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/billing/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId || "",
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          invoice_id: invoice!.id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      })
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.error || "Payment verification failed")
      }
      
      setSuccess(true)
      setLoading(false)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleOpenChange(false)
        onSuccess?.()
      }, 2000)
      
    } catch (err) {
      console.error("Error verifying payment:", err)
      setError(err instanceof Error ? err.message : "Payment verification failed")
      setLoading(false)
    }
  }
  
  if (!invoice) return null
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Process Online Payment
          </DialogTitle>
          <DialogDescription>
            Pay invoice {invoice.invoice_number} securely with Razorpay
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Success Message */}
          {success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>Payment successful! Invoice has been marked as paid.</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Invoice Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Invoice Number</Label>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Amount to Pay</Label>
                  <p className="font-semibold text-2xl text-primary">
                    ${(invoice.amount / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Due Date</Label>
                  <p className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Currency</Label>
                  <p className="font-semibold">{invoice.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Secure Payment</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Powered by Razorpay - India's leading payment gateway</li>
                    <li>Your payment information is encrypted and secure</li>
                    <li>Supports credit cards, debit cards, UPI, and net banking</li>
                    <li>Instant payment confirmation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Demo Mode Warning */}
          {razorpayConfig?.demo_mode && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 text-sm text-yellow-900">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Demo Mode Active</p>
                    <p className="text-xs">
                      Razorpay is running in demo mode. No real payment will be processed.
                      The payment will be simulated for testing purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Razorpay Not Loaded Warning */}
          {!razorpayLoaded && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-yellow-900">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading payment system...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading || success || !razorpayLoaded || !razorpayConfig}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : `Pay $${(invoice.amount / 100).toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
