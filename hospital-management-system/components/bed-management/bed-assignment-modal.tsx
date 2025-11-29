"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, UserPlus, AlertCircle, CheckCircle, Clock, 
  User, Calendar, Stethoscope, Activity, Loader2, Bed, ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import bedManagementApi from "@/lib/api/beds"
import { useBedCategories } from "@/hooks/use-bed-categories"

interface Patient {
  id: string
  name: string
  mrn: string
  age: number
  gender: string
  dateOfBirth: string
  condition?: string
  allergies?: string[]
  currentMedications?: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

interface BedOption {
  id: number
  bed_number: string
  department_id: number
  category_id?: number
  bed_type: string
  status: string
  floor_number?: number
  room_number?: string
  wing?: string
  unit?: string
}

interface BedAssignmentModalProps {
  bed: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}


export function BedAssignmentModal({ bed, isOpen, onClose, onSuccess }: BedAssignmentModalProps) {
  // Step can now include 'selectCategory' and 'selectBed' when no bed is pre-selected
  const [step, setStep] = useState<'selectCategory' | 'selectBed' | 'search' | 'select' | 'confirm' | 'new'>('search')
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  
  // New states for category and bed selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedBed, setSelectedBed] = useState<BedOption | null>(null)
  const [availableBeds, setAvailableBeds] = useState<BedOption[]>([])
  const [loadingBeds, setLoadingBeds] = useState(false)
  
  // Fetch bed categories
  const { categories, loading: categoriesLoading } = useBedCategories()
  
  const [newPatientData, setNewPatientData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    admissionReason: "",
    assignedDoctor: "",
    assignedNurse: "",
    condition: "Stable",
    allergies: "",
    currentMedications: "",
    notes: ""
  })

  // Determine initial step based on whether a bed is pre-selected
  useEffect(() => {
    if (isOpen) {
      if (bed) {
        // Bed is pre-selected, go directly to patient search
        setStep('search')
        setSelectedBed(bed)
      } else {
        // No bed selected, start with category selection
        setStep('selectCategory')
        setSelectedBed(null)
        setSelectedCategoryId(null)
      }
    }
  }, [isOpen, bed])

  // Fetch available beds when category is selected
  useEffect(() => {
    if (selectedCategoryId && step === 'selectBed') {
      fetchAvailableBedsByCategory(selectedCategoryId)
    }
  }, [selectedCategoryId, step])

  // Fetch available beds for a category
  const fetchAvailableBedsByCategory = async (categoryId: number) => {
    setLoadingBeds(true)
    try {
      // Fetch beds filtered by category_id and status directly from API
      const response = await bedManagementApi.beds.getBeds({ 
        category_id: categoryId,
        status: 'available' 
      })
      const beds = response.beds || []
      
      console.log('🔍 Fetched beds for category', categoryId, ':', beds.length, 'beds')
      
      // ALWAYS filter by category_id on client side to ensure correct filtering
      // This handles cases where API might not filter correctly or beds have wrong category_id
      const filteredBeds = beds.filter((b: BedOption) => {
        const statusMatch = b.status?.toLowerCase() === 'available'
        const categoryMatch = b.category_id === categoryId
        
        // Only include beds that match BOTH category AND status
        return statusMatch && categoryMatch
      })
      
      console.log('🔍 Filtered beds for category', categoryId, ':', filteredBeds.length)
      
      // If no beds found with category_id filter, the beds might not have category_id set
      // In that case, show a message but don't fall back to showing all beds
      if (filteredBeds.length === 0 && beds.length > 0) {
        console.warn('⚠️ No beds found with category_id =', categoryId, '. Beds may not have category_id assigned.')
        toast.warning(`No beds found in this category. Beds may need to be assigned to this category.`)
      }
      
      setAvailableBeds(filteredBeds)
    } catch (error) {
      console.error('Error fetching beds:', error)
      toast.error("Failed to load available beds")
      setAvailableBeds([])
    } finally {
      setLoadingBeds(false)
    }
  }


