'use client';

import { useState, useEffect } from 'react';
import { getMedicalRecord, getRecordAttachments, finalizeRecord, getDownloadUrl, type MedicalRecord, type RecordAttachment } from '@/lib/api/medical-records';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, User, Activity, FileText, Download, Lock, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { FileUpload } from './FileUpload';

interface MedicalRecordDetailsProps {
  recordId: number;
  onEdit?: () => void;
  onClose?: () => void;
}

export function MedicalRecordDetails({ recordId, onEdit, onClose }: MedicalRecordDetailsProps) {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [attachments, setAttachments] = useState<RecordAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadRecord();
    loadAttachments();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMedicalRecord(recordId);
      setRecord(response.data.record);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load medical record');
      console.error('Error loading record:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async () => {
    try {
      const response = await getRecordAttachments(recordId);
      setAttachments(response.data.attachments || []);
    } catch (err: any) {
      console.error('Error loading attachments:', err);
    }
  };

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to finalize this record? It will become read-only.')) {
      return;
    }

    try {
      setFinalizing(true);
      await finalizeRecord(recordId);
      await loadRecord(); // Reload to get updated status
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to finalize record');
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownload = async (attachment: RecordAttachment) => {
    try {
      const response = await getDownloadUrl(attachment.file_id);
      window.open(response.data.download_url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to get download URL');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading record...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertDescription className="text-red-800">
          {error || 'Record not found'}
        </AlertDescription>
      </Alert>
    );
  }

  const isFinalized = record.status === 'finalized';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medical Record #{record.id}</h2>
          <p className="text-gray-600">
            {record.patient_name} - {record.patient_number}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={isFinalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            {record.status}
          </Badge>
          
          {!isFinalized && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          
          {!isFinalized && (
            <Button onClick={handleFinalize} disabled={finalizing}>
              <Lock className="w-4 h-4 mr-2" />
              {finalizing ? 'Finalizing...' : 'Finalize'}
            </Button>
          )}
          
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Visit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Visit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Visit Date</p>
              <p className="text-sm text-gray-900">
                {format(new Date(record.visit_date), 'MMMM dd, yyyy')}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Created</p>
              <p className="text-sm text-gray-900">
                {format(new Date(record.created_at), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {record.chief_complaint && (
            <div>
              <p className="text-sm font-medium text-gray-700">Chief Complaint</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {record.chief_complaint}
              </p>
            </div>
          )}

          {record.diagnosis && (
            <div>
              <p className="text-sm font-medium text-gray-700">Diagnosis</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {record.diagnosis}
              </p>
            </div>
          )}

          {record.treatment_plan && (
            <div>
              <p className="text-sm font-medium text-gray-700">Treatment Plan</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {record.treatment_plan}
              </p>
            </div>
          )}

          {record.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700">Additional Notes</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {record.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vital Signs */}
      {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {record.vital_signs.blood_pressure && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Blood Pressure</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.blood_pressure}</p>
                </div>
              )}
              
              {record.vital_signs.temperature && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Temperature</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.temperature}°F</p>
                </div>
              )}
              
              {record.vital_signs.pulse && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Pulse</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.pulse} bpm</p>
                </div>
              )}
              
              {record.vital_signs.respiratory_rate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Respiratory Rate</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.respiratory_rate}</p>
                </div>
              )}
              
              {record.vital_signs.weight && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Weight</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.weight} lbs</p>
                </div>
              )}
              
              {record.vital_signs.height && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Height</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.height} in</p>
                </div>
              )}
              
              {record.vital_signs.oxygen_saturation && (
                <div>
                  <p className="text-sm font-medium text-gray-700">O2 Saturation</p>
                  <p className="text-lg text-gray-900">{record.vital_signs.oxygen_saturation}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up */}
      {record.follow_up_required && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Required</CardTitle>
          </CardHeader>
          <CardContent>
            {record.follow_up_date && (
              <p className="text-sm text-gray-900">
                Scheduled for: {format(new Date(record.follow_up_date), 'MMMM dd, yyyy')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Attachments ({attachments.length})
            </CardTitle>
            
            {!isFinalized && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(!showUpload)}
              >
                {showUpload ? 'Hide Upload' : 'Add Files'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showUpload && !isFinalized && (
            <FileUpload
              recordId={recordId}
              onUploadComplete={() => {
                loadAttachments();
                setShowUpload(false);
              }}
            />
          )}

          {attachments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No attachments yet
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.filename}
                    </p>
                    {attachment.description && (
                      <p className="text-xs text-gray-500">
                        {attachment.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • 
                      {format(new Date(attachment.uploaded_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
