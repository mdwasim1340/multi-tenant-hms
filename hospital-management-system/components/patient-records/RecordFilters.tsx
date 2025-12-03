'use client';

/**
 * Record Filters Component
 * Shared filters for medical records lists
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import type { MedicalRecordsFilters } from '@/types/medical-records';

interface RecordFiltersProps {
  filters: MedicalRecordsFilters;
  onFiltersChange: (filters: MedicalRecordsFilters) => void;
  showStatusFilter?: boolean;
  showVisitTypeFilter?: boolean;
  // Lab specific
  showAbnormalFilter?: boolean;
  showPanelFilter?: boolean;
  panelOptions?: string[];
  // Imaging specific
  showModalityFilter?: boolean;
  modalityOptions?: string[];
  showBodyPartFilter?: boolean;
  bodyPartOptions?: string[];
  // Notes specific
  showNoteTypeFilter?: boolean;
  noteTypeOptions?: string[];
  // Documents specific
  showDocumentTypeFilter?: boolean;
  documentTypeOptions?: string[];
}

export function RecordFilters({
  filters,
  onFiltersChange,
  showStatusFilter = true,
  showVisitTypeFilter = true,
  showAbnormalFilter = false,
  showPanelFilter = false,
  panelOptions = [],
  showModalityFilter = false,
  modalityOptions = [],
  showBodyPartFilter = false,
  bodyPartOptions = [],
  showNoteTypeFilter = false,
  noteTypeOptions = [],
  showDocumentTypeFilter = false,
  documentTypeOptions = [],
}: RecordFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFiltersChange({
      ...filters,
      date_from: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFiltersChange({
      ...filters,
      date_to: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="whitespace-nowrap"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                Active
              </span>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={handleDateFromChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={handleDateToChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          {showStatusFilter && (
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, status: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="preliminary">Preliminary</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Visit Type Filter */}
          {showVisitTypeFilter && (
            <div className="space-y-2">
              <Label className="text-sm">Visit Type</Label>
              <Select
                value={filters.visit_type || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, visit_type: v === 'all' ? undefined : v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="OPD">OPD</SelectItem>
                  <SelectItem value="IPD">IPD</SelectItem>
                  <SelectItem value="ER">ER</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lab: Abnormal Only */}
          {showAbnormalFilter && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="abnormal-only"
                checked={filters.abnormal_only || false}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, abnormal_only: checked ? true : undefined })
                }
              />
              <Label htmlFor="abnormal-only" className="text-sm cursor-pointer">
                Abnormal results only
              </Label>
            </div>
          )}

          {/* Lab: Panel Filter */}
          {showPanelFilter && panelOptions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Test Panel</Label>
              <Select
                value={filters.panel_name || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, panel_name: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All panels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panels</SelectItem>
                  {panelOptions.map((panel) => (
                    <SelectItem key={panel} value={panel}>{panel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Imaging: Modality Filter */}
          {showModalityFilter && (
            <div className="space-y-2">
              <Label className="text-sm">Modality</Label>
              <Select
                value={filters.modality || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, modality: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All modalities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modalities</SelectItem>
                  <SelectItem value="X-ray">X-ray</SelectItem>
                  <SelectItem value="CT">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="PET">PET Scan</SelectItem>
                  <SelectItem value="Mammography">Mammography</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Imaging: Body Part Filter */}
          {showBodyPartFilter && bodyPartOptions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Body Part</Label>
              <Select
                value={filters.body_part || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, body_part: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All body parts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Body Parts</SelectItem>
                  {bodyPartOptions.map((part) => (
                    <SelectItem key={part} value={part}>{part}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes: Note Type Filter */}
          {showNoteTypeFilter && (
            <div className="space-y-2">
              <Label className="text-sm">Note Type</Label>
              <Select
                value={filters.note_type || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, note_type: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="progress">Progress Note</SelectItem>
                  <SelectItem value="admission">Admission Note</SelectItem>
                  <SelectItem value="discharge">Discharge Summary</SelectItem>
                  <SelectItem value="operative">Operative Note</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Documents: Document Type Filter */}
          {showDocumentTypeFilter && (
            <div className="space-y-2">
              <Label className="text-sm">Document Type</Label>
              <Select
                value={filters.document_type || 'all'}
                onValueChange={(v) => onFiltersChange({ ...filters, document_type: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="external_lab">External Lab Report</SelectItem>
                  <SelectItem value="referral_letter">Referral Letter</SelectItem>
                  <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                  <SelectItem value="consent_form">Consent Form</SelectItem>
                  <SelectItem value="insurance">Insurance Document</SelectItem>
                  <SelectItem value="uploaded_pdf">Uploaded PDF</SelectItem>
                  <SelectItem value="scanned">Scanned Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
