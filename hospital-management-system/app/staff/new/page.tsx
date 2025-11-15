'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StaffForm } from '@/components/staff/staff-form';
import { useStaff } from '@/hooks/use-staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewStaffPage() {
  const router = useRouter();
  const { createStaff } = useStaff();
  const [isLoading, setIsLoading] = useState(false);

  // Mock users - in real app, fetch from API
  const users = [
    { id: 1, name: 'Dr. John Smith', email: 'john.smith@hospital.com' },
    { id: 2, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@hospital.com' },
    { id: 3, name: 'Nurse Emily Davis', email: 'emily.davis@hospital.com' },
  ];

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await createStaff(data);
      toast.success('Staff member created successfully');
      router.push('/staff');
    } catch (error) {
      toast.error('Failed to create staff member');
      console.error('Create error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/staff');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/staff">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Staff Member</h1>
        <p className="text-muted-foreground">
          Create a new staff profile with employment details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffForm
            users={users}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
