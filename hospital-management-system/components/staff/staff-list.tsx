'use client';

import { useState } from 'react';
import { StaffProfile } from '@/lib/types/staff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Calendar, Award } from 'lucide-react';
import Link from 'next/link';

interface StaffListProps {
  staff: StaffProfile[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onViewSchedule: (id: number) => void;
  onViewPerformance: (id: number) => void;
}

export function StaffList({
  staff,
  onEdit,
  onDelete,
  onViewSchedule,
  onViewPerformance,
}: StaffListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === 'all' || member.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(
    new Set(staff.map((s) => s.department).filter(Boolean))
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      on_leave: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      contract: 'bg-purple-100 text-purple-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[type] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Directory</h2>
          <p className="text-muted-foreground">
            Manage hospital staff and their information
          </p>
        </div>
        <Link href="/staff/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by employee ID, name, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">{staff.length}</div>
          <div className="text-sm text-muted-foreground">Total Staff</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">
            {staff.filter((s) => s.status === 'active').length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">
            {staff.filter((s) => s.employment_type === 'full-time').length}
          </div>
          <div className="text-sm text-muted-foreground">Full-Time</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">{departments.length}</div>
          <div className="text-sm text-muted-foreground">Departments</div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Employment Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm || departmentFilter !== 'all'
                      ? 'No staff found matching your filters'
                      : 'No staff members yet. Add your first staff member to get started.'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.employee_id}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/staff/${member.id}`}
                      className="hover:underline"
                    >
                      {member.user_name || 'N/A'}
                    </Link>
                  </TableCell>
                  <TableCell>{member.department || 'N/A'}</TableCell>
                  <TableCell>{member.specialization || 'N/A'}</TableCell>
                  <TableCell>
                    {member.employment_type
                      ? getEmploymentTypeBadge(member.employment_type)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    {member.hire_date
                      ? new Date(member.hire_date.toString()).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSchedule(member.id)}
                        title="View Schedule"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPerformance(member.id)}
                        title="View Performance"
                      >
                        <Award className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(member.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      {filteredStaff.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredStaff.length} of {staff.length} staff members
        </div>
      )}
    </div>
  );
}
