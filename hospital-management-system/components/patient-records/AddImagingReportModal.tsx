'use client';

/**
 * Add Imaging Report Modal Component
 * Modal for adding new imaging reports (X-ray, CT, MRI, etc.) for a patient
 */

import { useState, useCallback } from 'react';
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
import { Loader2, ImageIcon, X, FileImage, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileThroughBackend } from '@/lib/api/medical-records';
import { createImagingReport } from '@/lib/api/medical-records-module';

interface AddImagingReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: number;
}

// Imaging modality options
const MODALITIES = [
  { value: 'X-Ray', label: 'X-Ray' },
  { value: 'CT', label: 'CT Scan' },
  { value: 'MRI', label: 'MRI' },
  { value: 'Ultrasound', label: 'Ultrasound' },
  { value: 'PET', label: 'PET Scan' },
  { value: 'Mammography', label: 'Mammography' },
  { value: 'Fluoroscopy', label: 'Fluoroscopy' },
  { value: 'Nuclear Medicine', label: 'Nuclear Medicine' },
  { value: 'Other', label: 'Other' },
];

// Body part options
const BODY_PARTS = [
  { value: 'head', label: 'Head' },
  { value: 'neck', label: 'Neck' },
  { value: 'chest', label: 'Chest' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'pelvis', label: 'Pelvis' },
  { value: 'spine', label: 'Spine' },
  { value: 'upper_extremity', label: 'Upper Extremity (Arm/Hand)' },
  { value: 'lower_extremity', label: 'Lower Extremity (Leg/Foot)' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'hip', label: 'Hip' },
  { value: 'knee', label: 'Knee' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'wrist', label: 'Wrist' },
  { value: 'whole_body', label: 'Whole Body' },
  { value: 'other', label: 'Other' },
];

// Radiologist/Doctor options
const RADIOLOGISTS = [
  { value: 'dr_patel', label: 'Dr. Raj Patel (Radiologist)' },
  { value: 'dr_chen', label: 'Dr. Lisa Chen (Radiologist)' },
  { value: 'dr_kumar', label: 'Dr. Anil Kumar (Radiologist)' },
  { value: 'dr_williams', label: 'Dr. Sarah Williams (Radiologist)' },
  { value: 'dr_johnson', label: 'Dr. Mark Johnson (Radiologist)' },
];

// Report status options
const REPORT_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
];