  // Mock patient data for demonstration
  const mockPatients: Patient[] = [
    {
      id: "1",
      name: "John Smith",
      mrn: "MRN-001234",
      age: 45,
      gender: "Male",
      dateOfBirth: "1979-03-15",
      condition: "Stable",
      allergies: ["Penicillin", "Shellfish"],
      currentMedications: ["Lisinopril 10mg", "Metformin 500mg"],
      emergencyContact: {
        name: "Jane Smith",
        phone: "(555) 123-4567",
        relationship: "Spouse"
      }
    },
    {
      id: "2",
      name: "Maria Garcia",
      mrn: "MRN-001235",
      age: 32,
      gender: "Female",
      dateOfBirth: "1992-07-22",
      condition: "Fair",
      allergies: ["Latex"],
      currentMedications: ["Ibuprofen 400mg"],
      emergencyContact: {
        name: "Carlos Garcia",
        phone: "(555) 234-5678",
        relationship: "Husband"
      }
    },
    {
      id: "3",
      name: "Robert Johnson",
      mrn: "MRN-001236",
      age: 67,
      gender: "Male",
      dateOfBirth: "1957-11-08",
      condition: "Critical",
      allergies: ["Aspirin"],
      currentMedications: ["Warfarin 5mg", "Digoxin 0.25mg", "Furosemide 40mg"],
      emergencyContact: {
        name: "Susan Johnson",
        phone: "(555) 345-6789",
        relationship: "Daughter"
      }
    }
  ]

