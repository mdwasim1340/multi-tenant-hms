'use client';

/**
 * ImagingReportsList Component
 * 
 * Displays imaging reports with:
 * - Search and filter functionality
 * - Report cards with key details
 * - File attachment indicators
 * - Status badges
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileImage,
  Plus,
  Search,
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { useImagingReports } from '@/hooks/useImagingReports';
import { usePatientContext } from '@/hooks/usePatientContext';
import { ImagingReport } from '@/lib/api/imaging-reports';
import { format } from 'date-fns';

interface ImagingReportsListProps {
  onAddReport?: () => void;
  onViewReport?: (report: ImagingReport) => void;
}

export function ImagingReportsList({ onAddReport, onViewReport }: ImagingReportsListProps) {
  const { selectedPatient } = usePatientContext();
  const { reports, loading, error, fetchReports } = useImagingReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [imagingTypeFilter, setImagingTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (selectedPatient) {
      fetchReports(selectedPatient.id);
    }
  }, [selectedPatient, fetchReports]);

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Please select a patient to view imaging reports
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Loading imaging reports...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Filter reports
  const filteredReports = reports?.filter(report => {
    // Search filter
    const matchesSearch = 
      report.imaging_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.radiologist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.findings && report.findings.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Imaging type filter
    const matchesType = imagingTypeFilter === 'all' || report.imaging_type === imagingTypeFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all' && report.report_date) {
      const reportDate = new Date(report.report_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'last7days':
          matchesDate = daysDiff <= 7;
          break;
        case 'last30days':
          matchesDate = daysDiff <= 30;
          break;
        case 'last90days':
          matchesDate = daysDiff <= 90;
          break;
        case 'lastyear':
          matchesDate = daysDiff <= 365;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  }) || [];

  // Get unique imaging types for filter
  const imagingTypes = Array.from(new Set(reports?.map(r => r.imaging_type) || []));

  // Group reports by imaging type
  const reportsByType = filteredReports.reduce((acc, report) => {
    const type = report.imaging_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(report);
    return acc;
  }, {} as Record<string, ImagingReport[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Imaging Reports</CardTitle>
              <CardDescription>
                Radiology and imaging studies for {selectedPatient.first_name} {selectedPatient.last_name}
              </CardDescription>
            </div>
            {onAddReport && (
              <Button onClick={onAddReport}>
                <Plus className="h-4 w-4 mr-2" />
                Add Report
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports, radiologist, findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={imagingTypeFilter} onValueChange={setImagingTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {imagingTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredReports.length} of {reports?.length || 0} reports
            </p>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || imagingTypeFilter !== 'all' || dateFilter !== 'all'
                ? 'No reports match your search criteria'
                : 'No imaging reports recorded'}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(reportsByType).map(([type, typeReports]) => (
                <div key={type}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    {type} ({typeReports.length})
                  </h3>
                  <div className="space-y-3">
                    {typeReports.map((report) => (
                      <ImagingReportCard 
                        key={report.id} 
                        report={report}
                        onView={onViewReport}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Imaging Report Card Component
 * Individual report display with details
 */
interface ImagingReportCardProps {
  report: ImagingReport;
  onView?: (report: ImagingReport) => void;
}

function ImagingReportCard({ report, onView }: ImagingReportCardProps) {
  const hasAttachments = report.file_count && report.file_count > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-lg">{report.imaging_type}</h4>
              {hasAttachments && (
                <Badge variant="secondary">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {report.file_count} {report.file_count === 1 ? 'file' : 'files'}
                </Badge>
              )}
            </div>

            {/* Report Date */}
            {report.report_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-3 w-3" />
                Report Date: {format(new Date(report.report_date), 'MMM d, yyyy')}
              </div>
            )}

            {/* Radiologist */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <User className="h-3 w-3" />
              Radiologist: {report.radiologist}
            </div>

            {/* Findings Preview */}
            {report.findings && (
              <div className="mb-3">
                <span className="text-sm font-medium">Findings: </span>
                <span className="text-sm text-muted-foreground">
                  {report.findings.length > 150 
                    ? `${report.findings.substring(0, 150)}...` 
                    : report.findings}
                </span>
              </div>
            )}

            {/* Impression Preview */}
            {report.impression && (
              <div className="mb-3">
                <span className="text-sm font-medium">Impression: </span>
                <span className="text-sm text-muted-foreground">
                  {report.impression.length > 150 
                    ? `${report.impression.substring(0, 150)}...` 
                    : report.impression}
                </span>
              </div>
            )}

            {/* Body Part */}
            {report.body_part && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Body Part: </span>
                {report.body_part}
              </div>
            )}

            {/* Created Date */}
            <div className="text-xs text-muted-foreground mt-2">
              Created: {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(report)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
            {hasAttachments && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Download functionality would be implemented here
                  console.log('Download report files:', report.id);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Files
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