export function AddImagingReportModal({
  open,
  onClose,
  onSuccess,
  patientId,
}: AddImagingReportModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);


  // Form state
  const [formData, setFormData] = useState({
    modality: '',
    body_part: '',
    study_description: '',
    radiologist: '',
    study_date: new Date().toISOString().split('T')[0],
    report_date: new Date().toISOString().split('T')[0],
    findings: '',
    impression: '',
    recommendations: '',
    contrast_used: false,
    status: 'final',
  });

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for imaging files
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/dicom',
    'application/dicom',
    'application/pdf',
    'image/tiff',
  ];

  // File handling functions
  const validateFile = (file: File): string | null => {
    // Allow common image types and DICOM
    const allowedTypes = [...ALLOWED_FILE_TYPES, 'application/octet-stream'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
      return 'Invalid file type. Please upload an image (JPEG, PNG, TIFF), DICOM, or PDF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 50MB.';
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        newFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: 'Some files were not added',
        description: errors.join('\n'),
        variant: 'destructive',
      });
    }

    if (newFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.modality || !formData.body_part || !formData.findings) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in modality, body part, and findings.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const uploadedFileIds: string[] = [];

    try {
      // Upload attached files if present
      if (attachedFiles.length > 0) {
        setUploadingFiles(true);
        for (const file of attachedFiles) {
          try {
            const { file_id } = await uploadFileThroughBackend(
              file,
              undefined,
              `Imaging report attachment for patient ${patientId}`
            );
            uploadedFileIds.push(file_id);
          } catch (uploadError) {
            console.error('File upload failed:', uploadError);
          }
        }
        setUploadingFiles(false);
      }

      // Create imaging report via API
      await createImagingReport({
        patient_id: patientId,
        imaging_type: formData.modality,
        modality: formData.modality,
        body_part: formData.body_part,
        study_description: formData.study_description,
        radiologist_id: 1,
        radiologist_name: formData.radiologist,
        study_date: formData.study_date,
        report_date: formData.report_date,
        findings: formData.findings,
        impression: formData.impression || undefined,
        recommendations: formData.recommendations || undefined,
        contrast_used: formData.contrast_used,
        status: formData.status,
        attachment_file_ids: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
      });

      toast({
        title: 'Success',
        description:
          attachedFiles.length > 0
            ? 'Imaging report added with attachments successfully.'
            : 'Imaging report added successfully.',
      });

      // Reset form
      setFormData({
        modality: '',
        body_part: '',
        study_description: '',
        radiologist: '',
        study_date: new Date().toISOString().split('T')[0],
        report_date: new Date().toISOString().split('T')[0],
        findings: '',
        impression: '',
        recommendations: '',
        contrast_used: false,
        status: 'final',
      });
      setAttachedFiles([]);

      onSuccess();
    } catch (error: any) {
      console.error('Failed to add imaging report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add imaging report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Add Imaging Report
          </DialogTitle>
          <DialogDescription>
            Enter the imaging study details and findings for this patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Modality and Body Part */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modality">Modality *</Label>
              <Select
                value={formData.modality}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, modality: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select modality" />
                </SelectTrigger>
                <SelectContent>
                  {MODALITIES.map((mod) => (
                    <SelectItem key={mod.value} value={mod.value}>
                      {mod.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body_part">Body Part *</Label>
              <Select
                value={formData.body_part}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, body_part: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body part" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_PARTS.map((part) => (
                    <SelectItem key={part.value} value={part.value}>
                      {part.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Study Description */}
          <div className="space-y-2">
            <Label htmlFor="study_description">Study Description</Label>
            <Input
              id="study_description"
              value={formData.study_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, study_description: e.target.value }))}
              placeholder="e.g., Chest X-Ray PA and Lateral"
            />
          </div>

          {/* Radiologist and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="radiologist">Radiologist</Label>
              <Select
                value={formData.radiologist}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, radiologist: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select radiologist" />
                </SelectTrigger>
                <SelectContent>
                  {RADIOLOGISTS.map((rad) => (
                    <SelectItem key={rad.value} value={rad.value}>
                      {rad.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Report Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Study Date and Report Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="study_date">Study Date</Label>
              <Input
                id="study_date"
                type="date"
                value={formData.study_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, study_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report_date">Report Date</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, report_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Contrast Used */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="contrast_used"
              checked={formData.contrast_used}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, contrast_used: checked === true }))
              }
            />
            <Label htmlFor="contrast_used" className="text-sm font-normal">
              Contrast agent used
            </Label>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <Label htmlFor="findings">Findings *</Label>
            <Textarea
              id="findings"
              value={formData.findings}
              onChange={(e) => setFormData((prev) => ({ ...prev, findings: e.target.value }))}
              placeholder="Describe the imaging findings..."
              rows={4}
            />
          </div>

          {/* Impression */}
          <div className="space-y-2">
            <Label htmlFor="impression">Impression / Conclusion</Label>
            <Textarea
              id="impression"
              value={formData.impression}
              onChange={(e) => setFormData((prev) => ({ ...prev, impression: e.target.value }))}
              placeholder="Summary impression or diagnosis..."
              rows={2}
            />
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData((prev) => ({ ...prev, recommendations: e.target.value }))}
              placeholder="Follow-up recommendations..."
              rows={2}
            />
          </div>

          {/* Attach Images/Documents */}
          <div className="space-y-2">
            <Label>Attach Images/Documents</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : attachedFiles.length > 0
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
                id="imaging-file-upload"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.dcm,.tiff,.tif"
                multiple
                onChange={handleFileInputChange}
                disabled={loading}
              />

              {attachedFiles.length > 0 ? (
                <div className="space-y-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 p-2 bg-background rounded">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <FileImage className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm truncate max-w-[250px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachedFile(index)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <label
                    htmlFor="imaging-file-upload"
                    className="text-sm text-primary cursor-pointer hover:underline"
                  >
                    + Add more files
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or{' '}
                    <label
                      htmlFor="imaging-file-upload"
                      className="text-primary cursor-pointer hover:underline"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, DICOM, PDF, TIFF up to 50MB each
                  </p>
                </div>
              )}
            </div>
            {uploadingFiles && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading files...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
