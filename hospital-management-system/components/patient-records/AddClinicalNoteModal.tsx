'use client';

/**
 * Add Clinical Note Modal Component
 * Modal for adding new clinical notes (progress notes, admission notes, etc.) for a patient
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClinicalNote } from '@/lib/api/medical-records-module';

interface AddClinicalNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: number;
}

// Note type options
const NOTE_TYPES = [
  { value: 'progress', label: 'Progress Note' },
  { value: 'admission', label: 'Admission Note' },
  { value: 'discharge', label: 'Discharge Summary' },
  { value: 'consultation', label: 'Consultation Note' },
  { value: 'procedure', label: 'Procedure Note' },
  { value: 'operative', label: 'Operative Note' },
  { value: 'follow_up', label: 'Follow-up Note' },
];

// Visit type options
const VISIT_TYPES = [
  { value: 'OPD', label: 'OPD (Outpatient)' },
  { value: 'IPD', label: 'IPD (Inpatient)' },
  { value: 'ER', label: 'ER (Emergency)' },
];

// Department options
const DEPARTMENTS = [
  { value: 'general_medicine', label: 'General Medicine' },
  { value: 'internal_medicine', label: 'Internal Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'icu', label: 'ICU' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'ent', label: 'ENT' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
];

// Author/Doctor options
const AUTHORS = [
  { value: 'dr_smith', label: 'Dr. John Smith' },
  { value: 'dr_johnson', label: 'Dr. Sarah Johnson' },
  { value: 'dr_williams', label: 'Dr. Michael Williams' },
  { value: 'dr_brown', label: 'Dr. Emily Brown' },
  { value: 'dr_davis', label: 'Dr. Robert Davis' },
  { value: 'dr_miller', label: 'Dr. Jennifer Miller' },
];

export function AddClinicalNoteModal({
  open,
  onClose,
  onSuccess,
  patientId,
}: AddClinicalNoteModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState('');


  // Form state
  const [formData, setFormData] = useState({
    note_type: 'progress',
    title: '',
    visit_type: '',
    department: '',
    author: '',
    content: '',
    chief_complaint: '',
    history_of_present_illness: '',
    physical_examination: '',
    assessment: '',
    plan: '',
    status: 'draft',
  });

  const addDiagnosis = () => {
    if (newDiagnosis.trim() && !diagnoses.includes(newDiagnosis.trim())) {
      setDiagnoses([...diagnoses, newDiagnosis.trim()]);
      setNewDiagnosis('');
    }
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in the title and note content.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await createClinicalNote({
        patient_id: patientId,
        note_type: formData.note_type,
        title: formData.title,
        visit_type: formData.visit_type || undefined,
        department: formData.department || undefined,
        author_name: formData.author || undefined,
        content: formData.content,
        chief_complaint: formData.chief_complaint || undefined,
        history_of_present_illness: formData.history_of_present_illness || undefined,
        physical_examination: formData.physical_examination || undefined,
        assessment: formData.assessment || undefined,
        plan: formData.plan || undefined,
        diagnoses: diagnoses.length > 0 ? diagnoses : undefined,
        status: formData.status,
      });

      toast({
        title: 'Success',
        description: 'Clinical note added successfully.',
      });

      // Reset form
      setFormData({
        note_type: 'progress',
        title: '',
        visit_type: '',
        department: '',
        author: '',
        content: '',
        chief_complaint: '',
        history_of_present_illness: '',
        physical_examination: '',
        assessment: '',
        plan: '',
        status: 'draft',
      });
      setDiagnoses([]);

      onSuccess();
    } catch (error: any) {
      console.error('Failed to add clinical note:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add clinical note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Clinical Note
          </DialogTitle>
          <DialogDescription>
            Create a new clinical note for this patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Type and Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="note_type">Note Type *</Label>
              <Select
                value={formData.note_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, note_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Follow-up Visit - Diabetes Management"
              />
            </div>
          </div>

          {/* Visit Type and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_type">Visit Type</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, visit_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Author and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author / Provider</Label>
              <Select
                value={formData.author}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, author: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select author" />
                </SelectTrigger>
                <SelectContent>
                  {AUTHORS.map((author) => (
                    <SelectItem key={author.value} value={author.value}>
                      {author.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label htmlFor="chief_complaint">Chief Complaint</Label>
            <Input
              id="chief_complaint"
              value={formData.chief_complaint}
              onChange={(e) => setFormData((prev) => ({ ...prev, chief_complaint: e.target.value }))}
              placeholder="Patient's main reason for visit"
            />
          </div>

          {/* Note Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Note Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the clinical note content..."
              rows={6}
            />
          </div>

          {/* Assessment */}
          <div className="space-y-2">
            <Label htmlFor="assessment">Assessment</Label>
            <Textarea
              id="assessment"
              value={formData.assessment}
              onChange={(e) => setFormData((prev) => ({ ...prev, assessment: e.target.value }))}
              placeholder="Clinical assessment and findings..."
              rows={3}
            />
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Textarea
              id="plan"
              value={formData.plan}
              onChange={(e) => setFormData((prev) => ({ ...prev, plan: e.target.value }))}
              placeholder="Treatment plan and follow-up..."
              rows={3}
            />
          </div>

          {/* Diagnoses */}
          <div className="space-y-2">
            <Label>Diagnoses</Label>
            <div className="flex gap-2">
              <Input
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
                placeholder="Add diagnosis (e.g., Type 2 Diabetes Mellitus)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDiagnosis();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addDiagnosis}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {diagnoses.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {diagnoses.map((diagnosis, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {diagnosis}
                    <button
                      type="button"
                      onClick={() => removeDiagnosis(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
