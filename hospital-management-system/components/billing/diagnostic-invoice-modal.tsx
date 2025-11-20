"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus, X, Calendar, DollarSign, FileText, Loader2, Search, 
  User, Phone, Activity, AlertCircle, Percent, Receipt, Mail, Printer, ArrowLeft
} from "lucide-react"
import { billingAPI } from "@/lib/api/billing"
import Cookies from "js-cookie"

// Diagnostic service categories and items
const DIAGNOSTIC_SERVICES = {
  radiology: [
    { id: "xray_chest", name: "X-Ray - Chest", category: "Radiology", basePrice: 500 },
    { id: "xray_abdomen", name: "X-Ray - Abdomen", category: "Radiology", basePrice: 600 },
    { id: "xray_spine", name: "X-Ray - Spine", category: "Radiology", basePrice: 700 },
    { id: "xray_limbs", name: "X-Ray - Limbs", category: "Radiology", basePrice: 450 },
    { id: "ct_scan_head", name: "CT Scan - Head", category: "Radiology", basePrice: 3500 },
    { id: "ct_scan_chest", name: "CT Scan - Chest", category: "Radiology", basePrice: 4000 },
    { id: "ct_scan_abdomen", name: "CT Scan - Abdomen", category: "Radiology", basePrice: 4500 },
    { id: "mri_brain", name: "MRI - Brain", category: "Radiology", basePrice: 6000 },
    { id: "mri_spine", name: "MRI - Spine", category: "Radiology", basePrice: 6500 },
    { id: "ultrasound_abdomen", name: "Ultrasound - Abdomen", category: "Radiology", basePrice: 1200 },
    { id: "ultrasound_pelvic", name: "Ultrasound - Pelvic", category: "Radiology", basePrice: 1300 },
    { id: "ultrasound_pregnancy", name: "Ultrasound - Pregnancy", category: "Radiology", basePrice: 1500 },
    { id: "mammography", name: "Mammography", category: "Radiology", basePrice: 2000 },
    { id: "fluoroscopy", name: "Fluoroscopy", category: "Radiology", basePrice: 2500 },
  ],
  laboratory: [
    { id: "cbc", name: "Complete Blood Count (CBC)", category: "Laboratory", basePrice: 300 },
    { id: "blood_sugar", name: "Blood Sugar (Fasting)", category: "Laboratory", basePrice: 150 },
    { id: "lipid_profile", name: "Lipid Profile", category: "Laboratory", basePrice: 800 },
    { id: "liver_function", name: "Liver Function Test (LFT)", category: "Laboratory", basePrice: 700 },
    { id: "kidney_function", name: "Kidney Function Test (KFT)", category: "Laboratory", basePrice: 650 },
    { id: "thyroid_profile", name: "Thyroid Profile", category: "Laboratory", basePrice: 900 },
    { id: "urine_routine", name: "Urine Routine", category: "Laboratory", basePrice: 200 },
    { id: "urine_culture", name: "Urine Culture", category: "Laboratory", basePrice: 500 },
    { id: "stool_test", name: "Stool Test", category: "Laboratory", basePrice: 250 },
    { id: "culture_test", name: "Culture Test", category: "Laboratory", basePrice: 800 },
    { id: "biopsy", name: "Biopsy Analysis", category: "Laboratory", basePrice: 2500 },
    { id: "pathology", name: "Pathology Test", category: "Laboratory", basePrice: 1500 },
  ],
  other: [
    { id: "ecg", name: "ECG/EKG", category: "Other Diagnostic", basePrice: 400 },
    { id: "echo", name: "Echocardiogram", category: "Other Diagnostic", basePrice: 2000 },
    { id: "endoscopy", name: "Endoscopy", category: "Other Diagnostic", basePrice: 3500 },
    { id: "colonoscopy", name: "Colonoscopy", category: "Other Diagnostic", basePrice: 4000 },
    { id: "pft", name: "Pulmonary Function Test (PFT)", category: "Other Diagnostic", basePrice: 1200 },
    { id: "audiometry", name: "Audiometry", category: "Other Diagnostic", basePrice: 600 },
    { id: "vision_test", name: "Vision Test", category: "Other Diagnostic", basePrice: 300 },
  ]
}

interface ServiceLineItem {
  id: string
  service_id: string
  service_name: string
  category: string
  base_price: number
  discount_percent: number
  tax_percent: number
  final_price: number
  quantity: number
  is_custom?: boolean
}

interface Patient {
  id: number
  patient_number: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  admission_status?: string
}

