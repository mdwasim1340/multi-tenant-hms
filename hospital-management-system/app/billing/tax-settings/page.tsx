"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTaxConfigurations } from "@/hooks/use-tax-configurations"
import {
  Receipt,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Calculator,
} from "lucide-react"

export default function TaxSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCalculatorModal, setShowCalculatorModal] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [calculatorAmount, setCalculatorAmount] = useState("")
  const [calculatorResult, setCalculatorResult] = useState<any>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    tax_name: "",
    tax_rate: "",
    tax_type: "percentage",
    applicable_services: [] as string[],
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: "",
  })

  const {
    taxConfigs,
    loading,
    error,
    refetch,
    createTaxConfig,
    updateTaxConfig,
    deleteTaxConfig,
    calculateTax,
  } = useTaxConfigurations()

  const serviceTypes = [
    "consultation",
    "lab",
    "pharmacy",
    "imaging",
    "surgery",
    "bed",
    "emergency",
  ]

  const handleCreateTax = async () => {
    if (!formData.tax_name || !formData.tax_rate || !formData.effective_from) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      await createTaxConfig({
        tax_name: formData.tax_name,
        tax_rate: parseFloat(formData.tax_rate),
        tax_type: formData.tax_type,
        applicable_services: formData.applicable_services,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
      })
      toast({
        title: "Tax Configuration Created",
        description: "New tax configuration has been created successfully.",
      })
      setShowCreateModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tax configuration",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTax = async () => {
    if (!selectedConfig) return

    try {
      await updateTaxConfig(selectedConfig.id, {
        tax_name: formData.tax_name,
        tax_rate: parseFloat(formData.tax_rate),
        tax_type: formData.tax_type,
        applicable_services: formData.applicable_services,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
      })
      toast({
        title: "Tax Configuration Updated",
        description: "Tax configuration has been updated successfully.",
      })
      setShowEditModal(false)
      resetForm()
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tax configuration",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTax = async (configId: number) => {
    if (!confirm("Are you sure you want to delete this tax configuration?")) return

    try {
      await deleteTaxConfig(configId)
      toast({
        title: "Tax Configuration Deleted",
        description: "Tax configuration has been deleted successfully.",
      })
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tax configuration",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (config: any) => {
    try {
      await updateTaxConfig(config.id, { is_active: !config.is_active })
      toast({
        title: config.is_active ? "Tax Deactivated" : "Tax Activated",
        description: `${config.tax_name} has been ${config.is_active ? "deactivated" : "activated"}.`,
      })
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tax status",
        variant: "destructive",
      })
    }
  }

  const handleCalculateTax = async () => {
    if (!calculatorAmount) return

    try {
      const result = await calculateTax(parseFloat(calculatorAmount))
      setCalculatorResult(result)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate tax",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      tax_name: "",
      tax_rate: "",
      tax_type: "percentage",
      applicable_services: [],
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: "",
    })
    setSelectedConfig(null)
  }

  const openEditModal = (config: any) => {
    setSelectedConfig(config)
    setFormData({
      tax_name: config.tax_name,
      tax_rate: config.tax_rate.toString(),
      tax_type: config.tax_type,
      applicable_services: config.applicable_services || [],
      effective_from: config.effective_from?.split("T")[0] || "",
      effective_to: config.effective_to?.split("T")[0] || "",
    })
    setShowEditModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      applicable_services: prev.applicable_services.includes(service)
        ? prev.applicable_services.filter((s) => s !== service)
        : [...prev.applicable_services, service],
    }))
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tax Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Configure tax rates for billing and invoices
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCalculatorModal(true)}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Tax Calculator
                </Button>
                <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tax
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Configurations</p>
                      <p className="text-2xl font-bold">{taxConfigs.length}</p>
                    </div>
                    <Receipt className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Taxes</p>
                      <p className="text-2xl font-bold text-green-600">
                        {taxConfigs.filter((t) => t.is_active).length}
                      </p>
                    </div>
                    <Receipt className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inactive Taxes</p>
                      <p className="text-2xl font-bold text-gray-500">
                        {taxConfigs.filter((t) => !t.is_active).length}
                      </p>
                    </div>
                    <Receipt className="w-8 h-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tax Configurations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Failed to load tax configurations</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => refetch()} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : taxConfigs.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tax configurations yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first tax configuration to get started
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tax
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tax Name</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applicable Services</TableHead>
                        <TableHead>Effective From</TableHead>
                        <TableHead>Effective To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium">{config.tax_name}</TableCell>
                          <TableCell>
                            {config.tax_type === "percentage"
                              ? `${config.tax_rate}%`
                              : formatCurrency(config.tax_rate)}
                          </TableCell>
                          <TableCell className="capitalize">{config.tax_type}</TableCell>
                          <TableCell>
                            {config.applicable_services?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {config.applicable_services.slice(0, 2).map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                                {config.applicable_services.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{config.applicable_services.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">All services</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(config.effective_from || "")}</TableCell>
                          <TableCell>{formatDate(config.effective_to || "")}</TableCell>
                          <TableCell>
                            <Switch
                              checked={config.is_active}
                              onCheckedChange={() => handleToggleActive(config)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(config)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleDeleteTax(config.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={() => {
        setShowCreateModal(false)
        setShowEditModal(false)
        resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showEditModal ? "Edit Tax Configuration" : "Add Tax Configuration"}</DialogTitle>
            <DialogDescription>
              {showEditModal ? "Update the tax configuration details" : "Create a new tax configuration"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tax-name">Tax Name</Label>
              <Input
                id="tax-name"
                value={formData.tax_name}
                onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                placeholder="e.g., GST, VAT, Service Tax"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax-rate">Tax Rate</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  placeholder="e.g., 18"
                />
              </div>
              <div>
                <Label htmlFor="tax-type">Tax Type</Label>
                <Select
                  value={formData.tax_type}
                  onValueChange={(value) => setFormData({ ...formData, tax_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Applicable Services (leave empty for all)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {serviceTypes.map((service) => (
                  <Badge
                    key={service}
                    variant={formData.applicable_services.includes(service) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="effective-from">Effective From</Label>
                <Input
                  id="effective-from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="effective-to">Effective To (Optional)</Label>
                <Input
                  id="effective-to"
                  type="date"
                  value={formData.effective_to}
                  onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={showEditModal ? handleUpdateTax : handleCreateTax}>
              {showEditModal ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tax Calculator Modal */}
      <Dialog open={showCalculatorModal} onOpenChange={setShowCalculatorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tax Calculator</DialogTitle>
            <DialogDescription>
              Calculate tax for a given amount based on active configurations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calc-amount">Amount (₹)</Label>
              <Input
                id="calc-amount"
                type="number"
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <Button onClick={handleCalculateTax} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Tax
            </Button>
            {calculatorResult && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span className="font-semibold">{formatCurrency(calculatorResult.original_amount)}</span>
                </div>
                {calculatorResult.applied_taxes?.map((tax: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{tax.tax_name} ({tax.tax_rate}{tax.tax_type === 'percentage' ? '%' : ''}):</span>
                    <span>{formatCurrency(tax.tax_amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2">
                  <span>Total Tax:</span>
                  <span className="font-semibold">{formatCurrency(calculatorResult.total_tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Amount:</span>
                  <span className="text-green-600">{formatCurrency(calculatorResult.final_amount)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
