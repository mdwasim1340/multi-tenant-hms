'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await createStaff(data);
      
      // Show success message with credentials
      if (result && (result as any).credentials) {
        const creds = (result as any).credentials;
        toast.success(
          `Staff member created successfully!\n\nLogin Credentials:\nEmail: ${creds.email}\nTemporary Password: ${creds.temporaryPassword}\n\nPlease save these credentials and share them securely with the staff member.`,
          { duration: 10000 }
        );
      } else {
        toast.success('Staff member created successfully');
      }
      
      // Wait a bit for user to see the credentials
      setTimeout(() => {
        router.push('/staff');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create staff member');
      console.error('Create error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/staff');
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}>
        <TopBar sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-6">
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
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
