"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Invoice } from "@/types/billing"
import Cookies from "js-cookie"

interface EmailInvoiceModalProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EmailInvoiceModal({ invoice, open, onOpenChange, onSuccess }: EmailInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [recipientEmail, setRecipientEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [attachPDF, setAttachPDF] = useState(true)
  
  // Set default values when invoice changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && invoice) {
      // Set default subject
      setSubject(`Invoice ${invoice.invoice_number}`)
      
      // Set default message
      setMessage(`Dear Customer,\n\nPlease find attached your invoice ${invoice.invoice_number}.\n\nInvoice Amount: $${(invoice.amount / 100).toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nThank you for your business.\n\nBest regards`)
      
      // Clear recipient email and error
      setRecipientEmail("")
      setError(null)
      setSuccess(false)
    }
    
    onOpenChange(newOpen)
  }
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  const handleSendEmail = async () => {
    // Validation
    if (!recipientEmail.trim()) {
      setError("Please enter a recipient email address")
      return
    }
    
    if (!validateEmail(recipientEmail)) {
      setError("Please enter a valid email address")
      return
    }
    
    if (!subject.trim()) {
      setError("Please enter an email subject")
      return
    }
    
    if (!invoice) {
      setError("No invoice selected")
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
      
      // Call backend API to send email
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/billing/email-invoice`, {
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
          recipient_email: recipientEmail,
          subject: subject,
          message: message,
          attach_pdf: attachPDF,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }
      
      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleOpenChange(false)
        onSuccess?.()
      }, 2000)
      
    } catch (err) {
      console.error("Error sending email:", err)
      setError(err instanceof Error ? err.message : "Failed to send email. Please try again.")
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
            <Mail className="w-5 h-5" />
            Email Invoice
          </DialogTitle>
          <DialogDescription>
            Send invoice {invoice.invoice_number} to a customer via email
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Success Message */}
          {success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>Email sent successfully!</span>
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
                  <Label className="text-xs text-gray-500">Amount</Label>
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
          
          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email *</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="customer@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">The email address where the invoice will be sent</p>
          </div>
          
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Invoice subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Email message body"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">The message to include in the email body</p>
          </div>
          
          {/* Attach PDF */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="attach-pdf"
              checked={attachPDF}
              onChange={(e) => setAttachPDF(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <Label htmlFor="attach-pdf" className="cursor-pointer">
              Attach invoice as PDF
            </Label>
          </div>
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
            onClick={handleSendEmail}
            disabled={loading || success}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
