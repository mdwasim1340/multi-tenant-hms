'use client';

/**
 * All Records List Component
 * Displays all medical records in a unified view
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FolderOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  FlaskConical,
  FileImage,
  FileText,
  File,
  Paperclip,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { RecordFilters } from './RecordFilters';
import { useAllMedicalRecords } from '@/hooks/useMedicalRecordsModule';
import type { MedicalRecordType, MedicalRecordsFilters } from '@/types/medical-records';

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

interface AllRecordsListProps {
  patientId: number;
  onSelectRecord: (id: number, type: MedicalRecordType) => void;
}

type SortField = 'date' | 'type' | 'title';
type SortOrder = 'asc' | 'desc';

export function AllRecordsList({ patientId, onSelectRecord }: AllRecordsListProps) {
  const [filters, setFilters] = useState<MedicalRecordsFilters>({});
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { records, loading, error, pagination, fetchRecords } = useAllMedicalRecords({
    patientId,
    filters,
    autoFetch: true,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedRecords = [...(records || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getTypeIcon = (type: MedicalRecordType) => {
    switch (type) {
      case 'lab_report':
        return <FlaskConical className="h-4 w-4 text-blue-500" />;
      case 'imaging_report':
        return <FileImage className="h-4 w-4 text-purple-500" />;
      case 'clinical_note':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'document':
        return <File className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: MedicalRecordType) => {
    const labels: Record<MedicalRecordType, string> = {
      lab_report: 'Lab Report',
      imaging_report: 'Imaging',
      clinical_note: 'Clinical Note',
      document: 'Document',
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: MedicalRecordType) => {
    const colors: Record<MedicalRecordType, string> = {
      lab_report: 'bg-blue-100 text-blue-800',
      imaging_report: 'bg-purple-100 text-purple-800',
      clinical_note: 'bg-green-100 text-green-800',
      document: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !records.length) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchRecords()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <RecordFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.total} record{pagination.total !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Empty State */}
      {sortedRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Medical Records</h3>
              <p className="text-muted-foreground">
                {filters.search || Object.keys(filters).length > 0
                  ? 'No records match your search criteria'
                  : 'No medical records have been recorded for this patient'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Visit Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((record) => (
                    <TableRow
                      key={`${record.type}-${record.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectRecord(record.id, record.type)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(record.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(record.type)}
                          <Badge className={getTypeBadgeColor(record.type)}>
                            {getTypeLabel(record.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[250px]">
                            {record.title}
                          </span>
                          {record.has_attachment && (
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          )}
                          {record.is_abnormal && (
                            <Badge variant="destructive" className="text-xs">
                              Abnormal
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.visit_type ? (
                          <Badge variant="outline">{record.visit_type}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{record.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sortedRecords.map((record) => (
              <Card
                key={`${record.type}-${record.id}`}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectRecord(record.id, record.type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(record.type)}
                      <Badge className={getTypeBadgeColor(record.type)}>
                        {getTypeLabel(record.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {record.has_attachment && (
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                      )}
                      {record.is_abnormal && (
                        <Badge variant="destructive" className="text-xs">
                          Abnormal
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-2 line-clamp-2">{record.title}</h4>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      {record.visit_type && (
                        <Badge variant="outline" className="text-xs">
                          {record.visit_type}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchRecords(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchRecords(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
