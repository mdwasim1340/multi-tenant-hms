'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const staffSchema = z.object({
  user_id: z.number(),
  employee_id: z.string().min(1, 'Employee ID is required'),
  department: z.string().optional(),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
  hire_date: z.string().min(1, 'Hire date is required'),
  employment_type: z.enum(['full-time', 'part-time', 'contract']),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
  emergency_contact: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
    })
    .optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
  initialData?: Partial<StaffFormData>;
  users: Array<{ id: number; name: string; email: string }>;
  onSubmit: (data: StaffFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StaffForm({
  initialData,
  users,
  onSubmit,
  onCancel,
  isLoading = false,
}: StaffFormProps) {
  const [emergencyContact, setEmergencyContact] = useState(
    initialData?.emergency_contact || {}
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      ...initialData,
      status: initialData?.status || 'active',
      employment_type: initialData?.employment_type || 'full-time',
    },
  });

  const handleFormSubmit = async (data: StaffFormData) => {
    await onSubmit({
      ...data,
      emergency_contact: emergencyContact,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">User Account *</Label>
              <Select
                onValueChange={(value) => setValue('user_id', parseInt(value))}
                defaultValue={initialData?.user_id?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user account" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-sm text-destructive">
                  {errors.user_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                {...register('employee_id')}
                placeholder="EMP001"
              />
              {errors.employee_id && (
                <p className="text-sm text-destructive">
                  {errors.employee_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="Cardiology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                {...register('specialization')}
                placeholder="Cardiologist"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                {...register('license_number')}
                placeholder="LIC123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date *</Label>
              <Input
                id="hire_date"
                type="date"
                {...register('hire_date')}
              />
              {errors.hire_date && (
                <p className="text-sm text-destructive">
                  {errors.hire_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type *</Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    'employment_type',
                    value as 'full-time' | 'part-time' | 'contract'
                  )
                }
                defaultValue={watch('employment_type')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-Time</SelectItem>
                  <SelectItem value="part-time">Part-Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                onValueChange={(value) =>
                  setValue('status', value as 'active' | 'inactive' | 'on_leave')
                }
                defaultValue={watch('status')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_name">Contact Name</Label>
              <Input
                id="emergency_name"
                value={emergencyContact.name || ''}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    name: e.target.value,
                  })
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_relationship">Relationship</Label>
              <Input
                id="emergency_relationship"
                value={emergencyContact.relationship || ''}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    relationship: e.target.value,
                  })
                }
                placeholder="Spouse"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Phone</Label>
              <Input
                id="emergency_phone"
                value={emergencyContact.phone || ''}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    phone: e.target.value,
                  })
                }
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_email">Email</Label>
              <Input
                id="emergency_email"
                type="email"
                value={emergencyContact.email || ''}
                onChange={(e) =>
                  setEmergencyContact({
                    ...emergencyContact,
                    email: e.target.value,
                  })
                }
                placeholder="emergency@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Staff' : 'Create Staff'}
        </Button>
      </div>
    </form>
  );
}
