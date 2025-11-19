"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Calendar, DollarSign, FileText, Loader2 } from "lucide-react"
import { billingAPI } from "@/lib/api/billing"
import Cookies from "js-cookie"

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface InvoiceGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InvoiceGenerationModal({ open, onOpenChange, onSuccess }: InvoiceGenerationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [dueDays, setDueDays] = useState("30")
  const [notes, setNotes] = useState("")
  const [includeOverage, setIncludeOverage] = useState(true)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  
  // New line item state
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("1")
  const [newItemUnitPrice, setNewItemUnitPrice] = useState("")
  
  const addLineItem = () => {
    if (!newItemDescription || !newItemQuantity || !newItemUnitPrice) {
      return
    }
    
    const quantity = parseFloat(newItemQuantity)
    const unitPrice = parseFloat(newItemUnitPrice)
    const amount = quantity * unitPrice
    
    setLineItems([
      ...lineItems,
      {
        description: newItemDescription,
        quantity,
        unit_price: unitPrice,
        amount
      }
    ])
    
    // Reset form
    setNewItemDescription("")
    setNewItemQuantity("1")
    setNewItemUnitPrice("")
  }
  
  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }
  
  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!periodStart || !periodEnd) {
      setError("Please select billing period")
      return
    }
    
    const tenantId = Cookies.get('tenant_id')
    if (!tenantId) {
      setError("Tenant ID not found")
      return
    }
    
    setLoading(true)
    
    try {
      await billingAPI.generateInvoice({
        tenant_id: tenantId,
        period_start: periodStart,
        period_end: periodEnd,
        include_overage_charges: includeOverage,
        custom_line_items: lineItems.length > 0 ? lineItems : undefined,
        notes: notes || undefined,
        due_days: parseInt(dueDays)
      })
      
      // Success
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset form
      setPeriodStart("")
      setPeriodEnd("")
      setDueDays("30")
      setNotes("")
      setLineItems([])
      setIncludeOverage(true)
    } catch (err: any) {
      console.error('Error generating invoice:', err)
      setError(err.response?.data?.error || 'Failed to generate invoice')
    } finally {
      setLoading(false)
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Invoice
          </DialogTitle>
          <DialogDescription>
            Create a new invoice for the current tenant
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Billing Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period-end">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Invoice Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due-days">Due Days</Label>
                <Select value={dueDays} onValueChange={setDueDays}>
                  <SelectTrigger id="due-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="15">15 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="include-overage">Include Overage Charges</Label>
                <Select 
                  value={includeOverage ? "yes" : "no"} 
                  onValueChange={(v) => setIncludeOverage(v === "yes")}
                >
                  <SelectTrigger id="include-overage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Custom Line Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Custom Line Items (Optional)</h3>
            
            {/* Existing Line Items */}
            {lineItems.length > 0 && (
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(item.amount)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <p className="font-semibold text-foreground">Subtotal</p>
                  <p className="font-bold text-foreground text-lg">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
              </div>
            )}
            
            {/* Add New Line Item */}
            <Card className="border-dashed border-2">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Input
                      id="item-description"
                      placeholder="e.g., Subscription fee, Setup charge"
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="item-quantity">Quantity</Label>
                      <Input
                        id="item-quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="1"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="item-price">Unit Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="item-price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={newItemUnitPrice}
                          onChange={(e) => setNewItemUnitPrice(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addLineItem}
                    disabled={!newItemDescription || !newItemQuantity || !newItemUnitPrice}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Footer */}
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
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
