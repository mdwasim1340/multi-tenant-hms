'use client';

/**
 * Clinical Notes List Component
 * Displays clinical notes with type filtering
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
  FileText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { RecordFilters } from './RecordFilters';
import { useClinicalNotesModule } from '@/hooks/useMedicalRecordsModule';
import type { ClinicalNote, MedicalRecordsFilters } from '@/types/medical-records';

interface ClinicalNotesListProps {
  patientId: number;
  onSelectRecord: (id: number) => void;
}

type SortField = 'created_at' | 'note_type' | 'status';
type SortOrder = 'asc' | 'desc';

export function ClinicalNotesList({ patientId, onSelectRecord }: ClinicalNotesListProps) {
  const [filters, setFilters] = useState<MedicalRecordsFilters>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { notes, loading, error, pagination, fetchNotes } = useClinicalNotesModule({
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

  const sortedNotes = [...(notes || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'note_type':
        comparison = a.note_type.localeCompare(b.note_type);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getNoteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      progress: 'Progress Note',
      admission: 'Admission Note',
      discharge: 'Discharge Summary',
      operative: 'Operative Note',
      consultation: 'Consultation',
      procedure: 'Procedure Note',
      follow_up: 'Follow-up Note',
    };
    return labels[type] || type;
  };

  const getNoteTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      progress: 'bg-blue-100 text-blue-800',
      admission: 'bg-green-100 text-green-800',
      discharge: 'bg-purple-100 text-purple-800',
      operative: 'bg-red-100 text-red-800',
      consultation: 'bg-yellow-100 text-yellow-800',
      procedure: 'bg-orange-100 text-orange-800',
      follow_up: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {getNoteTypeLabel(type)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'amended':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !notes.length) {
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
            <Button variant="outline" className="mt-4" onClick={() => fetchNotes()}>
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
        showNoteTypeFilter
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagination.total} clinical note{pagination.total !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Empty State */}
      {sortedNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Clinical Notes</h3>
              <p className="text-muted-foreground">
                {filters.search || Object.keys(filters).length > 0
                  ? 'No notes match your search criteria'
                  : 'No clinical notes have been recorded for this patient'}
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
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Date/Time
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('note_type')}
                    >
                      <div className="flex items-center gap-2">
                        Note Type
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Visit Type</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedNotes.map((note) => (
                    <TableRow
                      key={note.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectRecord(note.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p>{format(new Date(note.created_at), 'MMM dd, yyyy')}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(note.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getNoteTypeBadge(note.note_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {note.author_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{note.department || '-'}</TableCell>
                      <TableCell>
                        {note.visit_type ? (
                          <Badge variant="outline">{note.visit_type}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(note.status)}
                          <span className="capitalize">{note.status}</span>
                        </div>
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
            {sortedNotes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectRecord(note.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    {getNoteTypeBadge(note.note_type)}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(note.status)}
                      <span className="text-sm capitalize">{note.status}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h4 className="font-semibold">{note.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content.substring(0, 100)}...
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.created_at), 'MMM dd, yyyy h:mm a')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {note.author_name || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Tags/Diagnoses */}
                  {note.diagnoses && note.diagnoses.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {note.diagnoses.slice(0, 3).map((diagnosis, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {diagnosis}
                        </Badge>
                      ))}
                      {note.diagnoses.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.diagnoses.length - 3} more
                        </Badge>
                      )}
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
                  onClick={() => fetchNotes(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchNotes(pagination.page + 1)}
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
