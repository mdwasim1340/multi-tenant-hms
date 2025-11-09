'use client';

/**
 * LogoUpload Component
 * 
 * File upload component for hospital logo management.
 * Features: Drag-and-drop, preview, validation, progress tracking.
 * 
 * Requirements: Phase 7, Core branding features
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// ============================================================================
// Types
// ============================================================================

interface LogoUploadProps {
  currentLogoUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function LogoUpload({
  currentLogoUrl,
  onUpload,
  onRemove,
  disabled = false,
}: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPG, or SVG images only.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `File size (${sizeMB}MB) exceeds 2MB limit.`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFile = (file: File) => {
    // Validate
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Upload selected file
   */
  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress (actual progress handled by API)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Logo uploaded successfully!');
      
      // Clear selection after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setUploadProgress(0);
        setUploading(false);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
      setUploadProgress(0);
      setUploading(false);
    }
  };

  /**
   * Cancel selection
   */
  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Remove current logo
   */
  const handleRemove = async () => {
    if (!onRemove) return;

    try {
      await onRemove();
      toast.success('Logo removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5" />
          <span>Hospital Logo</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload your hospital logo (PNG, JPG, or SVG, max 2MB)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo Display */}
        {currentLogoUrl && !preview && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Current Logo</p>
            <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <Image
                    src={currentLogoUrl}
                    alt="Current logo"
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
                {onRemove && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={disabled || uploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Upload Area */}
        {!preview && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleChange}
              disabled={disabled}
              className="hidden"
            />
            
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {dragActive ? 'Drop file here' : 'Upload Logo'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG or SVG (max 2MB)
            </p>
          </div>
        )}

        {/* Preview and Upload */}
        {preview && selectedFile && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Preview</p>
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
              <div className="relative w-full h-48 flex items-center justify-center mb-4">
                <Image
                  src={preview}
                  alt="Logo preview"
                  width={192}
                  height={192}
                  className="object-contain"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">File name:</span>
                  <span className="font-medium truncate max-w-xs" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">File size:</span>
                  <span className="font-medium">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleUpload}
                disabled={uploading || disabled}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : uploadProgress === 100 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={uploading || disabled}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Logo Guidelines</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use high-resolution images for best quality</li>
            <li>• Square or horizontal logos work best</li>
            <li>• Transparent backgrounds (PNG) recommended</li>
            <li>• Logo will be automatically resized for different uses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
