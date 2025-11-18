'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { StaffForm } from '@/components/staff/staff-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getStaffById, updateStaff } from '@/lib/staff';
import { toast } from 'sonner';
import type { StaffProfile } from '@/lib/types/staff';

// Type for the form data
type StaffFormData = {
  name: string;
  email: string;
  role: string;
  employee_id: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  hire_date: string;
  employment_type: 'full-time' | 'part-time' | 'contract';
  status: 'active' | 'inactive' | 'on_leave';
  emergency_contact?: any;
};

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = parseInt(params.id as string);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [formData, setFormData] = useState<Partial<StaffFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStaffDetails();
  }, [staffId]);

  const loadStaffDetails = async () => {
    try {
      setLoading(true);
      const data = await getStaffById(staffId);
      setStaff(data);
      
      // Transform data to match form field names with proper types
      const transformedData: Partial<StaffFormData> = {
        name: data.user_name || '',
        email: data.user_email || '',
        role: data.user_name || '', // This should be the role name from the user
        employee_id: data.employee_id,
        department: data.department,
        specialization: data.specialization,
        license_number: data.license_number,
        hire_date: data.hire_date,
        status: (data.status || 'active') as 'active' | 'inactive' | 'on_leave',
        employment_type: (data.employment_type || 'full-time') as 'full-time' | 'part-time' | 'contract',
        emergency_contact: data.emergency_contact,
      };
      setFormData(transformedData);
    } catch (error: any) {
      console.error('Error loading staff:', error);
      toast.error(error.message || 'Failed to load staff details');
      router.push('/staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await updateStaff(staffId, data);
      toast.success('Staff member updated successfully');
      router.push(`/staff/${staffId}`);
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(error.message || 'Failed to update staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/staff/${staffId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
          <TopBar sidebarOpen={sidebarOpen} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading staff details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!staff || !formData) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-6">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push(`/staff/${staffId}`)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Staff Details
              </Button>
              <h1 className="text-3xl font-bold">Edit Staff Member</h1>
              <p className="text-muted-foreground">
                Update information for {staff.user_name}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Staff Information</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffForm
                  initialData={formData}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
