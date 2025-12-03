'use client';

/**
 * ImagingReportDetails Component
 * 
 * Displays full imaging report details with:
 * - Complete report information
 * - Image viewer for attached files
 * - Secure download links
 * - Print functionality
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileImage,
  Calendar,
  User,
  Download,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Paperclip
} from 'lucide-react';
import { ImagingReport } from '@/lib/api/imaging-reports';
import { format } from 'date-fns';

interface ImagingReportDetailsProps {
  report: ImagingReport;
  onClose?: () => void;
}

export function ImagingReportDetails({ report, onClose }: ImagingReportDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(100);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    // In a real implementation, this would use presigned URLs from the backend
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 25, 50));
  };

  // Mock file attachments (in real app, these would come from the report)
  const attachments = report.file_count && report.file_count > 0 
    ? Array.from({ length: report.file_count }, (_, i) => ({
        id: i + 1,
        name: `${report.imaging_type}_${i + 1}.dcm`,
        url: `/api/files/${report.id}/${i + 1}`,
        type: 'image/dicom'
      }))
    : [];

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileImage className="h-6 w-6" />
                {report.imaging_type} Report
              </CardTitle>
              <CardDescription className="mt-2">
                Report ID: {report.id} | Created: {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Imaging Type</h3>
              <p className="text-base">{report.imaging_type}</p>
            </div>
            {report.body_part && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Body Part</h3>
                <p className="text-base">{report.body_part}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Radiologist
              </h3>
              <p className="text-base">{report.radiologist}</p>
            </div>
            {report.report_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Report Date
                </h3>
                <p className="text-base">{format(new Date(report.report_date), 'MMMM d, yyyy')}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Findings */}
          {report.findings && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Findings</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{report.findings}</p>
              </div>
            </div>
          )}

          {/* Impression */}
          {report.impression && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Impression</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{report.impression}</p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{report.recommendations}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* File Attachments */}
          {attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attached Files ({attachments.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attachments.map((file) => (
                  <Card 
                    key={file.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedImage(file.url)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="h-12 w-12 text-muted-foreground" />
                        <p className="text-xs text-center truncate w-full">{file.name}</p>
                        <div className="flex gap-1 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(file.url);
                            }}
                          >
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file.url, file.name);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Report Metadata Footer */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Report Created: {format(new Date(report.created_at), 'MMMM d, yyyy h:mm a')}</p>
            {report.updated_at && report.updated_at !== report.created_at && (
              <p>Last Updated: {format(new Date(report.updated_at), 'MMMM d, yyyy h:mm a')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Image Viewer</DialogTitle>
            <DialogDescription>
              Use zoom controls to adjust the view
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {imageZoom}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setImageZoom(100)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Image Display */}
            <div className="overflow-auto max-h-[60vh] flex items-center justify-center bg-muted/50 rounded-lg p-4">
              {selectedImage ? (
                <div 
                  style={{ 
                    transform: `scale(${imageZoom / 100})`,
                    transition: 'transform 0.2s'
                  }}
                >
                  {/* In a real app, this would display the actual DICOM image */}
                  <div className="w-96 h-96 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <FileImage className="h-24 w-24 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">DICOM Image Viewer</p>
                      <p className="text-xs opacity-75 mt-2">
                        Image would be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No image selected</p>
              )}
            </div>

            {/* Download Button */}
            {selectedImage && (
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    const fileName = attachments.find(f => f.url === selectedImage)?.name || 'image.dcm';
                    handleDownloadFile(selectedImage, fileName);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
