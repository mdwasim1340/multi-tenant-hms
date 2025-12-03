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
import * as api from '@/lib/api/medical-records-module';
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

  // Extract additional fields from report (may come from extended API response)
  const extendedReport = report as any;
  const sampleType = extendedReport.sample_type;
  const resultStatus = extendedReport.result_status || extendedReport.status || 'final';
  const orderingDoctor = extendedReport.ordering_doctor || extendedReport.ordering_doctor_name;

  // Format sample type for display
  const formatSampleType = (type: string | undefined) => {
    if (!type) return 'N/A';
    const sampleTypes: Record<string, string> = {
      blood: 'Blood',
      serum: 'Serum',
      plasma: 'Plasma',
      urine: 'Urine',
      stool: 'Stool',
      csf: 'CSF (Cerebrospinal Fluid)',
      sputum: 'Sputum',
      swab: 'Swab',
      tissue: 'Tissue',
      other: 'Other',
    };
    return sampleTypes[type] || type;
  };

  // Format doctor name for display
  const formatDoctorName = (doctor: string | undefined) => {
    if (!doctor) return 'N/A';
    // If it's a key like 'dr_smith', convert to readable name
    const doctorNames: Record<string, string> = {
      dr_smith: 'Dr. John Smith',
      dr_johnson: 'Dr. Sarah Johnson',
      dr_williams: 'Dr. Michael Williams',
      dr_brown: 'Dr. Emily Brown',
      dr_davis: 'Dr. Robert Davis',
      dr_miller: 'Dr. Jennifer Miller',
      dr_wilson: 'Dr. David Wilson',
      dr_moore: 'Dr. Lisa Moore',
      dr_taylor: 'Dr. James Taylor',
      dr_anderson: 'Dr. Amanda Anderson',
    };
    return doctorNames[doctor] || doctor;
  };

  // Format result status for display
  const formatResultStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      final: 'Final',
      preliminary: 'Preliminary',
      corrected: 'Corrected',
      amended: 'Amended',
    };
    return statusLabels[status] || status;
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'final':
        return 'default';
      case 'preliminary':
        return 'secondary';
      case 'corrected':
        return 'outline';
      case 'amended':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">{report.test_name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(resultStatus)}>
              {formatResultStatus(resultStatus)}
            </Badge>
            {report.has_abnormal && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Abnormal Values
              </Badge>
            )}
          </div>
        </div>
        {report.panel_name && (
          <p className="text-muted-foreground">{report.panel_name}</p>
        )}
      </div>

      {/* Info Grid - Extended with all fields */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem 
          icon={Calendar} 
          label="Report Date" 
          value={report.report_date ? format(new Date(report.report_date), 'MMM dd, yyyy') : 'N/A'} 
        />
        <InfoItem 
          icon={Calendar} 
          label="Collection Date" 
          value={report.collection_date ? format(new Date(report.collection_date), 'MMM dd, yyyy') : 'N/A'} 
        />
        <InfoItem 
          icon={User} 
          label="Ordering Doctor" 
          value={formatDoctorName(orderingDoctor)} 
        />
        <InfoItem 
          icon={Building} 
          label="Lab" 
          value={report.performing_lab || report.lab_name || 'Hospital Lab'} 
        />
        <InfoItem 
          icon={FileText} 
          label="Sample Type" 
          value={formatSampleType(sampleType)} 
        />
        <InfoItem 
          icon={CheckCircle} 
          label="Result Status" 
          value={formatResultStatus(resultStatus)} 
        />
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
                    {result.result_value || result.value || '-'}
                  </td>
                  <td className="p-3 text-muted-foreground">{result.result_unit || result.unit || '-'}</td>
                  <td className="p-3 text-muted-foreground">{result.reference_range || '-'}</td>
                  <td className="p-3 text-center">
                    {result.is_abnormal && (
                      <AbnormalFlag flag={result.abnormal_flag || result.flag} />
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

      {/* Attachment */}
      {(() => {
        const extReport = report as any;
        const hasAttachment = extReport.attachment_file_id || extReport.attachment_filename || extReport.attachment_url;
        
        if (!hasAttachment) return null;
        
        return (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Attachment</h4>
              <div 
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={async () => {
                  try {
                    // Try to get download URL for the attachment
                    const downloadUrl = await api.downloadDocument(reportId);
                    window.open(downloadUrl, '_blank');
                  } catch (error) {
                    console.error('Failed to get download URL:', error);
                    if (extReport.attachment_url) {
                      window.open(extReport.attachment_url, '_blank');
                    }
                  }
                }}
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-blue-700">
                    {extReport.attachment_filename || 'View Attached File'}
                  </span>
                  <p className="text-xs text-blue-600">Click to view or download</p>
                </div>
                <Download className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </>
        );
      })()}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {report.attachment_url && (
          <Button variant="outline" onClick={() => window.open(report.attachment_url, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
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

  // Safe date formatting helper
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{report.modality || 'Imaging'}</Badge>
          <Badge variant="outline" className="capitalize">{report.status || 'pending'}</Badge>
        </div>
        <h3 className="text-xl font-semibold">{report.study_description || report.body_part || 'Imaging Study'}</h3>
        <p className="text-muted-foreground">{report.body_part || 'N/A'}</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem icon={Calendar} label="Study Date" value={formatDate(report.study_date)} />
        <InfoItem icon={Calendar} label="Report Date" value={formatDate(report.report_date)} />
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

      {/* Attachments */}
      {(() => {
        const extReport = report as any;
        const hasAttachment = extReport.attachment_ids?.length > 0 || extReport.attachment_url || extReport.attachment_file_id;
        
        if (!hasAttachment) return null;
        
        return (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Attachments</h4>
              <div 
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={async () => {
                  try {
                    // Try to get download URL for the attachment
                    const downloadUrl = await api.downloadDocument(reportId);
                    window.open(downloadUrl, '_blank');
                  } catch (error) {
                    console.error('Failed to get download URL:', error);
                    if (extReport.attachment_url) {
                      window.open(extReport.attachment_url, '_blank');
                    }
                  }
                }}
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-blue-700">
                    View Attached Files
                  </span>
                  <p className="text-xs text-blue-600">Click to view or download</p>
                </div>
                <Download className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </>
        );
      })()}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {report.attachment_url && (
          <Button variant="outline" onClick={() => window.open(report.attachment_url, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
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

      {/* Content - Parse structured sections */}
      <div>
        <h4 className="font-semibold mb-3">Note Content</h4>
        <div className="space-y-4">
          {(() => {
            const content = note.content || '';
            const sections: Record<string, string> = {};
            
            // Parse metadata section (before ---)
            const metadataSplit = content.split('\n---\n');
            if (metadataSplit.length > 1) {
              const metadata = metadataSplit[0];
              const lines = metadata.split('\n');
              lines.forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                  const cleanKey = key.trim();
                  const value = valueParts.join(':').trim();
                  if (cleanKey && value) {
                    sections[cleanKey] = value;
                  }
                }
              });
            }
            
            // Parse main content sections
            const mainContent = metadataSplit.length > 1 ? metadataSplit[1] : content;
            const sectionRegex = /(Chief Complaint|Assessment|Plan|Diagnoses):\s*([^\n]+(?:\n(?!(?:Chief Complaint|Assessment|Plan|Diagnoses):)[^\n]+)*)/g;
            let match;
            let remainingContent = mainContent;
            
            while ((match = sectionRegex.exec(mainContent)) !== null) {
              sections[match[1]] = match[2].trim();
              remainingContent = remainingContent.replace(match[0], '').trim();
            }
            
            // Main content (everything not in labeled sections)
            if (remainingContent && !remainingContent.match(/^(Chief Complaint|Assessment|Plan|Diagnoses):/)) {
              sections['Main Content'] = remainingContent;
            }
            
            return (
              <>
                {sections['Visit Type'] && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Visit Type</div>
                    <div className="text-sm">{sections['Visit Type']}</div>
                  </div>
                )}
                {sections['Department'] && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Department</div>
                    <div className="text-sm">{sections['Department']}</div>
                  </div>
                )}
                {sections['Author'] && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Author</div>
                    <div className="text-sm">{sections['Author']}</div>
                  </div>
                )}
                {sections['Chief Complaint'] && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-blue-700 mb-1">Chief Complaint</div>
                    <div className="text-sm text-blue-900">{sections['Chief Complaint']}</div>
                  </div>
                )}
                {sections['Main Content'] && (
                  <div className="bg-white border p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">Clinical Note</div>
                    <div className="text-sm whitespace-pre-wrap">{sections['Main Content']}</div>
                  </div>
                )}
                {sections['Assessment'] && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-green-700 mb-1">Assessment</div>
                    <div className="text-sm text-green-900 whitespace-pre-wrap">{sections['Assessment']}</div>
                  </div>
                )}
                {sections['Plan'] && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-purple-700 mb-1">Plan</div>
                    <div className="text-sm text-purple-900 whitespace-pre-wrap">{sections['Plan']}</div>
                  </div>
                )}
                {sections['Diagnoses'] && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-orange-700 mb-1">Diagnoses</div>
                    <div className="text-sm text-orange-900">{sections['Diagnoses']}</div>
                  </div>
                )}
              </>
            );
          })()}
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
