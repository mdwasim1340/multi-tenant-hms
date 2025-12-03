'use client';

/**
 * Lab Reports List Component
 * Displays lab reports with abnormal value highlighting
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
  FlaskConical,
  AlertTriangle,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { RecordFilters } from './RecordFilters';
import { useLabReports } from '@/hooks/useMedicalRecordsModule';
import { AddLabReportModal } from './AddLabReportModal';
import type { MedicalRecordsFilters } from '@/types/medical-records';

interface LabReportsListProps {
  patientId: number;
  onSelectRecord: (id: number) => void;
  onAddReport?: () => void;
}

type SortField = 'report_date' | 'test_name' | 'status';
type SortOrder = 'asc' | 'desc';

export function LabReportsList({ patientId, onSelectRecord, onAddReport }: LabReportsListProps) {
  const [filters, setFilters] = useState<MedicalRecordsFilters>({});
  const [sortField, setSortField] = useState<SortField>('report_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { reports, loading, error, pagination, fetchReports } = useLabReports({
    patientId,
    filters,
    autoFetch: true,
  });

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchReports(); // Refresh the list
    onAddReport?.();
  };

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
      case 'report_date':
        comparison = new Date(a.report_date).getTime() - new Date(b.report_date).getTime();
        break;
      case 'test_name':
        comparison = a.test_name.localeCompare(b.test_name);
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
      pending: 'outline',
      corrected: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
        showAbnormalFilter
        showPanelFilter
        panelOptions={['CBC', 'LFT', 'RFT', 'Lipid Panel', 'Thyroid Panel']}
      />

      {/* Results Count and Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.total} lab report{pagination.total !== 1 ? 's' : ''} found
        </p>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Lab Result
        </Button>
      </div>

      {/* Empty State */}
      {sortedReports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lab Reports</h3>
              <p className="text-muted-foreground">
                {filters.search || Object.keys(filters).length > 0
                  ? 'No reports match your search criteria'
                  : 'No lab reports have been recorded for this patient'}
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
                      onClick={() => handleSort('report_date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('test_name')}
                    >
                      <div className="flex items-center gap-2">
                        Test / Panel
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
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
                    <TableHead>Abnormal</TableHead>
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
                          {format(new Date(report.report_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.test_name}</p>
                          {report.panel_name && (
                            <p className="text-sm text-muted-foreground">{report.panel_name}</p>
                          )}
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
                        {report.has_abnormal ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Abnormal
                          </Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
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
                    <div>
                      <h4 className="font-semibold">{report.test_name}</h4>
                      {report.panel_name && (
                        <p className="text-sm text-muted-foreground">{report.panel_name}</p>
                      )}
                    </div>
                    {report.has_abnormal && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Abnormal
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(report.report_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {report.ordering_doctor_name || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    {getStatusBadge(report.status)}
                    {report.visit_type && (
                      <Badge variant="outline">{report.visit_type}</Badge>
                    )}
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

      {/* Add Lab Report Modal */}
      <AddLabReportModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        patientId={patientId}
      />
    </div>
  );
}
