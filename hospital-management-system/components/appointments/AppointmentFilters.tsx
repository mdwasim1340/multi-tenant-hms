/**
 * Team Alpha - Appointment Filters Component
 * Filter controls for appointment list
 */

'use client';

import { useState } from 'react';
import { type AppointmentFilters as Filters } from '@/lib/api/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

interface AppointmentFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
}

export function AppointmentFilters({
  filters,
  onFilterChange,
  onReset,
}: AppointmentFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value === 'all' ? undefined : value });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({ appointment_type: value === 'all' ? undefined : value });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFilterChange({
      date_from: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFilterChange({
      date_to: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({ search: value || undefined });
  };

  const hasActiveFilters =
    filters.status ||
    filters.appointment_type ||
    filters.date_from ||
    filters.date_to ||
    filters.search;

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom(undefined);
              setDateTo(undefined);
              onReset();
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Patient name, email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={filters.appointment_type || 'all'}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="checkup">Checkup</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="procedure">Procedure</SelectItem>
              <SelectItem value="therapy">Therapy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <Label>Date From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
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

        {/* Date To */}
        <div className="space-y-2">
          <Label>Date To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
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
      </div>
    </div>
  );
}