interface DiagnosticInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DiagnosticInvoiceModal({ open, onOpenChange, onSuccess }: DiagnosticInvoiceModalProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchingPatients, setSearchingPatients] = useState(false)
  
  // Patient selection
  const [patientSearch, setPatientSearch] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  // Invoice details
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState("")
  const [referringDoctor, setReferringDoctor] = useState("")
  const [notes, setNotes] = useState("")
  const [reportDeliveryDate, setReportDeliveryDate] = useState("")
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [advancePaid, setAdvancePaid] = useState("0")
  
  // Service items
  const [serviceItems, setServiceItems] = useState<ServiceLineItem[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  
  // Custom item modal
  const [showCustomItemModal, setShowCustomItemModal] = useState(false)
  const [customItemName, setCustomItemName] = useState("")
  const [customItemCategory, setCustomItemCategory] = useState("Other Diagnostic")
  const [customItemPrice, setCustomItemPrice] = useState("")
  
  // Pricing options
  const [bulkDiscount, setBulkDiscount] = useState("0")
  const [emergencySurcharge, setEmergencySurcharge] = useState(false)
  const [insuranceCoverage, setInsuranceCoverage] = useState("0")
  
  // Search patients
  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients()
    } else {
      setPatients([])
    }
  }, [patientSearch])
  
  // Set default due date (7 days from invoice date)
  useEffect(() => {
    if (invoiceDate) {
      const date = new Date(invoiceDate)
      date.setDate(date.getDate() + 7)
      setDueDate(date.toISOString().split('T')[0])
    }
  }, [invoiceDate])
  
  const searchPatients = async () => {
    setSearchingPatients(true)
    try {
      // Mock patient search - replace with actual API call
      const mockPatients: Patient[] = [
        { id: 1, patient_number: "P001", first_name: "John", last_name: "Doe", phone: "555-0101", admission_status: "Outpatient" },
        { id: 2, patient_number: "P002", first_name: "Jane", last_name: "Smith", phone: "555-0102", admission_status: "Inpatient" },
      ]
      setPatients(mockPatients.filter(p => 
        p.first_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.last_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.patient_number.toLowerCase().includes(patientSearch.toLowerCase())
      ))
    } catch (err) {
      console.error('Error searching patients:', err)
    } finally {
      setSearchingPatients(false)
    }
  }
  
  const addService = (serviceId: string) => {
    const allServices = [...DIAGNOSTIC_SERVICES.radiology, ...DIAGNOSTIC_SERVICES.laboratory, ...DIAGNOSTIC_SERVICES.other]
    const service = allServices.find(s => s.id === serviceId)
    if (!service) return
    
    const defaultTaxPercent = 5 // GST 5%
    const discountPercent = parseFloat(bulkDiscount) || 0
    const basePrice = service.basePrice
    const discountAmount = (basePrice * discountPercent) / 100
    const taxableAmount = basePrice - discountAmount
    const taxAmount = (taxableAmount * defaultTaxPercent) / 100
    let finalPrice = taxableAmount + taxAmount
    
    // Apply emergency surcharge if enabled
    if (emergencySurcharge) {
      finalPrice = finalPrice * 1.25 // 25% surcharge
    }
    
    const newItem: ServiceLineItem = {
      id: `${serviceId}-${Date.now()}`,
      service_id: serviceId,
      service_name: service.name,
      category: service.category,
      base_price: basePrice,
      discount_percent: discountPercent,
      tax_percent: defaultTaxPercent,
      final_price: finalPrice,
      quantity: 1
    }
    
    setServiceItems([...serviceItems, newItem])
    setSelectedServices(new Set([...selectedServices, serviceId]))
  }
  
  const removeService = (itemId: string) => {
    const item = serviceItems.find(i => i.id === itemId)
    if (item && !item.is_custom) {
      setSelectedServices(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.service_id)
        return newSet
      })
    }
    setServiceItems(serviceItems.filter(i => i.id !== itemId))
  }
  
  const addCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) {
      return
    }
    
    const price = parseFloat(customItemPrice)
    if (isNaN(price) || price <= 0) {
      return
    }
    
    const defaultTaxPercent = 5 // GST 5%
    const discountPercent = parseFloat(bulkDiscount) || 0
    const basePrice = price
    const discountAmount = (basePrice * discountPercent) / 100
    const taxableAmount = basePrice - discountAmount
    const taxAmount = (taxableAmount * defaultTaxPercent) / 100
    let finalPrice = taxableAmount + taxAmount
    
    // Apply emergency surcharge if enabled
    if (emergencySurcharge) {
      finalPrice = finalPrice * 1.25 // 25% surcharge
    }
    
    const newItem: ServiceLineItem = {
      id: `custom-${Date.now()}`,
      service_id: `custom-${Date.now()}`,
      service_name: customItemName,
      category: customItemCategory,
      base_price: basePrice,
      discount_percent: discountPercent,
      tax_percent: defaultTaxPercent,
      final_price: finalPrice,
      quantity: 1,
      is_custom: true
    }
    
    setServiceItems([...serviceItems, newItem])
    
    // Reset custom item form
    setCustomItemName("")
    setCustomItemCategory("Other Diagnostic")
    setCustomItemPrice("")
    setShowCustomItemModal(false)
  }
  
  const updateServiceQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return
    setServiceItems(serviceItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ))
  }
  
  const updateServicePrice = (itemId: string, newPrice: number) => {
    setServiceItems(serviceItems.map(item => 
      item.id === itemId ? { ...item, base_price: newPrice, final_price: calculateFinalPrice(newPrice, item.discount_percent, item.tax_percent) } : item
    ))
  }
  
  const updateServiceDiscount = (itemId: string, discountPercent: number) => {
    setServiceItems(serviceItems.map(item => 
      item.id === itemId ? { ...item, discount_percent: discountPercent, final_price: calculateFinalPrice(item.base_price, discountPercent, item.tax_percent) } : item
    ))
  }
  
  const calculateFinalPrice = (basePrice: number, discountPercent: number, taxPercent: number) => {
    const discountAmount = (basePrice * discountPercent) / 100
    const taxableAmount = basePrice - discountAmount
    const taxAmount = (taxableAmount * taxPercent) / 100
    let finalPrice = taxableAmount + taxAmount
    
    if (emergencySurcharge) {
      finalPrice = finalPrice * 1.25
    }
    
    return finalPrice
  }
  
  const applyBulkDiscount = () => {
    const discount = parseFloat(bulkDiscount) || 0
    setServiceItems(serviceItems.map(item => ({
      ...item,
      discount_percent: discount,
      final_price: calculateFinalPrice(item.base_price, discount, item.tax_percent)
    })))
  }
  
  const calculateSubtotal = () => {
    return serviceItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0)
  }
  
  const calculateTotalDiscount = () => {
    return serviceItems.reduce((sum, item) => {
      const discountAmount = (item.base_price * item.quantity * item.discount_percent) / 100
      return sum + discountAmount
    }, 0)
  }
  
  const calculateTaxableAmount = () => {
    return calculateSubtotal() - calculateTotalDiscount()
  }
  
  const calculateTotalTax = () => {
    return serviceItems.reduce((sum, item) => {
      const discountAmount = (item.base_price * item.discount_percent) / 100
      const taxableAmount = item.base_price - discountAmount
      const taxAmount = (taxableAmount * item.tax_percent) / 100
      return sum + (taxAmount * item.quantity)
    }, 0)
  }
  
  const calculateTotalAmount = () => {
    let total = serviceItems.reduce((sum, item) => sum + (item.final_price * item.quantity), 0)
    
    // Apply insurance coverage
    const insurancePercent = parseFloat(insuranceCoverage) || 0
    if (insurancePercent > 0) {
      total = total * (1 - insurancePercent / 100)
    }
    
    return total
  }
  
  const calculateBalanceDue = () => {
    const total = calculateTotalAmount()
    const advance = parseFloat(advancePaid) || 0
    return Math.max(0, total - advance)
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  const handleSubmit = async (action: 'draft' | 'generate' | 'email' | 'print') => {
    setError(null)
    
    if (!selectedPatient) {
      setError("Please select a patient")
      return
    }
    
    if (serviceItems.length === 0) {
      setError("Please add at least one service")
      return
    }
    
    setLoading(true)
    
    try {
      const tenantId = Cookies.get('tenant_id')
      if (!tenantId) {
        setError("Tenant ID not found")
        return
      }
      
      // Prepare invoice data
      const invoiceData = {
        tenant_id: tenantId,
        patient_id: selectedPatient.id,
        patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        patient_number: selectedPatient.patient_number,
        invoice_date: invoiceDate,
        due_date: dueDate,
        referring_doctor: referringDoctor,
        report_delivery_date: reportDeliveryDate,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        advance_paid: parseFloat(advancePaid) || 0,
        emergency_surcharge: emergencySurcharge,
        insurance_coverage_percent: parseFloat(insuranceCoverage) || 0,
        line_items: serviceItems.map(item => ({
          description: item.service_name,
          category: item.category,
          quantity: item.quantity,
          unit_price: item.base_price,
          discount_percent: item.discount_percent,
          tax_percent: item.tax_percent,
          amount: item.final_price * item.quantity
        })),
        subtotal: calculateSubtotal(),
        total_discount: calculateTotalDiscount(),
        taxable_amount: calculateTaxableAmount(),
        total_tax: calculateTotalTax(),
        total_amount: calculateTotalAmount(),
        balance_due: calculateBalanceDue(),
        notes: notes,
        status: action === 'draft' ? 'draft' : 'pending'
      }
      
      // Call API based on action
      switch (action) {
        case 'draft':
          // Save as draft
          console.log('Saving as draft:', invoiceData)
          break
        case 'generate':
          // Generate diagnostic invoice (NO subscription plan included)
          await billingAPI.generateDiagnosticInvoice({
            tenant_id: tenantId,
            patient_id: selectedPatient.id,
            patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
            patient_number: selectedPatient.patient_number,
            line_items: invoiceData.line_items,
            notes: notes,
            due_days: Math.ceil((new Date(dueDate).getTime() - new Date(invoiceDate).getTime()) / (1000 * 60 * 60 * 24)),
            invoice_date: invoiceDate,
            referring_doctor: referringDoctor,
            report_delivery_date: reportDeliveryDate,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            advance_paid: parseFloat(advancePaid) || 0,
            emergency_surcharge: emergencySurcharge,
            insurance_coverage_percent: parseFloat(insuranceCoverage) || 0
          })
          break
        case 'email':
          // Generate and email invoice
          console.log('Emailing invoice:', invoiceData)
          break
        case 'print':
          // Generate and print invoice
          console.log('Printing invoice:', invoiceData)
          break
      }
      
      // Success
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset form
      resetForm()
    } catch (err: any) {
      console.error('Error processing invoice:', err)
      setError(err.response?.data?.error || 'Failed to process invoice')
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setSelectedPatient(null)
    setPatientSearch("")
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setDueDate("")
    setReferringDoctor("")
    setNotes("")
    setReportDeliveryDate("")
    setPaymentMethod("cash")
    setPaymentStatus("pending")
    setAdvancePaid("0")
    setServiceItems([])
    setSelectedServices(new Set())
    setBulkDiscount("0")
    setEmergencySurcharge(false)
    setInsuranceCoverage("0")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex h-screen">
      {/* Use the exact same Sidebar component from billing page */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area with same margin as billing page */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        {/* Use the exact same TopBar component from billing page */}
        <TopBar sidebarOpen={sidebarOpen} />

        {/* Content area matching billing page */}
        <main className="flex-1 overflow-auto pt-20">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader className="space-y-4">
              {/* Back button and title */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Create New Invoice</h1>
                  <p className="text-sm text-muted-foreground">Generate invoice for diagnostic tests and procedures</p>
                </div>
              </div>
              
              {/* Patient Information title */}
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedPatient ? (
                <div className="space-y-2">
                  <Label htmlFor="patient-search">Search Patient</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="patient-search"
                      placeholder="Search by name or patient number..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-10"
                    />
                    {searchingPatients && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {patients.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {patients.map(patient => (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className="w-full p-3 text-left hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.patient_number} • {patient.phone}
                              </p>
                            </div>
                            {patient.admission_status && (
                              <Badge variant="outline">{patient.admission_status}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <div>
                    <p className="font-semibold">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedPatient.patient_number} • Phone: {selectedPatient.phone || 'N/A'}
                    </p>
                    {selectedPatient.admission_status && (
                      <Badge variant="outline" className="mt-1">{selectedPatient.admission_status}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Change Patient
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="invoice-date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referring-doctor">Referring Doctor</Label>
                  <Input
                    id="referring-doctor"
                    placeholder="Dr. Name"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Select Diagnostic Services
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomItemModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="radiology" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="radiology">Radiology ({DIAGNOSTIC_SERVICES.radiology.length})</TabsTrigger>
                  <TabsTrigger value="laboratory">Laboratory ({DIAGNOSTIC_SERVICES.laboratory.length})</TabsTrigger>
                  <TabsTrigger value="other">Other ({DIAGNOSTIC_SERVICES.other.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="radiology" className="space-y-2 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2">
                    {DIAGNOSTIC_SERVICES.radiology.map(service => (
                      <div key={service.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent transition-colors">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addService(service.id)
                            } else {
                              const item = serviceItems.find(i => i.service_id === service.id)
                              if (item) removeService(item.id)
                            }
                          }}
                        />
                        <label htmlFor={service.id} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(service.basePrice)}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="laboratory" className="space-y-2 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2">
                    {DIAGNOSTIC_SERVICES.laboratory.map(service => (
                      <div key={service.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent transition-colors">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addService(service.id)
                            } else {
                              const item = serviceItems.find(i => i.service_id === service.id)
                              if (item) removeService(item.id)
                            }
                          }}
                        />
                        <label htmlFor={service.id} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(service.basePrice)}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="other" className="space-y-2 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2">
                    {DIAGNOSTIC_SERVICES.other.map(service => (
                      <div key={service.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent transition-colors">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addService(service.id)
                            } else {
                              const item = serviceItems.find(i => i.service_id === service.id)
                              if (item) removeService(item.id)
                            }
                          }}
                        />
                        <label htmlFor={service.id} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(service.basePrice)}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Selected Services */}
          {serviceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Line Items ({serviceItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{item.service_name}</p>
                          {item.is_custom && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Qty</p>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateServiceQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-sm text-center"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Base</p>
                          <Input
                            type="number"
                            value={item.base_price}
                            onChange={(e) => updateServicePrice(item.id, parseFloat(e.target.value))}
                            className="w-24 h-8 text-sm"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Disc %</p>
                          <Input
                            type="number"
                            value={item.discount_percent}
                            onChange={(e) => updateServiceDiscount(item.id, parseFloat(e.target.value))}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Tax %</p>
                          <p className="text-sm font-medium">{item.tax_percent}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-semibold">{formatCurrency(item.final_price * item.quantity)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(item.id)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Customization */}
          {serviceItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Price Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-discount">Bulk Discount %</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bulk-discount"
                        type="number"
                        min="0"
                        max="100"
                        value={bulkDiscount}
                        onChange={(e) => setBulkDiscount(e.target.value)}
                        placeholder="0"
                      />
                      <Button onClick={applyBulkDiscount} size="sm">Apply</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="insurance">Insurance Coverage %</Label>
                    <Input
                      id="insurance"
                      type="number"
                      min="0"
                      max="100"
                      value={insuranceCoverage}
                      onChange={(e) => setInsuranceCoverage(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Emergency Surcharge</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Checkbox
                        id="emergency"
                        checked={emergencySurcharge}
                        onCheckedChange={(checked) => setEmergencySurcharge(checked as boolean)}
                      />
                      <label htmlFor="emergency" className="text-sm cursor-pointer">
                        Add 25% surcharge
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Summary */}
          {serviceItems.length > 0 && (
            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle className="text-base">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(calculateTotalDiscount())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxable Amount:</span>
                    <span className="font-medium">{formatCurrency(calculateTaxableAmount())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (5%):</span>
                    <span className="font-medium">+{formatCurrency(calculateTotalTax())}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculateTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Advance Paid:</span>
                    <Input
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                      className="w-32 h-8 text-right"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(calculateBalanceDue())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment & Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment & Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-status">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger id="payment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="report-delivery">Report Delivery Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="report-delivery"
                      type="date"
                      value={reportDeliveryDate}
                      onChange={(e) => setReportDeliveryDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Remarks</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
          </div>
        </main>

        {/* Footer matching billing page style */}
        <div className="border-t bg-background px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={loading || !selectedPatient || serviceItems.length === 0}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('print')}
            disabled={loading || !selectedPatient || serviceItems.length === 0}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('email')}
            disabled={loading || !selectedPatient || serviceItems.length === 0}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button
            onClick={() => handleSubmit('generate')}
            disabled={loading || !selectedPatient || serviceItems.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 mr-2" />
                Generate Invoice
              </>
            )}
          </Button>
          </div>
        </div>
      </div>
      
      {/* Custom Item Modal */}
      <Dialog open={showCustomItemModal} onOpenChange={setShowCustomItemModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
            <DialogDescription>
              Add a custom diagnostic service with manual pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-name">Service Name *</Label>
              <Input
                id="custom-name"
                placeholder="e.g., Special Blood Test"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-category">Category</Label>
              <Select value={customItemCategory} onValueChange={setCustomItemCategory}>
                <SelectTrigger id="custom-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="Laboratory">Laboratory</SelectItem>
                  <SelectItem value="Other Diagnostic">Other Diagnostic</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Procedure">Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-price">Price (₹) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="custom-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomItemModal(false)
                setCustomItemName("")
                setCustomItemCategory("Other Diagnostic")
                setCustomItemPrice("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addCustomItem}
              disabled={!customItemName.trim() || !customItemPrice || parseFloat(customItemPrice) <= 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
