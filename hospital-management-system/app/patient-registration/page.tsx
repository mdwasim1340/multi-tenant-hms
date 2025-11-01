"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, CheckCircle2, Zap, ChevronRight, Phone, Heart, AlertTriangle } from "lucide-react"

export default function PatientRegistration() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    email: "",
    phone: "",
    address: "",
    insuranceProvider: "",
    insuranceId: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const steps = [
    { number: 1, label: "Personal Info", icon: Users },
    { number: 2, label: "Contact & Insurance", icon: Phone },
    { number: 3, label: "Medical History", icon: Heart },
    { number: 4, label: "Review & Submit", icon: CheckCircle2 },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Patient Registration</h1>
              <p className="text-muted-foreground mt-1">Complete the registration process to add a new patient</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const Icon = s.icon
                return (
                  <div key={s.number} className="flex items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                        step >= s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-foreground">{s.label}</p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                          step > s.number ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* AI Insights Card */}
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">AI-Powered Registration</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our system will automatically detect duplicate records, assess health risks, and suggest relevant
                      medical history based on your input.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Personal Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">First Name *</label>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="John"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Last Name *</label>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Doe"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Date of Birth *</label>
                          <Input
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Gender</label>
                          <Input placeholder="Select gender" className="mt-2" />
                        </div>
                      </div>
                    </div>

                    {/* AI Duplicate Detection */}
                    <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">No Duplicate Found</p>
                          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                            AI analysis confirms this is a new patient record.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact & Insurance */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Contact & Insurance Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Email *</label>
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="john@example.com"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Phone Number *</label>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 123-4567"
                            className="mt-2"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-foreground">Address *</label>
                          <Input
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="123 Main St, City, State 12345"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Insurance Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Insurance Provider</label>
                          <Input
                            name="insuranceProvider"
                            value={formData.insuranceProvider}
                            onChange={handleInputChange}
                            placeholder="Blue Cross Blue Shield"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Insurance ID</label>
                          <Input
                            name="insuranceId"
                            value={formData.insuranceId}
                            onChange={handleInputChange}
                            placeholder="ABC123456789"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Contact Name</label>
                          <Input
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            placeholder="Jane Doe"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Contact Phone</label>
                          <Input
                            name="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 987-6543"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Medical History */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Medical History</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Known Allergies</label>
                          <textarea
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleInputChange}
                            placeholder="List any known allergies (e.g., Penicillin, Peanuts)"
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Current Medications</label>
                          <textarea
                            name="currentMedications"
                            value={formData.currentMedications}
                            onChange={handleInputChange}
                            placeholder="List current medications with dosages"
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Medical History</label>
                          <textarea
                            name="medicalHistory"
                            value={formData.medicalHistory}
                            onChange={handleInputChange}
                            placeholder="Previous surgeries, chronic conditions, family history"
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI Health Risk Assessment */}
                    <div className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900 dark:text-amber-100">Health Risk Assessment</p>
                          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                            Based on medical history, this patient has moderate risk factors. Recommend comprehensive
                            screening.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Review Registration</h2>
                      <p className="text-muted-foreground mb-6">Please review the information before submitting</p>

                      <div className="space-y-4">
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Patient Name</p>
                          <p className="font-semibold text-foreground">
                            {formData.firstName} {formData.lastName}
                          </p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Contact Information</p>
                          <p className="font-semibold text-foreground">{formData.email}</p>
                          <p className="font-semibold text-foreground">{formData.phone}</p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Insurance Provider</p>
                          <p className="font-semibold text-foreground">
                            {formData.insuranceProvider || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex gap-3">
                        <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">AI Recommendations</p>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                            <li>• Schedule comprehensive health screening</li>
                            <li>• Review medication interactions</li>
                            <li>• Set up follow-up appointment in 2 weeks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Step {step} of {steps.length}
              </div>
              <Button
                onClick={() => setStep(Math.min(steps.length, step + 1))}
                className="bg-primary hover:bg-primary/90"
              >
                {step === steps.length ? "Submit Registration" : "Next"}
                {step < steps.length && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
