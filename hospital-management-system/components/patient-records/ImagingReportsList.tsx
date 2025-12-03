'use client';

/**
 * Imaging Reports List Component
 * Displays radiology/imaging reports with modality filtering
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
  FileImage,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  Image,
} from 'lucide-react';
import { format } from 'date-fns';
import { RecordFilters } from './RecordFilters';
import { useImagingReportsModule } from '@/hooks/useMedicalRecordsModule';
import type { ImagingReport, MedicalRecordsFilters } from '@/types/medical-records';

interface ImagingReportsListProps {
  patientId: number;
  onSelectRecord: (id: number) => void;
  onAddReport?: () => void;
}

type SortField = 'study_date' | 'modality' | 'status';
type SortOrder = 'asc' | 'desc';

export function ImagingReportsList({ patientId, onSelectRecord, onAddReport }: ImagingReportsListProps) {
  const [filters, setFilters] = useState<MedicalRecordsFilters>({});
  const [sortField, setSortField] = useState<SortField>('study_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { reports, loading, error, pagination, fetchReports } = useImagingReportsModule({
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

  const sortedReports = [...(reports || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'study_date':
        comparison = new Date(a.study_date).getTime() - new Date(b.study_date).getTime();
        break;
      case 'modality':
        comparison = a.modality.localeCompare(b.modality);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      final: 'default',
      preliminary: 'secondary',
      scheduled: 'outline',
      in_progress: 'outline',
      addendum: 'destructive',
    };
    const labels: Record<string, string> = {
      final: 'Final',
      preliminary: 'Preliminary',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      addendum: 'Addendum',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getModalityIcon = (modality: string) => {
    // Could be extended with specific icons per modality
    return <FileImage className="h-4 w-4" />;
  };

  if (loading && !reports.length) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
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
            <Button variant="outline" className="mt-4" onClick={() => fetchReports()}>
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
        showModalityFilter
        showBodyPartFilter
        bodyPartOptions={['Chest', 'Abdomen', 'Head', 'Spine', 'Extremities', 'Pelvis']}
      />

      {/* Results Count and Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.total} imaging report{pagination.total !== 1 ? 's' : ''} found
        </p>
        {onAddReport && (
          <Button onClick={onAddReport} size="sm">
            <FileImage className="h-4 w-4 mr-2" />
            Add Imaging Report
          </Button>
        )}
      </div>

      {/* Empty State */}
      {sortedReports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Imaging Reports</h3>
              <p className="text-muted-foreground">
                {filters.search || Object.keys(filters).length > 0
                  ? 'No reports match your search criteria'
                  : 'No imaging studies have been recorded for this patient'}
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
                      onClick={() => handleSort('study_date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('modality')}
                    >
                      <div className="flex items-center gap-2">
                        Modality
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Body Part / Study</TableHead>
                    <TableHead>Ordering Doctor</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectRecord(report.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(report.study_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getModalityIcon(report.modality)}
                          <Badge variant="secondary">{report.modality}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.body_part}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {report.study_description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {report.ordering_doctor_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {report.images && report.images.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Image className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{report.images.length}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
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
            {sortedReports.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectRecord(report.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{report.modality}</Badge>
                      {report.images && report.images.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Image className="h-3 w-3" />
                          {report.images.length}
                        </Badge>
                      )}
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="mb-2">
                    <h4 className="font-semibold">{report.body_part}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {report.study_description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(report.study_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {report.ordering_doctor_name || 'N/A'}
                    </div>
                  </div>
                  
                  {report.radiologist_name && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Radiologist: {report.radiologist_name}
                    </div>
                  )}
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
                  onClick={() => fetchReports(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchReports(pagination.page + 1)}
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
