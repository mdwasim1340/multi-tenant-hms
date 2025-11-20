"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Invoice } from "@/types/billing"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

interface EditInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSuccess: () => void
}

interface LineItem {
  description: string
  amount: number
  quantity: number
  unit_price?: number
  tax_rate?: number
  tax_amount?: number
}

export function EditInvoiceModal({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: EditInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_number: "",
    due_date: "",
    status: "pending",
    notes: "",
    referring_doctor: "",
  })
  
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  // Load invoice data when modal opens
  useEffect(() => {
    if (invoice && open) {
      setFormData({
        patient_name: invoice.patient_name || "",
        patient_number: invoice.patient_number || "",
        due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : "",
        status: invoice.status || "pending",
        notes: invoice.notes || "",
        referring_doctor: invoice.referring_doctor || "",
      })
      setLineItems(invoice.line_items || [])
    }
  }, [invoice, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invoice) return
    
    setLoading(true)
    
    try {
      const token = Cookies.get("token")
      const tenantId = Cookies.get("tenant_id")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/invoice/${invoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId || "",
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          ...formData,
          line_items: lineItems,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update invoice")
      }
      
      toast({
        title: "Invoice Updated",
        description: "The invoice has been successfully updated.",
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: 0, quantity: 1, unit_price: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_: LineItem, i: number) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-calculate amount if quantity or unit_price changes
    if (field === "quantity" || field === "unit_price") {
      updated[index].amount = updated[index].quantity * (updated[index].unit_price || 0)
    }
    
    setLineItems(updated)
  }

  const totalAmount = lineItems.reduce((sum: number, item: LineItem) => sum + item.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[60vw] !w-[60vw] max-h-[90vh] overflow-y-auto sm:!max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update invoice details for {invoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_name">Patient Name</Label>
                <Input
                  id="patient_name"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient_number">Patient Number</Label>
                <Input
                  id="patient_number"
                  value={formData.patient_number}
                  onChange={(e) => setFormData({ ...formData, patient_number: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referring_doctor">Referring Doctor</Label>
              <Input
                id="referring_doctor"
                value={formData.referring_doctor}
                onChange={(e) => setFormData({ ...formData, referring_doctor: e.target.value })}
              />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((item: LineItem, index: number) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right pt-2">
                    <span className="text-sm font-semibold">₹{item.amount.toFixed(2)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {lineItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No line items. Click "Add Item" to add services.</p>
              </div>
            )}

            {lineItems.length > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
