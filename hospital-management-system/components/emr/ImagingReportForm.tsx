'use client';

/**
 * ImagingReportForm Component
 * 
 * Form for creating and editing imaging reports with:
 * - Patient selection
 * - Imaging type and body part
 * - Radiologist information
 * - Findings and impression
 * - File attachment support (reuses ReportUpload)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileImage,
  Save,
  AlertTriangle,
  Calendar,
  Upload
} from 'lucide-react';
import { useImagingReports } from '@/hooks/useImagingReports';
import { usePatientContext } from '@/hooks/usePatientContext';
import { ImagingReport } from '@/lib/api/imaging-reports';
import { ReportUpload } from './ReportUpload';
import { toast } from 'sonner';

// Form validation schema
const imagingReportSchema = z.object({
  imaging_type: z.string().min(1, 'Imaging type is required'),
  body_part: z.string().optional(),
  radiologist: z.string().min(1, 'Radiologist name is required'),
  report_date: z.string().min(1, 'Report date is required'),
  findings: z.string().optional(),
  impression: z.string().optional(),
  recommendations: z.string().optional()
});

type ImagingReportFormData = z.infer<typeof imagingReportSchema>;

interface ImagingReportFormProps {
  initialData?: Partial<ImagingReport>;
  onSuccess?: (report: ImagingReport) => void;
  onCancel?: () => void;
}

export function ImagingReportForm({
  initialData,
  onSuccess,
  onCancel
}: ImagingReportFormProps) {
  const { selectedPatient } = usePatientContext();
  const { createReport, updateReport, loading } = useImagingReports();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const form = useForm<ImagingReportFormData>({
    resolver: zodResolver(imagingReportSchema),
    defaultValues: {
      imaging_type: initialData?.imaging_type || '',
      body_part: initialData?.body_part || '',
      radiologist: initialData?.radiologist || '',
      report_date: initialData?.report_date 
        ? new Date(initialData.report_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      findings: initialData?.findings || '',
      impression: initialData?.impression || '',
      recommendations: initialData?.recommendations || ''
    }
  });

  const onSubmit = async (data: ImagingReportFormData) => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    try {
      const reportData = {
        ...data,
        patient_id: selectedPatient.id,
        // Include file attachments if any were uploaded
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };

      let result;
      if (initialData?.id) {
        result = await updateReport(initialData.id, reportData);
        toast.success('Imaging report updated successfully');
      } else {
        result = await createReport(reportData);
        toast.success('Imaging report created successfully');
      }

      if (onSuccess && result) {
        onSuccess(result);
      }

      // Reset form for new entries
      if (!initialData?.id) {
        form.reset();
        setUploadedFiles([]);
      }
    } catch (err: any) {
      console.error('Error saving imaging report:', err);
      toast.error(err.message || 'Failed to save imaging report');
    }
  };

  const handleFileUploadSuccess = (files: Array<{ name: string; url: string }>) => {
    setUploadedFiles(files);
    setShowFileUpload(false);
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  if (!selectedPatient) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a patient before creating an imaging report
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          {initialData?.id ? 'Edit' : 'New'} Imaging Report
        </CardTitle>
        <CardDescription>
          {initialData?.id ? 'Update' : 'Create'} imaging report for {selectedPatient.first_name} {selectedPatient.last_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Imaging Type */}
            <FormField
              control={form.control}
              name="imaging_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imaging Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select imaging type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="MRI">MRI</SelectItem>
                      <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="PET Scan">PET Scan</SelectItem>
                      <SelectItem value="Mammogram">Mammogram</SelectItem>
                      <SelectItem value="Fluoroscopy">Fluoroscopy</SelectItem>
                      <SelectItem value="Nuclear Medicine">Nuclear Medicine</SelectItem>
                      <SelectItem value="Bone Scan">Bone Scan</SelectItem>
                      <SelectItem value="Angiography">Angiography</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of imaging study performed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body Part */}
            <FormField
              control={form.control}
              name="body_part"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Part (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Chest, Abdomen, Left Knee"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific body part or region imaged
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Radiologist and Report Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="radiologist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radiologist</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dr. Smith"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Interpreting radiologist
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="report_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Report Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Findings */}
            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Findings (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of imaging findings..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed observations from the imaging study
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Impression */}
            <FormField
              control={form.control}
              name="impression"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impression (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Clinical impression and diagnosis..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Summary and clinical interpretation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recommendations */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Follow-up recommendations..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Suggested follow-up or additional studies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Image Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Attach DICOM images, scans, or related files
                  </p>
                </div>
                {!showFileUpload && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFileUpload(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                )}
              </div>

              {/* Show uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">
                    Uploaded Files ({uploadedFiles.length}):
                  </p>
                  <ul className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileImage className="h-3 w-3" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* File Upload Component */}
              {showFileUpload && (
                <div className="mt-4">
                  <ReportUpload
                    patientId={selectedPatient.id}
                    reportType="imaging"
                    onSuccess={handleFileUploadSuccess}
                    onCancel={() => setShowFileUpload(false)}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {initialData?.id ? 'Update' : 'Create'} Report
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
