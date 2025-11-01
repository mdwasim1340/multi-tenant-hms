"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Stethoscope, CheckCircle2, Zap, ChevronRight } from "lucide-react"

export default function AppointmentCreation() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [step, setStep] = useState(1)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    appointmentType: "",
    date: "",
    notes: "",
  })

  const providers = [
    {
      id: "dr-smith",
      name: "Dr. James Smith",
      specialty: "Cardiology",
      availability: "Available",
      nextSlot: "Today 2:00 PM",
      rating: 4.8,
      aiScore: "High Priority Match",
    },
    {
      id: "dr-johnson",
      name: "Dr. Emily Johnson",
      specialty: "Internal Medicine",
      availability: "Available",
      nextSlot: "Tomorrow 10:00 AM",
      rating: 4.9,
      aiScore: "Perfect Match",
    },
    {
      id: "dr-williams",
      name: "Dr. Robert Williams",
      specialty: "Cardiology",
      availability: "Busy",
      nextSlot: "Jan 25, 3:00 PM",
      rating: 4.7,
      aiScore: "Good Match",
    },
  ]

  const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"]

  const appointmentTypes = [
    { id: "consultation", label: "General Consultation", duration: "30 min" },
    { id: "followup", label: "Follow-up Visit", duration: "20 min" },
    { id: "procedure", label: "Procedure", duration: "60 min" },
    { id: "emergency", label: "Emergency", duration: "Urgent" },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const steps = [
    { number: 1, label: "Patient Info" },
    { number: 2, label: "Select Provider" },
    { number: 3, label: "Choose Time" },
    { number: 4, label: "Confirm" },
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
              <h1 className="text-3xl font-bold text-foreground">Create New Appointment</h1>
              <p className="text-muted-foreground mt-1">Schedule an appointment with an available provider</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => (
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
              ))}
            </div>

            {/* AI Insights */}
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">AI-Powered Scheduling</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our system will prioritize appointments based on urgency, provider expertise, and patient history
                      to ensure optimal care.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                {/* Step 1: Patient Information */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Patient Information</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Patient Name *</label>
                          <Input
                            name="patientName"
                            value={formData.patientName}
                            onChange={handleInputChange}
                            placeholder="Select or enter patient name"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Email *</label>
                          <Input
                            name="patientEmail"
                            type="email"
                            value={formData.patientEmail}
                            onChange={handleInputChange}
                            placeholder="patient@example.com"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Appointment Type *</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {appointmentTypes.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => setFormData((prev) => ({ ...prev, appointmentType: type.id }))}
                                className={`p-3 border rounded-lg text-left transition-colors ${
                                  formData.appointmentType === type.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <p className="font-medium text-foreground">{type.label}</p>
                                <p className="text-xs text-muted-foreground">{type.duration}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Additional Notes</label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Any specific concerns or requirements..."
                            className="w-full mt-2 p-3 border border-border rounded-lg bg-input text-foreground"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Provider */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Select Provider</h2>
                      <p className="text-muted-foreground mb-4">
                        AI has ranked providers based on expertise and availability
                      </p>

                      <div className="space-y-3">
                        {providers.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => setSelectedProvider(provider.id)}
                            className={`w-full p-4 border rounded-lg text-left transition-colors ${
                              selectedProvider === provider.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{provider.name}</h3>
                                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                    {provider.aiScore}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                  <Stethoscope className="w-4 h-4" />
                                  {provider.specialty}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {provider.nextSlot}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">⭐ {provider.rating}</p>
                                <p className="text-xs text-muted-foreground mt-1">{provider.availability}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Choose Time */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Select Appointment Time</h2>
                      <div className="mb-6">
                        <label className="text-sm font-medium text-foreground">Date *</label>
                        <Input
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">Available Time Slots</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 border rounded-lg text-center font-medium transition-colors ${
                                selectedTime === time
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 text-foreground"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">Recommended Time</p>
                          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                            Based on provider availability and patient history, 2:00 PM is the optimal time slot.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-4">Confirm Appointment</h2>
                      <p className="text-muted-foreground mb-6">Please review the details before confirming</p>

                      <div className="space-y-4">
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Patient</p>
                          <p className="font-semibold text-foreground">{formData.patientName}</p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Provider</p>
                          <p className="font-semibold text-foreground">
                            {providers.find((p) => p.id === selectedProvider)?.name}
                          </p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Date & Time</p>
                          <p className="font-semibold text-foreground">
                            {formData.date} at {selectedTime}
                          </p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-semibold text-foreground">
                            {appointmentTypes.find((t) => t.id === formData.appointmentType)?.label}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex gap-3">
                        <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">AI Insights</p>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                            <li>• Patient has no conflicting appointments</li>
                            <li>• Provider specializes in patient's condition</li>
                            <li>• Estimated wait time: 5 minutes</li>
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
                {step === steps.length ? "Confirm Appointment" : "Next"}
                {step < steps.length && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
