'use client';

import { useState, useEffect } from 'react';
import { getMedicalRecords, type MedicalRecord, type ListRecordsParams } from '@/lib/api/medical-records';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, User, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecordsListProps {
  patientId?: number;
  onSelectRecord?: (record: MedicalRecord) => void;
  onCreateNew?: () => void;
}

export function MedicalRecordsList({ patientId, onSelectRecord, onCreateNew }: MedicalRecordsListProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'finalized'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRecords();
  }, [patientId, statusFilter, page]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ListRecordsParams = {
        page,
        limit: 10
      };

      if (patientId) {
        params.patient_id = patientId;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await getMedicalRecords(params);
      setRecords(response.data.records || []);
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load medical records');
      console.error('Error loading records:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const patientName = record.patient_first_name && record.patient_last_name 
      ? `${record.patient_first_name} ${record.patient_last_name}`.toLowerCase()
      : record.patient_name?.toLowerCase() || '';
    
    return (
      patientName.includes(search) ||
      record.patient_number?.toLowerCase().includes(search) ||
      record.diagnosis?.toLowerCase().includes(search) ||
      record.chief_complaint?.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button onClick={loadRecords} className="mt-2" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Medical Records</h2>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <FileText className="w-4 h-4 mr-2" />
            New Record
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by patient, diagnosis, or complaint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('draft')}
            size="sm"
          >
            Draft
          </Button>
          <Button
            variant={statusFilter === 'finalized' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('finalized')}
            size="sm"
          >
            Finalized
          </Button>
        </div>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No medical records found</p>
            {onCreateNew && (
              <Button onClick={onCreateNew} className="mt-4" variant="outline">
                Create First Record
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card
              key={record.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectRecord?.(record)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {record.patient_first_name && record.patient_last_name
                          ? `${record.patient_first_name} ${record.patient_last_name}`
                          : record.patient_name || 'Unknown Patient'}
                      </h3>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Patient #: {record.patient_number || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(record.visit_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>

                    {record.chief_complaint && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          Chief Complaint:
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.chief_complaint}
                        </p>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          Diagnosis:
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.diagnosis}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>Record #{record.id}</p>
                    <p className="mt-1">
                      {format(new Date(record.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
