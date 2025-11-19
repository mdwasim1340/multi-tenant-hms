"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Invoice } from "@/types/billing"
import Cookies from "js-cookie"

interface ManualPaymentModalProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ManualPaymentModal({ invoice, open, onOpenChange, onSuccess }: ManualPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [notes, setNotes] = useState("")
  
  // Set default values when invoice changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && invoice) {
      // Set default amount to invoice amount
      setAmount((invoice.amount / 100).toFixed(2))
      
      // Clear other fields
      setPaymentMethod("")
      setNotes("")
      setError(null)
      setSuccess(false)
    }
    
    onOpenChange(newOpen)
  }
  
  const validateForm = (): string | null => {
    if (!amount || parseFloat(amount) <= 0) {
      return "Please enter a valid payment amount"
    }
    
    if (!paymentMethod) {
      return "Please select a payment method"
    }
    
    if (!invoice) {
      return "No invoice selected"
    }
    
    // Check if amount exceeds invoice amount
    const paymentAmount = parseFloat(amount) * 100 // Convert to cents
    if (paymentAmount > invoice.amount) {
      return `Payment amount cannot exceed invoice amount ($${(invoice.amount / 100).toFixed(2)})`
    }
    
    return null
  }
  
  const handleRecordPayment = async () => {
    // Validation
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const tenantId = Cookies.get("tenant_id")
      const token = Cookies.get("auth_token")
      
      if (!tenantId || !token) {
        throw new Error("Missing authentication context")
      }
      
      // Convert amount to cents
      const paymentAmount = Math.round(parseFloat(amount) * 100)
      
      // Call backend API to record manual payment
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/billing/manual-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          invoice_id: invoice!.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record payment")
      }
      
      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleOpenChange(false)
        onSuccess?.()
      }, 2000)
      
    } catch (err) {
      console.error("Error recording payment:", err)
      setError(err instanceof Error ? err.message : "Failed to record payment. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  if (!invoice) return null
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Record Manual Payment
          </DialogTitle>
          <DialogDescription>
            Record a manual payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Success Message */}
          {success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>Payment recorded successfully!</span>
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
                  <Label className="text-xs text-gray-500">Invoice Amount</Label>
                  <p className="font-semibold">${(invoice.amount / 100).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Due Date</Label>
                  <p className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="font-semibold capitalize">{invoice.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={(invoice.amount / 100).toFixed(2)}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-gray-500">
              Maximum: ${(invoice.amount / 100).toFixed(2)}
            </p>
          </div>
          
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={loading}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="manual">Manual Entry</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Select how the payment was received
            </p>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Reference number, transaction ID, or other details
            </p>
          </div>
          
          {/* Payment Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This will mark the invoice as paid</li>
                    <li>Payment cannot be undone once recorded</li>
                    <li>Ensure payment details are accurate</li>
                    <li>A payment receipt will be generated</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
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
            onClick={handleRecordPayment}
            disabled={loading || success}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
