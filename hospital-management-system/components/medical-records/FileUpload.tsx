'use client';

import { useState, useCallback } from 'react';
import { uploadAndAttachFile } from '@/lib/api/medical-records';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  recordId: number;
  onUploadComplete?: (attachment: any) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({ 
  recordId, 
  onUploadComplete,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return 'File type not supported';
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadingFiles(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'error',
        error: validationError
      }));
      return;
    }

    // Add to uploading files
    setUploadingFiles(prev => new Map(prev).set(fileId, {
      file,
      progress: 0,
      status: 'uploading'
    }));

    try {
      // Upload file with progress tracking
      const result = await uploadAndAttachFile(
        recordId,
        file,
        description || undefined,
        (progress) => {
          setUploadingFiles(prev => {
            const updated = new Map(prev);
            const current = updated.get(fileId);
            if (current) {
              updated.set(fileId, { ...current, progress });
            }
            return updated;
          });
        }
      );

      // Mark as success
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        const current = updated.get(fileId);
        if (current) {
          updated.set(fileId, { ...current, progress: 100, status: 'success' });
        }
        return updated;
      });

      // Clear description
      setDescription('');

      // Notify parent
      if (onUploadComplete) {
        onUploadComplete(result.data.attachment);
      }

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles(prev => {
          const updated = new Map(prev);
          updated.delete(fileId);
          return updated;
        });
      }, 3000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => {
        const updated = new Map(prev);
        const current = updated.get(fileId);
        if (current) {
          updated.set(fileId, {
            ...current,
            status: 'error',
            error: error.response?.data?.error || 'Upload failed'
          });
        }
        return updated;
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        uploadFile(file);
      });
    }
  }, [recordId, description]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        uploadFile(file);
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type === 'application/pdf') {
      return '📄';
    } else if (file.type.includes('word')) {
      return '📝';
    } else if (file.type.includes('csv') || file.type.includes('excel')) {
      return '📊';
    }
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Description Input */}
      <div>
        <Label htmlFor="file_description">File Description (Optional)</Label>
        <Input
          id="file_description"
          placeholder="e.g., Lab results, X-ray, Prescription..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="py-8">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              multiple
              accept={acceptedTypes.join(',')}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <File className="w-4 h-4 mr-2" />
              Select Files
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              Max file size: {maxFileSize}MB
            </p>
            <p className="text-xs text-gray-500">
              Supported: PDF, Images, Word, CSV
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileId, uploadingFile]) => (
            <Card key={fileId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(uploadingFile.file)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {uploadingFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadingFile.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadingFile.progress}% uploaded
                        </p>
                      </div>
                    )}

                    {uploadingFile.status === 'error' && (
                      <Alert className="mt-2 bg-red-50 border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-xs">
                          {uploadingFile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {uploadingFile.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}

                  {uploadingFile.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
