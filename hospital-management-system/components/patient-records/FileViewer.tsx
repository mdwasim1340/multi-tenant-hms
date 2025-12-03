'use client';

/**
 * File Viewer Component
 * Displays PDF, images, and other document types with zoom/navigation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  File,
  Calendar,
  User,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

// Safe date formatting helper
function formatDate(dateStr: string | undefined | null, formatStr: string = 'MMM dd, yyyy'): string {
  if (!dateStr) return 'N/A';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(date)) return 'N/A';
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
}
import { useClinicalDocuments } from '@/hooks/useMedicalRecordsModule';
import * as api from '@/lib/api/medical-records-module';
import type { ClinicalDocument } from '@/types/medical-records';

interface FileViewerProps {
  documentId: number;
  onClose?: () => void;
}

export function FileViewer({ documentId, onClose }: FileViewerProps) {
  const [document, setDocument] = useState<ClinicalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const doc = await api.fetchClinicalDocumentDetails(documentId);
      setDocument(doc);
      
      // file_url from fetchClinicalDocumentDetails is already a presigned S3 URL
      if (doc.file_url && doc.file_url.startsWith('http')) {
        // It's already a presigned URL, use it directly
        setViewUrl(doc.file_url);
      } else if (doc.file_url) {
        // It's a file ID, try to get the view URL
        try {
          const url = await api.getFileViewUrl(doc.file_url);
          setViewUrl(url);
        } catch {
          // Try download URL as fallback
          try {
            const url = await api.downloadDocument(documentId);
            setViewUrl(url);
          } catch {
            setViewUrl(null);
          }
        }
      } else {
        // No file_url, try to get download URL for attachments
        try {
          const url = await api.downloadDocument(documentId);
          setViewUrl(url);
        } catch {
          // No attachments available
          setViewUrl(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = async () => {
    if (!document) return;
    try {
      const downloadUrl = await api.downloadDocument(documentId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleFullscreen = () => {
    if (viewUrl) {
      window.open(viewUrl, '_blank');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      external_lab: 'External Lab Report',
      referral_letter: 'Referral Letter',
      discharge_summary: 'Discharge Summary',
      consent_form: 'Consent Form',
      insurance: 'Insurance Document',
      uploaded_pdf: 'Uploaded PDF',
      scanned: 'Scanned Document',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf = document?.file_type?.includes('pdf');
  const isImage = document?.file_type?.includes('image');

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive">{error || 'Document not found'}</p>
        <Button variant="outline" className="mt-4" onClick={loadDocument}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">
            {getDocumentTypeLabel(document.document_type || 'other')}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {(document.status || 'draft').replace('_', ' ')}
          </Badge>
        </div>
        <h3 className="text-xl font-semibold">{document.title || 'Untitled Document'}</h3>
        {document.description && (
          <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Uploaded: {formatDate(document.created_at)}</span>
        </div>
        {document.date_of_service && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Service Date: {formatDate(document.date_of_service)}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>By: {document.uploaded_by_name || 'Unknown'}</span>
        </div>
        {document.source && (
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <span>Source: {document.source}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {document.tags.map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Viewer Controls */}
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          {isImage && (
            <Button variant="ghost" size="icon" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Preview */}
      <div className="border rounded-lg overflow-auto bg-muted/20" style={{ height: '350px' }}>
        {viewUrl ? (
          isPdf ? (
            <iframe
              src={`${viewUrl}#zoom=${zoom}`}
              className="w-full h-full"
              title={document.title}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100">
              <img
                src={viewUrl}
                alt={document.title}
                className="cursor-pointer"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `rotate(${rotation}deg)`,
                  width: zoom !== 100 ? `${zoom}%` : 'auto',
                }}
                onClick={handleFullscreen}
                title="Click to view full image"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Preview not available for this file type
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {document.file_type} • {formatFileSize(document.file_size)}
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load file preview</p>
          </div>
        )}
      </div>

      {/* File Info Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{document.file_type}</span>
        <span>{formatFileSize(document.file_size)}</span>
      </div>
    </div>
  );
}

/**
 * Standalone Image Viewer for imaging reports
 */
interface ImageViewerProps {
  images: Array<{
    id: number;
    thumbnail_url?: string;
    full_url: string;
    description?: string;
    is_dicom?: boolean;
  }>;
  initialIndex?: number;
  onClose?: () => void;
}

export function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);

  const currentImage = images[currentIndex];

  const handlePrev = () => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const handleNext = () => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 300));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  if (!currentImage) return null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={images.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={images.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(currentImage.full_url, '_blank')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Display */}
      <div className="border rounded-lg overflow-auto bg-black min-h-[400px] max-h-[600px] flex items-center justify-center">
        {currentImage.is_dicom ? (
          <div className="text-center py-12 text-white">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="mb-2">DICOM Viewer Placeholder</p>
            <p className="text-sm opacity-75">
              Full DICOM viewer integration coming soon
            </p>
          </div>
        ) : (
          <img
            src={currentImage.full_url}
            alt={currentImage.description || `Image ${currentIndex + 1}`}
            style={{ transform: `scale(${zoom / 100})` }}
            className="transition-transform"
          />
        )}
      </div>

      {/* Description */}
      {currentImage.description && (
        <p className="text-sm text-muted-foreground text-center">
          {currentImage.description}
        </p>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                idx === currentIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              {img.thumbnail_url ? (
                <img
                  src={img.thumbnail_url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
