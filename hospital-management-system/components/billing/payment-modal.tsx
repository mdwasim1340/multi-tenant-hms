"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CreditCard, Wallet } from "lucide-react"
import { billingAPI, Invoice } from "@/lib/api/billing"
import { useToast } from "@/hooks/use-toast"

const manualPaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  payment_method: z.enum(["manual", "bank_transfer", "cash", "cheque"]),
  notes: z.string().optional(),
})

type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSuccess: () => void
  // Optimistic update callbacks
  onOptimisticUpdate?: () => void
  onOptimisticRollback?: () => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentModal({
  open,
  onOpenChange,
  invoice,
  onSuccess,
  onOptimisticUpdate,
  onOptimisticRollback,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<"online" | "manual">("online")
  const [isOptimisticPending, setIsOptimisticPending] = useState(false) // Track optimistic state
  const { toast } = useToast()

  const form = useForm<ManualPaymentFormData>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      amount: invoice?.amount || 0,
      payment_method: "manual",
      notes: "",
    },
  })

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => setRazorpayLoaded(true)
      document.body.appendChild(script)
    } else if (window.Razorpay) {
      setRazorpayLoaded(true)
    }
  }, [])

  // Update form amount when invoice changes
  useEffect(() => {
    if (invoice) {
      form.setValue("amount", invoice.amount)
    }
  }, [invoice, form])

  const handleOnlinePayment = async () => {
    if (!invoice) return

    try {
      setIsProcessing(true)
      setIsOptimisticPending(true)
      
      // OPTIMISTIC UPDATE: Immediately show processing state in UI
      onOptimisticUpdate?.()

      // Get Razorpay configuration
      const config = await billingAPI.getRazorpayConfig()

      // Create order
      const orderData = await billingAPI.createPaymentOrder(invoice.id)

      // Initialize Razorpay
      const options = {
        key: config.key_id,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: "Hospital Management System",
        description: `Payment for Invoice ${invoice.invoice_number}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            await billingAPI.verifyPayment({
              invoice_id: invoice.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            })

            toast({
              title: "Success",
              description: "Payment processed successfully",
            })

            setIsOptimisticPending(false)
            onOpenChange(false)
            onSuccess() // This confirms the optimistic update and refreshes data
          } catch (error: any) {
            console.error("Payment verification error:", error)
            toast({
              title: "Error",
              description: error.response?.data?.error || "Payment verification failed",
              variant: "destructive",
            })
            // ROLLBACK: Revert optimistic update on verification failure
            setIsOptimisticPending(false)
            onOptimisticRollback?.()
          }
        },
        prefill: {
          name: invoice.tenant_name || "",
          email: invoice.tenant_email || "",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
            setIsOptimisticPending(false)
            // ROLLBACK: Revert optimistic update on user cancel
            onOptimisticRollback?.()
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to initiate payment",
        variant: "destructive",
      })
      setIsProcessing(false)
      setIsOptimisticPending(false)
      // ROLLBACK: Revert optimistic update on error
      onOptimisticRollback?.()
    }
  }

  const handleManualPayment = async (data: ManualPaymentFormData) => {
    if (!invoice) return

    try {
      setIsProcessing(true)
      setIsOptimisticPending(true)
      
      // OPTIMISTIC UPDATE: Immediately show processing state in UI
      onOptimisticUpdate?.()

      await billingAPI.recordManualPayment({
        invoice_id: invoice.id,
        amount: data.amount,
        payment_method: data.payment_method,
        notes: data.notes,
      })

      toast({
        title: "Success",
        description: "Manual payment recorded successfully",
      })

      setIsOptimisticPending(false)
      form.reset()
      onOpenChange(false)
      onSuccess() // This confirms the optimistic update and refreshes data
    } catch (error: any) {
      console.error("Manual payment error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to record payment",
        variant: "destructive",
      })
      // ROLLBACK: Revert optimistic update on error
      setIsOptimisticPending(false)
      onOptimisticRollback?.()
    } finally {
      setIsProcessing(false)
    }
  }

  if (!invoice) return null

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Invoice: {invoice.invoice_number} • Amount: {formatCurrency(invoice.amount, invoice.currency)}
          </DialogDescription>
        </DialogHeader>

        {/* Optimistic Update Processing Indicator */}
        {isOptimisticPending && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing payment... Invoice status updating...</span>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "online" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="online" disabled={isOptimisticPending}>
              <CreditCard className="w-4 h-4 mr-2" />
              Online Payment
            </TabsTrigger>
            <TabsTrigger value="manual" disabled={isOptimisticPending}>
              <Wallet className="w-4 h-4 mr-2" />
              Manual Payment
            </TabsTrigger>
          </TabsList>

          {/* Online Payment Tab */}
          <TabsContent value="online" className="space-y-4">
            <div className="text-center py-6">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Pay with Razorpay</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Secure payment gateway supporting cards, UPI, and net banking
              </p>
              <Button
                onClick={handleOnlinePayment}
                disabled={isProcessing || !razorpayLoaded}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !razorpayLoaded ? (
                  "Loading Razorpay..."
                ) : (
                  <>
                    Pay {formatCurrency(invoice.amount, invoice.currency)}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Manual Payment Tab */}
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={form.handleSubmit(handleManualPayment)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register("amount", { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={form.watch("payment_method")}
                  onValueChange={(value) => form.setValue("payment_method", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add payment notes..."
                  rows={3}
                  {...form.register("notes")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
