'use client';

/**
 * Record Detail Panel Component
 * Displays detailed view of any medical record type
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Download,
  Printer,
  Calendar,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Image,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useLabReportDetails,
  useImagingReportDetails,
  useClinicalNoteDetails,
} from '@/hooks/useMedicalRecordsModule';
import { FileViewer } from './FileViewer';
import type { MedicalRecordType, LabTestResult } from '@/types/medical-records';

interface RecordDetailPanelProps {
  recordId: number;
  recordType: MedicalRecordType;
  onClose: () => void;
}

export function RecordDetailPanel({ recordId, recordType, onClose }: RecordDetailPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Record Details</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 pt-0">
            {recordType === 'lab_report' && (
              <LabReportDetail reportId={recordId} />
            )}
            {recordType === 'imaging_report' && (
              <ImagingReportDetail reportId={recordId} />
            )}
            {recordType === 'clinical_note' && (
              <ClinicalNoteDetail noteId={recordId} />
            )}
            {recordType === 'document' && (
              <DocumentDetail documentId={recordId} />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Lab Report Detail Component
function LabReportDetail({ reportId }: { reportId: number }) {
  const { report, loading, error } = useLabReportDetails(reportId);

  if (loading) return <DetailSkeleton />;
  if (error) return <DetailError message={error} />;
  if (!report) return <DetailError message="Report not found" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">{report.test_name}</h3>
          {report.has_abnormal && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Abnormal Values
            </Badge>
          )}
        </div>
        {report.panel_name && (
          <p className="text-muted-foreground">{report.panel_name}</p>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem icon={Calendar} label="Report Date" value={format(new Date(report.report_date), 'MMM dd, yyyy')} />
        <InfoItem icon={Calendar} label="Collection Date" value={format(new Date(report.collection_date), 'MMM dd, yyyy')} />
        <InfoItem icon={User} label="Ordering Doctor" value={report.ordering_doctor_name || 'N/A'} />
        <InfoItem icon={Building} label="Lab" value={report.lab_name || 'N/A'} />
      </div>

      <Separator />

      {/* Test Results Table */}
      <div>
        <h4 className="font-semibold mb-3">Test Results</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Test</th>
                <th className="text-right p-3 font-medium">Result</th>
                <th className="text-left p-3 font-medium">Unit</th>
                <th className="text-left p-3 font-medium">Reference</th>
                <th className="text-center p-3 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((result, idx) => (
                <tr
                  key={idx}
                  className={`border-t ${result.is_abnormal ? 'bg-red-50' : ''}`}
                >
                  <td className="p-3">{result.test_name}</td>
                  <td className={`p-3 text-right font-medium ${result.is_abnormal ? 'text-red-600' : ''}`}>
                    {result.result_value}
                  </td>
                  <td className="p-3 text-muted-foreground">{result.result_unit || '-'}</td>
                  <td className="p-3 text-muted-foreground">{result.reference_range || '-'}</td>
                  <td className="p-3 text-center">
                    {result.is_abnormal && (
                      <AbnormalFlag flag={result.abnormal_flag} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {report.notes && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.notes}</p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {report.attachment_url && (
          <Button variant="outline" onClick={() => window.open(report.attachment_url, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        )}
      </div>
    </div>
  );
}

// Imaging Report Detail Component
function ImagingReportDetail({ reportId }: { reportId: number }) {
  const { report, loading, error } = useImagingReportDetails(reportId);

  if (loading) return <DetailSkeleton />;
  if (error) return <DetailError message={error} />;
  if (!report) return <DetailError message="Report not found" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{report.modality}</Badge>
          <Badge variant="outline" className="capitalize">{report.status}</Badge>
        </div>
        <h3 className="text-xl font-semibold">{report.study_description}</h3>
        <p className="text-muted-foreground">{report.body_part}</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem icon={Calendar} label="Study Date" value={format(new Date(report.study_date), 'MMM dd, yyyy')} />
        {report.report_date && (
          <InfoItem icon={Calendar} label="Report Date" value={format(new Date(report.report_date), 'MMM dd, yyyy')} />
        )}
        <InfoItem icon={User} label="Ordering Doctor" value={report.ordering_doctor_name || 'N/A'} />
        <InfoItem icon={User} label="Radiologist" value={report.radiologist_name || 'N/A'} />
        {report.facility && (
          <InfoItem icon={Building} label="Facility" value={report.facility} />
        )}
      </div>

      <Separator />

      {/* Findings */}
      {report.findings && (
        <div>
          <h4 className="font-semibold mb-2">Findings</h4>
          <p className="text-sm whitespace-pre-wrap">{report.findings}</p>
        </div>
      )}

      {/* Impression */}
      {report.impression && (
        <div>
          <h4 className="font-semibold mb-2">Impression</h4>
          <p className="text-sm whitespace-pre-wrap">{report.impression}</p>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && (
        <div>
          <h4 className="font-semibold mb-2">Recommendations</h4>
          <p className="text-sm whitespace-pre-wrap">{report.recommendations}</p>
        </div>
      )}

      <Separator />

      {/* Images */}
      {report.images && report.images.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images ({report.images.length})
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {report.images.map((image, idx) => (
              <div
                key={idx}
                className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  // Open image viewer
                  window.open(image.full_url, '_blank');
                }}
              >
                {image.thumbnail_url ? (
                  <img
                    src={image.thumbnail_url}
                    alt={image.description || `Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {report.images.some(img => img.is_dicom) && (
            <p className="text-xs text-muted-foreground mt-2">
              * DICOM viewer integration placeholder - full viewer coming soon
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {report.attachment_url && (
          <Button variant="outline" onClick={() => window.open(report.attachment_url, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        )}
      </div>
    </div>
  );
}

// Clinical Note Detail Component
function ClinicalNoteDetail({ noteId }: { noteId: number }) {
  const { note, loading, error } = useClinicalNoteDetails(noteId);

  if (loading) return <DetailSkeleton />;
  if (error) return <DetailError message={error} />;
  if (!note) return <DetailError message="Note not found" />;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // TODO: Implement PDF download
    console.log('Download PDF:', noteId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <NoteTypeBadge type={note.note_type} />
          <StatusBadge status={note.status} />
        </div>
        <h3 className="text-xl font-semibold">{note.title}</h3>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem icon={Calendar} label="Date/Time" value={format(new Date(note.created_at), 'MMM dd, yyyy h:mm a')} />
        <InfoItem icon={User} label="Author" value={note.author_name || 'N/A'} />
        {note.department && (
          <InfoItem icon={Building} label="Department" value={note.department} />
        )}
        {note.visit_type && (
          <InfoItem icon={FileText} label="Visit Type" value={note.visit_type} />
        )}
      </div>

      {/* Signed Info */}
      {note.signed_at && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span>
            Signed by {note.signed_by_name || 'Unknown'} on{' '}
            {format(new Date(note.signed_at), 'MMM dd, yyyy h:mm a')}
          </span>
        </div>
      )}

      <Separator />

      {/* Content */}
      <div>
        <h4 className="font-semibold mb-3">Note Content</h4>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm">{note.content}</div>
        </div>
      </div>

      {/* Diagnoses/Problems */}
      {note.diagnoses && note.diagnoses.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Diagnoses</h4>
            <div className="flex flex-wrap gap-2">
              {note.diagnoses.map((diagnosis, idx) => (
                <Badge key={idx} variant="outline">{diagnosis}</Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

// Document Detail Component
function DocumentDetail({ documentId }: { documentId: number }) {
  // For documents, we'll show a file viewer
  return (
    <div className="space-y-6">
      <FileViewer documentId={documentId} />
    </div>
  );
}

// Helper Components
function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function AbnormalFlag({ flag }: { flag?: string }) {
  if (!flag) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  
  switch (flag) {
    case 'H':
      return <TrendingUp className="h-4 w-4 text-orange-600" />;
    case 'L':
      return <TrendingDown className="h-4 w-4 text-orange-600" />;
    case 'HH':
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    case 'LL':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  }
}

function NoteTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    progress: 'bg-blue-100 text-blue-800',
    admission: 'bg-green-100 text-green-800',
    discharge: 'bg-purple-100 text-purple-800',
    operative: 'bg-red-100 text-red-800',
    consultation: 'bg-yellow-100 text-yellow-800',
  };
  const labels: Record<string, string> = {
    progress: 'Progress Note',
    admission: 'Admission Note',
    discharge: 'Discharge Summary',
    operative: 'Operative Note',
    consultation: 'Consultation',
  };
  return (
    <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
      {labels[type] || type}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'signed') {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Signed
      </Badge>
    );
  }
  if (status === 'draft') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Draft
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function DetailError({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
      <p className="text-destructive">{message}</p>
    </div>
  );
}
