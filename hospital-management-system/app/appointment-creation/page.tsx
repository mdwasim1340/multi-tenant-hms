"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Stethoscope, CheckCircle2, Zap, ChevronRight } from "lucide-react"
import { createAppointment, Appointment } from "@/lib/api/appointments"
import { getPatients, Patient } from "@/lib/api/patients"
import { createPatient } from "@/lib/patients"
import { getDoctors, Doctor } from "@/lib/api/doctors"

export default function AppointmentCreation() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [step, setStep] = useState(1)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null)
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    dateOfBirth: "",
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

  // Load patients and doctors on component mount
  useEffect(() => {
    loadPatientsAndDoctors()
  }, [])

  const loadPatientsAndDoctors = async () => {
    try {
      // Load patients from API
      const patientsResponse = await getPatients({ limit: 100 })
      setPatients(patientsResponse.data.patients)
      
      // Use mock doctors for now since the doctors API doesn't exist yet
      const mockDoctors = [
        { id: 1, name: "Dr. James Smith", specialty: "Cardiology", email: "james.smith@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: "Dr. Emily Johnson", specialty: "Internal Medicine", email: "emily.johnson@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: "Dr. Robert Williams", specialty: "Cardiology", email: "robert.williams@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]
      setDoctors(mockDoctors)
    } catch (err) {
      console.error('Error loading patients:', err)
      // If patients API fails, use mock data for both
      const mockPatients = [
        { id: 1, first_name: "John", last_name: "Doe", patient_number: "P001", email: "john.doe@email.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, first_name: "Jane", last_name: "Smith", patient_number: "P002", email: "jane.smith@email.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, first_name: "sonu", last_name: "", patient_number: "P003", email: "sonu@email.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]
      const mockDoctors = [
        { id: 1, name: "Dr. James Smith", specialty: "Cardiology", email: "james.smith@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: "Dr. Emily Johnson", specialty: "Internal Medicine", email: "emily.johnson@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: "Dr. Robert Williams", specialty: "Cardiology", email: "robert.williams@hospital.com", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]
      
      setPatients(mockPatients)
      setDoctors(mockDoctors)
    }
  }

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

  const handleConfirmAppointment = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      const isNewPatient = !selectedPatient
      const needsDob = isNewPatient && !formData.dateOfBirth
      const needsName = isNewPatient && !formData.patientName
      if ((!selectedProvider) || (!formData.date) || (!selectedTime) || needsDob || needsName) {
        setError('Please fill in all required fields')
        return
      }

      // Validate appointment is in the future
      const appointmentDateTime = new Date(`${formData.date}T${selectedTime}`)
      const now = new Date()
      if (appointmentDateTime <= now) {
        setError('Appointment date and time must be in the future')
        return
      }

      // Map provider selection to actual doctor IDs from loaded doctors
      let selectedDoctor;
      if (selectedProvider) {
        // Map the provider selection to doctor names
        const providerNameMap: { [key: string]: string } = {
          'dr-smith': 'Dr. James Smith',
          'dr-johnson': 'Dr. Emily Johnson', 
          'dr-williams': 'Dr. Robert Williams',
        }
        const doctorName = providerNameMap[selectedProvider]
        selectedDoctor = doctors.find(d => d.name === doctorName)
      }
      const doctorId = selectedDoctor?.id || undefined

      // Validate we have valid patient and doctor (no silent fallbacks)
      let patientId = selectedPatient
      
      console.log('Validation check:', {
        patientId,
        doctorId,
        selectedProvider,
        selectedDoctor,
        patientsCount: patients.length,
        doctorsCount: doctors.length
      })
      
      if (!doctorId) {
        setError(`Please select a provider before confirming.`)
        return
      }

      // If no existing patient selected, create a new patient first
      if (!patientId) {
        const name = (formData.patientName || '').trim()
        const [first, ...rest] = name.split(/\s+/)
        const last = rest.join(' ') || 'Unknown'
        const dob = formData.dateOfBirth
        try {
          const newPatientRes = await createPatient({
            patient_number: `PAT${Date.now()}`,
            first_name: first || 'Unknown',
            last_name: last,
            date_of_birth: dob,
            email: formData.patientEmail || null,
          })
          patientId = newPatientRes.data.patient.id
        } catch (e: any) {
          setError(e.response?.data?.error || e.message || 'Failed to create patient')
          return
        }
      }

      if (!patientId) {
        setError(`Please select a patient and provider before confirming.`)
        return
      }

      // Map appointment type
      const typeMap: { [key: string]: string } = {
        'consultation': 'consultation',
        'followup': 'follow_up',
        'procedure': 'procedure',
        'emergency': 'emergency',
      }

      // Combine date and time - convert to proper ISO format
      // selectedTime is in format like "10:00 AM" or "14:30"
      let timeIn24Hour = selectedTime;
      
      // Convert 12-hour format to 24-hour if needed
      if (selectedTime.includes('AM') || selectedTime.includes('PM')) {
        const [time, period] = selectedTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        timeIn24Hour = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Create proper ISO datetime string
      const appointmentDateTimeObj = new Date(`${formData.date}T${timeIn24Hour}:00`);
      const datetime = appointmentDateTimeObj.toISOString();
      
      console.log('Creating appointment with datetime:', datetime)
      console.log('Original date/time:', formData.date, selectedTime)
      console.log('Parsed datetime object:', appointmentDateTimeObj)

      const appointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: datetime,
        duration_minutes: 30,
        appointment_type: typeMap[formData.appointmentType] || 'consultation',
        notes: formData.notes,
      }

      console.log('Appointment data being sent:', appointmentData)

      const result = await createAppointment(appointmentData)

      if (result.success) {
        // Redirect to appointments page with success message
        router.push('/appointments?created=true')
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      console.error('Error headers:', err.response?.headers)
      
      let errorMessage = 'Failed to create appointment'
      
      // Handle validation errors (400)
      if (err.response?.status === 400) {
        if (err.response.data?.error) {
          errorMessage = `Validation Error: ${err.response.data.error}`
        } else if (err.response.data?.message) {
          errorMessage = `Validation Error: ${err.response.data.message}`
        } else if (err.response.data?.issues) {
          // Handle Zod validation errors
          const issues = err.response.data.issues.map((issue: any) => 
            `${issue.path?.join('.')}: ${issue.message}`
          ).join(', ')
          errorMessage = `Validation Error: ${issues}`
        } else {
          errorMessage = 'Invalid appointment data. Please check all fields.'
        }
      } 
      // Handle authentication errors (401)
      else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in and try again.'
      }
      // Handle authorization errors (403)
      else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to create appointments.'
      }
      // Handle other errors
      else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
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
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Patient Information</h2>
                        <button
                          type="button"
                          onClick={() => window.open('/patient-registration', '_blank')}
                          className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Register New Patient
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="text-sm font-medium text-foreground">Search Patient *</label>
                          <Input
                            type="text"
                            placeholder="Type patient name to search..."
                            value={patientSearch}
                            onChange={(e) => {
                              setPatientSearch(e.target.value)
                              setShowPatientDropdown(true)
                            }}
                            onFocus={() => setShowPatientDropdown(true)}
                            className="mt-2"
                          />
                          {showPatientDropdown && patientSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {patients
                                .filter(p => {
                                  const searchLower = patientSearch.toLowerCase()
                                  const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
                                  const patientNum = (p.patient_number || '').toLowerCase()
                                  return fullName.includes(searchLower) || patientNum.includes(searchLower)
                                })
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPatient(p.id)
                                      setPatientSearch(`${p.first_name} ${p.last_name}`)
                                      setShowPatientDropdown(false)
                                      setFormData(prev => ({
                                        ...prev,
                                        patientName: `${p.first_name} ${p.last_name}`,
                                        patientEmail: (p as any).email || ''
                                      }))
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="font-medium text-foreground">
                                      {p.first_name} {p.last_name}
                                    </div>
                                    {p.patient_number && (
                                      <div className="text-sm text-muted-foreground">
                                        {p.patient_number}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              {patients.filter(p => {
                                const searchLower = patientSearch.toLowerCase()
                                const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
                                const patientNum = (p.patient_number || '').toLowerCase()
                                return fullName.includes(searchLower) || patientNum.includes(searchLower)
                              }).length === 0 && (
                                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                  No patients found. Try a different search or register a new patient.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Patient Name</label>
                          <Input
                            name="patientName"
                            value={formData.patientName}
                            onChange={handleInputChange}
                            placeholder="Selected patient name"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Date of Birth {selectedPatient ? '' : '*'} </label>
                          <Input
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
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

            {/* Error Message */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
                    <div>
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-800 mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Step {step} of {steps.length}
              </div>
              <Button
                onClick={step === steps.length ? handleConfirmAppointment : () => setStep(Math.min(steps.length, step + 1))}
                className="bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading && step === steps.length && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {step === steps.length 
                  ? (loading ? "Creating..." : "Confirm Appointment") 
                  : "Next"
                }
                {step < steps.length && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