  // Handle category selection
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId)
    setStep('selectBed')
  }

  // Handle bed selection from category
  const handleBedSelect = (bedOption: BedOption) => {
    setSelectedBed(bedOption)
    setStep('search')
  }

  // Search for existing patients
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const results = mockPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      setSearchResults(results)
      setStep('select')
    } catch (error) {
      toast.error("Failed to search patients")
    } finally {
      setLoading(false)
    }
  }

  // Select patient from search results
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setStep('confirm')
  }


  // Get the effective bed for assignment (either pre-selected or user-selected)
  const effectiveBed = useMemo(() => {
    return bed || selectedBed
  }, [bed, selectedBed])

  // Assign patient to bed
  const handleAssignPatient = async () => {
    if (!selectedPatient && step !== 'new') return
    if (!effectiveBed) {
      toast.error("Please select a bed first")
      return
    }

    setLoading(true)
    try {
      // Prepare assignment data
      const assignmentData = {
        bed_id: effectiveBed?.id || parseInt(effectiveBed?.bedNumber?.replace(/\D/g, '') || effectiveBed?.bed_number?.replace(/\D/g, '') || '0'),
        patient_name: selectedPatient ? selectedPatient.name : `${newPatientData.firstName} ${newPatientData.lastName}`,
        patient_mrn: selectedPatient?.mrn || `MRN-${Date.now()}`,
        patient_age: selectedPatient?.age || parseInt(newPatientData.dateOfBirth ? String(new Date().getFullYear() - new Date(newPatientData.dateOfBirth).getFullYear()) : '0'),
        patient_gender: selectedPatient?.gender || newPatientData.gender,
        admission_date: new Date().toISOString(),
        condition: selectedPatient?.condition || newPatientData.condition || 'Stable',
        assigned_doctor: newPatientData.assignedDoctor || 'Dr. Unassigned',
        assigned_nurse: newPatientData.assignedNurse || 'Nurse Unassigned',
        admission_reason: newPatientData.admissionReason || 'General admission',
        allergies: selectedPatient?.allergies?.join(', ') || newPatientData.allergies,
        current_medications: selectedPatient?.currentMedications?.join(', ') || newPatientData.currentMedications,
        emergency_contact_name: selectedPatient?.emergencyContact?.name || newPatientData.emergencyContactName,
        emergency_contact_phone: selectedPatient?.emergencyContact?.phone || newPatientData.emergencyContactPhone,
        notes: newPatientData.notes || ''
      };

      // Call the enhanced assignment API
      const result = await bedManagementApi.enhanced.createEnhancedAssignment(assignmentData);
      
      const patientName = assignmentData.patient_name;
      const bedNumber = effectiveBed?.bedNumber || effectiveBed?.bed_number || 'bed';
      toast.success(`${patientName} successfully assigned to ${bedNumber}`, {
        description: 'Bed status updated and activity logged'
      });
      
      onSuccess();
      onClose();
      resetModal();
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error("Failed to assign patient to bed", {
        description: error.response?.data?.error || error.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  }

  // Reset modal state
  const resetModal = () => {
    setStep(bed ? 'search' : 'selectCategory')
    setSearchQuery("")
    setSelectedPatient(null)
    setSearchResults([])
    setSelectedCategoryId(null)
    setSelectedBed(null)
    setAvailableBeds([])
    setNewPatientData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      admissionReason: "",
      assignedDoctor: "",
      assignedNurse: "",
      condition: "Stable",
      allergies: "",
      currentMedications: "",
      notes: ""
    })
  }

  // Handle modal close
  const handleClose = () => {
    onClose()
    resetModal()
  }

  // Get condition color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'Fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  // Get selected category name
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId || !categories) return null
    const category = categories.find(c => c.id === selectedCategoryId)
    return category?.name || null
  }, [selectedCategoryId, categories])


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1400px] w-[98vw] min-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {effectiveBed ? `Assign Patient to ${effectiveBed?.bedNumber || effectiveBed?.bed_number}` : 'New Bed Assignment'}
          </DialogTitle>
          <DialogDescription>
            {!bed && !selectedBed 
              ? 'Select a bed category and bed, then search for a patient or register a new one'
              : 'Search for an existing patient or register a new patient for bed assignment'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bed Information - Show when bed is selected */}
          {effectiveBed && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Bed {effectiveBed?.bedNumber || effectiveBed?.bed_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {effectiveBed?.department || effectiveBed?.unit || selectedCategoryName || 'General'} • 
                      Floor {effectiveBed?.floor || effectiveBed?.floor_number || '1'} • 
                      {effectiveBed?.bedType || effectiveBed?.bed_type || 'Standard'} bed
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Available
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Navigation - Updated to include category and bed selection steps */}
          <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-2">
            {!bed && (
              <>
                {/* Category Selection Step */}
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 'selectCategory' ? 'bg-primary text-primary-foreground' :
                    ['selectBed', 'search', 'select', 'confirm', 'new'].includes(step) ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {['selectBed', 'search', 'select', 'confirm', 'new'].includes(step) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      1
                    )}
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Category</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                
                {/* Bed Selection Step */}
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 'selectBed' ? 'bg-primary text-primary-foreground' :
                    ['search', 'select', 'confirm', 'new'].includes(step) ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {['search', 'select', 'confirm', 'new'].includes(step) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      2
                    )}
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Bed</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </>
            )}
            
            {/* Patient Search Step */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'search' || step === 'new' ? 'bg-primary text-primary-foreground' :
                ['select', 'confirm'].includes(step) ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {['select', 'confirm'].includes(step) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  bed ? 1 : 3
                )}
              </div>
              <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Patient</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            
            {/* Selection Step */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'select' ? 'bg-primary text-primary-foreground' :
                step === 'confirm' ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {step === 'confirm' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  bed ? 2 : 4
                )}
              </div>
              <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Select</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            
            {/* Confirm Step */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'confirm' ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {bed ? 3 : 5}
              </div>
              <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Confirm</span>
            </div>
          </div>


          {/* Step Content */}
          
          {/* STEP: Select Category */}
          {step === 'selectCategory' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Bed Category</h3>
                <p className="text-muted-foreground">Choose a category to view available beds</p>
              </div>

              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading categories...</span>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card 
                      key={category.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            <Bed className="w-5 h-5" style={{ color: category.color }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {category.description || 'Bed category'}
                            </p>
                            {category.bed_count !== undefined && (
                              <Badge variant="outline" className="mt-2">
                                {category.bed_count} beds
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bed categories found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please create bed categories in Settings first
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP: Select Bed from Category */}
          {step === 'selectBed' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Available Bed</h3>
                <p className="text-muted-foreground">
                  Choose a bed from <span className="font-medium">{selectedCategoryName}</span>
                </p>
              </div>

              {loadingBeds ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading available beds...</span>
                </div>
              ) : availableBeds.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {availableBeds.map((bedOption) => (
                    <Card 
                      key={bedOption.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:border-green-500 border-2"
                      onClick={() => handleBedSelect(bedOption)}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-2">
                            <Bed className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <h4 className="font-semibold text-foreground">{bedOption.bed_number}</h4>
                          <p className="text-xs text-muted-foreground">
                            Floor {bedOption.floor_number || '1'} • {bedOption.bed_type || 'Standard'}
                          </p>
                          <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                            Available
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No available beds in this category</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All beds are currently occupied or under maintenance
                  </p>
                </div>
              )}

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => {
                  setStep('selectCategory')
                  setSelectedCategoryId(null)
                  setAvailableBeds([])
                }}>
                  Back to Categories
                </Button>
              </div>
            </div>
          )}


          {/* STEP: Search Patient */}
          {step === 'search' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Find Patient</h3>
                <p className="text-muted-foreground">Search by patient name or MRN</p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter patient name or MRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-4">or</p>
                <Button variant="outline" onClick={() => setStep('new')}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register New Patient
                </Button>
              </div>

              {/* Back button when bed was selected from category */}
              {!bed && selectedBed && (
                <div className="flex justify-start pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setStep('selectBed')
                    setSelectedBed(null)
                  }}>
                    Back to Bed Selection
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP: Select Patient from Results */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Patient</h3>
                <p className="text-muted-foreground">Choose from search results</p>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No patients found matching your search</p>
                  <Button variant="outline" className="mt-4" onClick={() => setStep('search')}>
                    Try Different Search
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {patient.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-foreground">{patient.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {patient.mrn} • {patient.age}y {patient.gender}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </p>
                              {patient.allergies && patient.allergies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="text-xs text-muted-foreground">Allergies:</span>
                                  {patient.allergies.map((allergy, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {allergy}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge className={getConditionColor(patient.condition || 'Stable')}>
                            {patient.condition || 'Stable'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('search')}>
                  Back to Search
                </Button>
                <Button variant="outline" onClick={() => setStep('new')}>
                  Register New Patient Instead
                </Button>
              </div>
            </div>
          )}


          {/* STEP: Confirm Assignment */}
          {step === 'confirm' && selectedPatient && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Confirm Assignment</h3>
                <p className="text-muted-foreground">Review patient information before assignment</p>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-foreground">{selectedPatient.name}</h4>
                      <p className="text-muted-foreground">
                        {selectedPatient.mrn} • {selectedPatient.age} years old • {selectedPatient.gender}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label className="text-sm font-medium">Current Condition</Label>
                          <Badge className={getConditionColor(selectedPatient.condition || 'Stable')}>
                            {selectedPatient.condition || 'Stable'}
                          </Badge>
                        </div>
                        
                        {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Allergies</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedPatient.allergies.map((allergy, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedPatient.emergencyContact && (
                          <div>
                            <Label className="text-sm font-medium">Emergency Contact</Label>
                            <p className="text-sm text-foreground">
                              {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedPatient.emergencyContact.phone}
                            </p>
                          </div>
                        )}
                        
                        {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Current Medications</Label>
                            <div className="space-y-1 mt-1">
                              {selectedPatient.currentMedications.map((med, idx) => (
                                <p key={idx} className="text-sm text-foreground">{med}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                      Assignment Confirmation
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      {selectedPatient.name} will be assigned to {effectiveBed?.bedNumber || effectiveBed?.bed_number} in {effectiveBed?.department || effectiveBed?.unit || selectedCategoryName || 'the selected ward'}. 
                      This action will update the bed status and notify the care team.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('select')}>
                  Back to Selection
                </Button>
                <Button onClick={handleAssignPatient} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Assignment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}


          {/* STEP: Register New Patient */}
          {step === 'new' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Register New Patient</h3>
                <p className="text-muted-foreground">Enter patient information for quick admission</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newPatientData.firstName}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newPatientData.lastName}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newPatientData.dateOfBirth}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={newPatientData.gender} onValueChange={(value) => setNewPatientData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newPatientData.phone}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Initial Condition</Label>
                  <Select value={newPatientData.condition} onValueChange={(value) => setNewPatientData(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Stable">Stable</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="admissionReason">Admission Reason *</Label>
                  <Textarea
                    id="admissionReason"
                    value={newPatientData.admissionReason}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, admissionReason: e.target.value }))}
                    placeholder="Brief description of admission reason"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignedDoctor">Assigned Doctor</Label>
                    <Input
                      id="assignedDoctor"
                      value={newPatientData.assignedDoctor}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, assignedDoctor: e.target.value }))}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignedNurse">Assigned Nurse</Label>
                    <Input
                      id="assignedNurse"
                      value={newPatientData.assignedNurse}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, assignedNurse: e.target.value }))}
                      placeholder="Nurse Johnson"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    value={newPatientData.allergies}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="Penicillin, Shellfish (separate with commas)"
                  />
                </div>

                <div>
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    value={newPatientData.currentMedications}
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, currentMedications: e.target.value }))}
                    placeholder="List current medications and dosages"
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={newPatientData.emergencyContactName}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={newPatientData.emergencyContactPhone}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={newPatientData.emergencyContactRelationship}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                      placeholder="Spouse, Parent, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('search')}>
                  Back to Search
                </Button>
                <Button 
                  onClick={handleAssignPatient} 
                  disabled={loading || !newPatientData.firstName || !newPatientData.lastName || !newPatientData.dateOfBirth || !newPatientData.gender || !newPatientData.admissionReason || !effectiveBed}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register & Assign
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
