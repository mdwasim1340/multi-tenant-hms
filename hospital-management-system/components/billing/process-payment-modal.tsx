"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  Smartphone,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

interface ProcessPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: {
    id: number
    invoice_number: string
    patient_name: string
    patient_number: string
    amount: number
    currency: string
    status: string
    due_date: string
    advance_paid?: number
    line_items?: Array<{
      description: string
      quantity: number
      unit_price: number
      amount: number
    }>
  } | null
  onSuccess?: () => void
}

export function ProcessPaymentModal({ open, onOpenChange, invoice, onSuccess }: ProcessPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [transactionId, setTransactionId] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  if (!invoice) return null

  const remainingAmount = invoice.amount - (invoice.advance_paid || 0)
  const isFullPayment = parseFloat(paymentAmount) === remainingAmount
  const isPartialPayment = parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < remainingAmount
  const isOverpayment = parseFloat(paymentAmount) > remainingAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    if (parseFloat(paymentAmount) > remainingAmount) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Payment amount cannot exceed remaining balance of ${invoice.currency} ${remainingAmount.toLocaleString()}`,
        variant: "destructive",
      })
      return
    }

    if ((paymentMethod === "online" || paymentMethod === "bank_transfer") && !transactionId) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter a transaction ID for this payment method",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      const token = Cookies.get("token")
      const tenantId = Cookies.get("tenant_id")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/manual-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId || "",
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          transaction_id: transactionId || undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process payment")
      }

      const data = await response.json()

      toast({
        title: "Payment Processed Successfully",
        description: `${invoice.currency} ${parseFloat(paymentAmount).toLocaleString()} has been recorded for ${invoice.patient_name}`,
      })

      // Reset form
      setPaymentAmount("")
      setTransactionId("")
      setNotes("")
      setPaymentMethod("cash")

      // Close modal and trigger refresh
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Payment processing error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const paymentMethods = [
    { value: "cash", label: "Cash", icon: Banknote, description: "Cash payment" },
    { value: "card", label: "Card", icon: CreditCard, description: "Credit/Debit card" },
    { value: "online", label: "Online", icon: Smartphone, description: "UPI/Online payment" },
    { value: "bank_transfer", label: "Bank Transfer", icon: Building2, description: "Bank transfer" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="w-6 h-6 text-primary" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Record payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Invoice Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Patient:</span>
              </div>
              <span className="text-sm font-semibold">{invoice.patient_name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Patient Number:</span>
              </div>
              <span className="text-sm font-semibold">{invoice.patient_number}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Due Date:</span>
              </div>
              <span className="text-sm font-semibold">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Invoice Amount:</span>
                <span className="text-sm font-semibold">
                  {invoice.currency} {invoice.amount.toLocaleString()}
                </span>
              </div>
              
              {invoice.advance_paid && invoice.advance_paid > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">Advance Paid:</span>
                  <span className="text-sm font-semibold text-green-600">
                    - {invoice.currency} {invoice.advance_paid.toLocaleString()}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold">Remaining Balance:</span>
                <span className="text-lg font-bold text-primary">
                  {invoice.currency} {remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Line Items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b border-border">
                <h4 className="text-sm font-semibold">Invoice Items</h4>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {invoice.line_items.map((item, idx) => (
                  <div key={idx} className="px-4 py-2 flex items-center justify-between text-sm border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × {invoice.currency} {item.unit_price.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {invoice.currency} {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="text-base font-semibold">
              Payment Amount *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                {invoice.currency}
              </span>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={remainingAmount}
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="pl-14 text-lg font-semibold"
                required
              />
            </div>
            
            {/* Payment Status Indicator */}
            {paymentAmount && (
              <div className="flex items-center gap-2 mt-2">
                {isFullPayment && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Full Payment
                  </Badge>
                )}
                {isPartialPayment && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Partial Payment
                  </Badge>
                )}
                {isOverpayment && (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Exceeds Balance
                  </Badge>
                )}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentAmount(remainingAmount.toString())}
              >
                Full Amount
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentAmount((remainingAmount / 2).toFixed(2))}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentAmount((remainingAmount / 4).toFixed(2))}
              >
                25%
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method *</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <div key={method.value}>
                      <RadioGroupItem
                        value={method.value}
                        id={method.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.value}
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                      >
                        <Icon className="w-6 h-6 mb-2" />
                        <span className="font-semibold">{method.label}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          {method.description}
                        </span>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Transaction ID (for online/bank transfer) */}
          {(paymentMethod === "online" || paymentMethod === "bank_transfer") && (
            <div className="space-y-2">
              <Label htmlFor="transaction-id" className="text-base font-semibold">
                Transaction ID *
              </Label>
              <Input
                id="transaction-id"
                type="text"
                placeholder="Enter transaction/reference ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the transaction reference number from your payment gateway or bank
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          {paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) <= remainingAmount && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-semibold">
                    {invoice.currency} {parseFloat(paymentAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining After Payment:</span>
                  <span className="font-semibold">
                    {invoice.currency} {(remainingAmount - parseFloat(paymentAmount)).toLocaleString()}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-bold">New Status:</span>
                  <Badge className={
                    isFullPayment 
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                  }>
                    {isFullPayment ? "Paid" : "Partially Paid"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
