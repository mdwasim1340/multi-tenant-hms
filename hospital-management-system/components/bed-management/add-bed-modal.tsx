"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Bed, MapPin, Settings } from "lucide-react"

interface BedData {
  bedNumber: string
  bedType: 'Standard' | 'ICU' | 'Isolation' | 'Pediatric' | 'Bariatric' | 'Maternity'
  floor: string
  wing: string
  room: string
  equipment: string[]
  features: string[]
  status: 'Available' | 'Maintenance' | 'Reserved'
  categoryId?: number // Add category ID to the interface
}

interface AddBedModalProps {
  departmentName: string
  categoryId?: number
  isOpen: boolean
  onClose: () => void
  onAdd: (bedData: BedData) => void
}

export function AddBedModal({ departmentName, categoryId, isOpen, onClose, onAdd }: AddBedModalProps) {
  const [bedNumber, setBedNumber] = useState("")
  const [bedType, setBedType] = useState<'Standard' | 'ICU' | 'Isolation' | 'Pediatric' | 'Bariatric' | 'Maternity'>('Standard')
  const [floor, setFloor] = useState("")
  const [wing, setWing] = useState("")
  const [room, setRoom] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [status, setStatus] = useState<'Available' | 'Maintenance' | 'Reserved'>('Available')
  const [customEquipment, setCustomEquipment] = useState("")

  const equipmentOptions = [
    "Monitor",
    "IV Stand",
    "Ventilator",
    "Defibrillator",
    "Oxygen Supply",
    "Suction Unit",
    "Infusion Pump",
    "Patient Lift",
    "Bedside Table",
    "Overbed Table",
    "Call Button",
    "Privacy Curtain"
  ]

  const featureOptions = [
    "Adjustable Height",
    "Electric Controls",
    "Bariatric Capacity",
    "Isolation Compatible",
    "X-ray Compatible",
    "CPR Position",
    "Trendelenburg Position",
    "Side Rails",
    "Brake System",
    "Battery Backup"
  ]

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setSelectedEquipment([...selectedEquipment, equipment])
    } else {
      setSelectedEquipment(selectedEquipment.filter(item => item !== equipment))
    }
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures([...selectedFeatures, feature])
    } else {
      setSelectedFeatures(selectedFeatures.filter(item => item !== feature))
    }
  }

  const addCustomEquipment = () => {
    if (customEquipment.trim() && !selectedEquipment.includes(customEquipment.trim())) {
      setSelectedEquipment([...selectedEquipment, customEquipment.trim()])
      setCustomEquipment("")
    }
  }

  const handleSubmit = () => {
    const bedData: BedData = {
      bedNumber,
      bedType,
      floor,
      wing,
      room,
      equipment: selectedEquipment,
      features: selectedFeatures,
      status,
      categoryId // Include the category ID
    }
    onAdd(bedData)
  }

  const isFormValid = bedNumber.trim() && floor.trim() && wing.trim() && room.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Bed to {departmentName}
          </DialogTitle>
          <DialogDescription>
            Configure a new bed with equipment and features for the {departmentName} department
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Bed Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedNumber">Bed Number *</Label>
                  <Input
                    id="bedNumber"
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    placeholder="e.g., 301"
                  />
                </div>
                <div>
                  <Label htmlFor="bedType">Bed Type *</Label>
                  <Select value={bedType} onValueChange={(value: any) => setBedType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="Isolation">Isolation</SelectItem>
                      <SelectItem value="Pediatric">Pediatric</SelectItem>
                      <SelectItem value="Bariatric">Bariatric</SelectItem>
                      <SelectItem value="Maternity">Maternity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="status">Initial Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="floor">Floor *</Label>
                  <Input
                    id="floor"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <Label htmlFor="wing">Wing *</Label>
                  <Input
                    id="wing"
                    value={wing}
                    onChange={(e) => setWing(e.target.value)}
                    placeholder="e.g., A"
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room Number *</Label>
                  <Input
                    id="room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g., 301"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Equipment & Accessories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Available Equipment</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {equipmentOptions.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={selectedEquipment.includes(equipment)}
                        onCheckedChange={(checked) => 
                          handleEquipmentChange(equipment, checked as boolean)
                        }
                      />
                      <Label htmlFor={equipment} className="text-sm">
                        {equipment}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="customEquipment">Add Custom Equipment</Label>
                <div className="flex gap-2">
                  <Input
                    id="customEquipment"
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    placeholder="Enter custom equipment name..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomEquipment()}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addCustomEquipment}
                    disabled={!customEquipment.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {selectedEquipment.length > 0 && (
                <div>
                  <Label>Selected Equipment ({selectedEquipment.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEquipment.map((equipment) => (
                      <div
                        key={equipment}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {equipment}
                        <button
                          onClick={() => handleEquipmentChange(equipment, false)}
                          className="hover:bg-primary/20 rounded-full p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bed Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bed Features & Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Bed Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {featureOptions.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={selectedFeatures.includes(feature)}
                        onCheckedChange={(checked) => 
                          handleFeatureChange(feature, checked as boolean)
                        }
                      />
                      <Label htmlFor={feature} className="text-sm">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedFeatures.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Features ({selectedFeatures.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="bg-secondary/50 text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {feature}
                        <button
                          onClick={() => handleFeatureChange(feature, false)}
                          className="hover:bg-secondary/70 rounded-full p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bed Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p><strong>Bed:</strong> {bedNumber || 'Not specified'} ({bedType})</p>
                <p><strong>Location:</strong> Floor {floor || 'N/A'}, Wing {wing || 'N/A'}, Room {room || 'N/A'}</p>
                <p><strong>Department:</strong> {departmentName}</p>
                <p><strong>Equipment:</strong> {selectedEquipment.length} items selected</p>
                <p><strong>Features:</strong> {selectedFeatures.length} features enabled</p>
                <p><strong>Initial Status:</strong> {status}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="bg-primary hover:bg-primary/90"
          >
            Add Bed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}