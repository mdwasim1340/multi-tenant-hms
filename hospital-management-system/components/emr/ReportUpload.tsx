'use client';

/**
 * ReportUpload Component
 * 
 * File upload component with:
 * - Drag-and-drop support
 * - File type validation (PDF, DOCX, JPG, PNG)
 * - File size validation (max 25MB)
 * - Upload progress indicator
 * - Metadata form
 */

import { useState, useCallback, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { requestUploadUrl, uploadFileToS3 } from '@/lib/api/report-upload';

// Allowed file types
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

// Metadata form schema
const reportMetadataSchema = z.object({
  report_type: z.enum([
    'lab_report',
    'imaging_report',
    'pathology_report',
    'consultation_report',
    'other'
  ]),
  report_date: z.string().min(1, 'Report date is required'),
  author: z.string().min(1, 'Author is required'),
  notes: z.string().optional()
});

type ReportMetadata = z.infer<typeof reportMetadataSchema>;

interface ReportUploadProps {
  patientId?: number;
  onUploadComplete?: (fileUrl: string, metadata: ReportMetadata) => void;
  onCancel?: () => void;
}

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface UploadedFile {
  file: File;
  preview?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  url?: string;
}

export function ReportUpload({
  patientId,
  onUploadComplete,
  onCancel
}: ReportUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportMetadata>({
    resolver: zodResolver(reportMetadataSchema),
    defaultValues: {
      report_type: 'lab_report',
      report_date: new Date().toISOString().split('T')[0],
      author: '',
      notes: ''
    }
  });

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
    return allowedTypes.includes(file.type);
  };

  // Validate file size
  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8" />;
    }
    return <FileText className="h-8 w-8" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!validateFileType(file)) {
      toast.error('Invalid file type. Please upload PDF, DOCX, JPG, or PNG files.');
      return;
    }

    // Validate file size
    if (!validateFileSize(file)) {
      toast.error(`File size exceeds 25MB limit. Your file is ${formatFileSize(file.size)}.`);
      return;
    }

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setUploadedFile({
      file,
      preview,
      status: 'pending',
      progress: 0
    });

    toast.success('File selected successfully');
  }, []);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file to S3
  const uploadFile = async (file: File): Promise<string> => {
    try {
      // Update status
      setUploadedFile(prev => prev ? { ...prev, status: 'uploading', progress: 0 } : null);

      // Get presigned URL
      const { upload_url, download_url } = await requestUploadUrl(
        file.name,
        file.type,
        file.size
      );

      // Upload to S3 with progress tracking
      await uploadFileToS3(upload_url, file, (progress) => {
        setUploadedFile(prev => prev ? { ...prev, progress } : null);
      });

      // Update status to success
      setUploadedFile(prev => prev ? { ...prev, status: 'success', progress: 100, url: download_url } : null);

      return download_url;
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadedFile(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message || 'Upload failed'
      } : null);
      throw error;
    }
  };

  // Handle form submission
  const onSubmit = async (metadata: ReportMetadata) => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!patientId) {
      toast.error('Patient ID is required');
      return;
    }

    try {
      // Upload file
      const fileUrl = await uploadFile(uploadedFile.file);

      toast.success('Report uploaded successfully');

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(fileUrl, metadata);
      }

      // Reset form
      form.reset();
      handleRemoveFile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload report');
    }
  };

  const reportTypeLabels: Record<string, string> = {
    lab_report: 'Lab Report',
    imaging_report: 'Imaging Report',
    pathology_report: 'Pathology Report',
    consultation_report: 'Consultation Report',
    other: 'Other'
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Report File
          </CardTitle>
          <CardDescription>
            Drag and drop a file or click to browse. Supported formats: PDF, DOCX, JPG, PNG (max 25MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Drop your file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                PDF, DOCX, JPG, PNG up to 25MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{uploadedFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>

                    {uploadedFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2">
                    {uploadedFile.status === 'pending' && (
                      <Badge variant="secondary">Ready to upload</Badge>
                    )}
                    {uploadedFile.status === 'uploading' && (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading...
                      </Badge>
                    )}
                    {uploadedFile.status === 'success' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                    {uploadedFile.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={uploadedFile.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadedFile.progress}% complete
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadedFile.status === 'error' && uploadedFile.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadedFile.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Change File Button */}
              {uploadedFile.status === 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Change File
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Form */}
      {uploadedFile && uploadedFile.status !== 'uploading' && (
        <Card>
          <CardHeader>
            <CardTitle>Report Metadata</CardTitle>
            <CardDescription>
              Provide additional information about the report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Report Type */}
                <FormField
                  control={form.control}
                  name="report_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(reportTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Report Date */}
                <FormField
                  control={form.control}
                  name="report_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        The date the report was created
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Author */}
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Smith" {...field} />
                      </FormControl>
                      <FormDescription>
                        The healthcare provider who created the report
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this report..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!uploadedFile}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
