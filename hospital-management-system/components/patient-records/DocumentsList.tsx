'use client';

/**
 * Documents List Component
 * Displays clinical documents and external reports
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
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  FileText,
  Download,
  Plus,
  File,
  FileImage,
  FileType,
} from 'lucide-react';
import { format } from 'date-fns';
import { RecordFilters } from './RecordFilters';
import { useClinicalDocuments } from '@/hooks/useMedicalRecordsModule';
import type { ClinicalDocument, MedicalRecordsFilters } from '@/types/medical-records';

interface DocumentsListProps {
  patientId: number;
  onSelectRecord: (id: number) => void;
  onAddDocument?: () => void;
}

type SortField = 'created_at' | 'document_type' | 'title';
type SortOrder = 'asc' | 'desc';

export function DocumentsList({ patientId, onSelectRecord, onAddDocument }: DocumentsListProps) {
  const [filters, setFilters] = useState<MedicalRecordsFilters>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { documents, loading, error, pagination, fetchDocuments } = useClinicalDocuments({
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

  const sortedDocuments = [...(documents || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'document_type':
        comparison = a.document_type.localeCompare(b.document_type);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

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

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileType className="h-4 w-4 text-red-500" />;
    }
    if (fileType.includes('image')) {
      return <FileImage className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      reviewed: 'default',
      pending_review: 'secondary',
      archived: 'outline',
    };
    const labels: Record<string, string> = {
      reviewed: 'Reviewed',
      pending_review: 'Pending Review',
      archived: 'Archived',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading && !documents.length) {
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
            <Button variant="outline" className="mt-4" onClick={() => fetchDocuments()}>
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
        showDocumentTypeFilter
        showStatusFilter={false}
      />

      {/* Results Count & Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.total} document{pagination.total !== 1 ? 's' : ''} found
        </p>
        {onAddDocument && (
          <Button onClick={onAddDocument} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        )}
      </div>

      {/* Empty State */}
      {sortedDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || Object.keys(filters).length > 0
                  ? 'No documents match your search criteria'
                  : 'No documents have been uploaded for this patient'}
              </p>
              {onAddDocument && (
                <Button onClick={onAddDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
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
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('document_type')}
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
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDocuments.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectRecord(doc.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.file_type)}
                          <span className="font-medium truncate max-w-[200px]">
                            {doc.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.source || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.file_url, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sortedDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectRecord(doc.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                    {getStatusBadge(doc.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(doc.file_type)}
                    <h4 className="font-semibold truncate">{doc.title}</h4>
                  </div>
                  
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {doc.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {doc.uploaded_by_name || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(doc.file_url, '_blank');
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
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
                  onClick={() => fetchDocuments(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchDocuments(pagination.page + 1)}
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
