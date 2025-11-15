"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { billingAPI, InvoiceGenerationData } from "@/lib/api/billing"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  amount: z.number().min(0, "Amount must be positive"),
})

const invoiceGenerationSchema = z.object({
  period_start: z.string().min(1, "Start date is required"),
  period_end: z.string().min(1, "End date is required"),
  custom_line_items: z.array(lineItemSchema).optional(),
  notes: z.string().optional(),
  due_days: z.number().min(1, "Due days must be at least 1").default(30),
  include_overage_charges: z.boolean().default(false),
})

type InvoiceGenerationFormData = z.infer<typeof invoiceGenerationSchema>

interface InvoiceGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InvoiceGenerationModal({
  open,
  onOpenChange,
  onSuccess,
}: InvoiceGenerationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<InvoiceGenerationFormData>({
    resolver: zodResolver(invoiceGenerationSchema),
    defaultValues: {
      period_start: "",
      period_end: "",
      custom_line_items: [
        { description: "", quantity: 1, amount: 0 }
      ],
      notes: "",
      due_days: 30,
      include_overage_charges: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "custom_line_items",
  })

  const onSubmit = async (data: InvoiceGenerationFormData) => {
    try {
      setIsSubmitting(true)
      
      const tenantId = Cookies.get("tenant_id")
      if (!tenantId) {
        toast({
          title: "Error",
          description: "Tenant ID not found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const invoiceData: InvoiceGenerationData = {
        tenant_id: tenantId,
        period_start: data.period_start,
        period_end: data.period_end,
        include_overage_charges: data.include_overage_charges,
        custom_line_items: data.custom_line_items?.filter(
          item => item.description && item.amount > 0
        ),
        notes: data.notes,
        due_days: data.due_days,
      }

      await billingAPI.generateInvoice(invoiceData)

      toast({
        title: "Success",
        description: "Invoice generated successfully",
      })

      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error generating invoice:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to generate invoice",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for the billing period
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Billing Period */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Days */}
            <FormField
              control={form.control}
              name="due_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Include Overage Charges */}
            <FormField
              control={form.control}
              name="include_overage_charges"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Include overage charges from usage tracking</FormLabel>
                </FormItem>
              )}
            />

            {/* Custom Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Custom Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: "", quantity: 1, amount: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`custom_line_items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`custom_line_items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`custom_line_items.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Amount"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes for this invoice..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
