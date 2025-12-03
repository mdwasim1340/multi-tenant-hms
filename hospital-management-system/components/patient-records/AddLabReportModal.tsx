'use client';

/**
 * Add Lab Report Modal Component
 * Modal for adding new lab results for a patient with image attachment support
 */

import { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FlaskConical, X, FileImage, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLabTests, type LabTest } from '@/lib/api/lab-tests';
import { createLabReport } from '@/lib/api/medical-records-module';
import { uploadFileThroughBackend } from '@/lib/api/medical-records';

interface AddLabReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: number;
}

export function AddLabReportModal({
  open,
  onClose,
  onSuccess,
  patientId,
}: AddLabReportModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Sample type options
  const SAMPLE_TYPES = [
    { value: 'blood', label: 'Blood' },
    { value: 'serum', label: 'Serum' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'urine', label: 'Urine' },
    { value: 'stool', label: 'Stool' },
    { value: 'csf', label: 'CSF (Cerebrospinal Fluid)' },
    { value: 'sputum', label: 'Sputum' },
    { value: 'swab', label: 'Swab' },
    { value: 'tissue', label: 'Tissue' },
    { value: 'other', label: 'Other' },
  ];

  // Sample doctor names (in real app, fetch from staff/users API)
  const DOCTORS = [
    { value: 'dr_smith', label: 'Dr. John Smith' },
    { value: 'dr_johnson', label: 'Dr. Sarah Johnson' },
    { value: 'dr_williams', label: 'Dr. Michael Williams' },
    { value: 'dr_brown', label: 'Dr. Emily Brown' },
    { value: 'dr_davis', label: 'Dr. Robert Davis' },
    { value: 'dr_miller', label: 'Dr. Jennifer Miller' },
    { value: 'dr_wilson', label: 'Dr. David Wilson' },
    { value: 'dr_moore', label: 'Dr. Lisa Moore' },
    { value: 'dr_taylor', label: 'Dr. James Taylor' },
    { value: 'dr_anderson', label: 'Dr. Amanda Anderson' },
  ];

  // Result status options
  const RESULT_STATUS_OPTIONS = [
    { value: 'final', label: 'Final' },
    { value: 'preliminary', label: 'Preliminary' },
    { value: 'corrected', label: 'Corrected' },
    { value: 'amended', label: 'Amended' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    test_id: '',
    sample_type: '',
    value: '',
    unit: '',
    reference_range: '',
    is_abnormal: false,
    flag: '',
    notes: '',
    result_date: new Date().toISOString().split('T')[0],
    ordering_doctor: '',
    result_status: 'final',
  });

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

  // Load lab tests when modal opens
  useEffect(() => {
    if (open) {
      loadLabTests();
    }
  }, [open]);

  const loadLabTests = async () => {
    setLoadingTests(true);
    try {
      const response = await getLabTests({ status: 'active', limit: 100 });
      setLabTests(response.tests || []);
    } catch (error) {
      console.error('Failed to load lab tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lab tests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTests(false);
    }
  };

  const handleTestChange = (testId: string) => {
    const selectedTest = labTests.find(t => t.id.toString() === testId);
    setFormData(prev => ({
      ...prev,
      test_id: testId,
      unit: selectedTest?.unit || '',
      reference_range: selectedTest?.normal_range_text || 
        (selectedTest?.normal_range_min && selectedTest?.normal_range_max 
          ? `${selectedTest.normal_range_min} - ${selectedTest.normal_range_max}`
          : ''),
    }));
  };

  // File handling functions
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.';
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      toast({
        title: 'Invalid File',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }
    setAttachedFile(selectedFile);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.test_id || !formData.value) {
      toast({
        title: 'Validation Error',
        description: 'Please select a test and enter a value.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    let uploadedFileId: string | undefined;

    try {
      // Upload attached file if present
      if (attachedFile) {
        setUploadingFile(true);
        try {
          const { file_id } = await uploadFileThroughBackend(
            attachedFile,
            undefined,
            `Lab result attachment for patient ${patientId}`
          );
          uploadedFileId = file_id;
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          toast({
            title: 'Warning',
            description: 'File upload failed, but lab result will be saved without attachment.',
            variant: 'destructive',
          });
        } finally {
          setUploadingFile(false);
        }
      }

      await createLabReport({
        patient_id: patientId,
        test_id: parseInt(formData.test_id),
        value: formData.value,
        unit: formData.unit || undefined,
        reference_range: formData.reference_range || undefined,
        is_abnormal: formData.is_abnormal,
        flag: formData.flag || undefined,
        notes: formData.notes || undefined,
        result_date: formData.result_date,
        sample_type: formData.sample_type || undefined,
        ordering_doctor: formData.ordering_doctor || undefined,
        result_status: formData.result_status || 'final',
        attachment_file_id: uploadedFileId,
        attachment_filename: attachedFile?.name,
      });

      toast({
        title: 'Success',
        description: attachedFile 
          ? 'Lab result added with attachment successfully.' 
          : 'Lab result added successfully.',
      });

      // Reset form
      setFormData({
        test_id: '',
        sample_type: '',
        value: '',
        unit: '',
        reference_range: '',
        is_abnormal: false,
        flag: '',
        notes: '',
        result_date: new Date().toISOString().split('T')[0],
        ordering_doctor: '',
        result_status: 'final',
      });
      setAttachedFile(null);

      onSuccess();
    } catch (error: any) {
      console.error('Failed to add lab result:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add lab result. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Add Lab Result
          </DialogTitle>
          <DialogDescription>
            Enter the lab test result for this patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sample Type - First */}
          <div className="space-y-2">
            <Label htmlFor="sample_type">Sample Type</Label>
            <Select
              value={formData.sample_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sample_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sample type" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Selection - Second */}
          <div className="space-y-2">
            <Label htmlFor="test">Lab Test *</Label>
            <Select
              value={formData.test_id}
              onValueChange={handleTestChange}
              disabled={loadingTests}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTests ? "Loading tests..." : "Select a test"} />
              </SelectTrigger>
              <SelectContent>
                {labTests.map((test) => (
                  <SelectItem key={test.id} value={test.id.toString()}>
                    {test.test_name} ({test.test_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result Value and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Result Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="e.g., 120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., mg/dL"
              />
            </div>
          </div>

          {/* Reference Range */}
          <div className="space-y-2">
            <Label htmlFor="reference_range">Reference Range</Label>
            <Input
              id="reference_range"
              value={formData.reference_range}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_range: e.target.value }))}
              placeholder="e.g., 70 - 100"
            />
          </div>

          {/* Result Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="result_date">Result Date</Label>
              <Input
                id="result_date"
                type="date"
                value={formData.result_date}
                onChange={(e) => setFormData(prev => ({ ...prev, result_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result_status">Result Status</Label>
              <Select
                value={formData.result_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, result_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ordering Doctor */}
          <div className="space-y-2">
            <Label htmlFor="ordering_doctor">Ordering Doctor</Label>
            <Select
              value={formData.ordering_doctor}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ordering_doctor: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {DOCTORS.map((doctor) => (
                  <SelectItem key={doctor.value} value={doctor.value}>
                    {doctor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Abnormal Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_abnormal"
              checked={formData.is_abnormal}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_abnormal: checked === true }))
              }
            />
            <Label htmlFor="is_abnormal" className="text-sm font-normal">
              Mark as abnormal result
            </Label>
          </div>

          {/* Flag (if abnormal) */}
          {formData.is_abnormal && (
            <div className="space-y-2">
              <Label htmlFor="flag">Abnormal Flag</Label>
              <Select
                value={formData.flag}
                onValueChange={(value) => setFormData(prev => ({ ...prev, flag: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flag type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H">High (H)</SelectItem>
                  <SelectItem value="L">Low (L)</SelectItem>
                  <SelectItem value="HH">Critical High (HH)</SelectItem>
                  <SelectItem value="LL">Critical Low (LL)</SelectItem>
                  <SelectItem value="A">Abnormal (A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Attach Image/Document */}
          <div className="space-y-2">
            <Label>Attach Image/Document</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : attachedFile
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="lab-file-upload"
                className="hidden"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleFileInputChange}
                disabled={loading}
              />
              
              {attachedFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <FileImage className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm truncate max-w-[200px]">{attachedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAttachedFile}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Image className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or{' '}
                    <label htmlFor="lab-file-upload" className="text-primary cursor-pointer hover:underline">
                      browse
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, PDF up to 10MB
                  </p>
                </div>
              )}
            </div>
            {uploadingFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading file...
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
