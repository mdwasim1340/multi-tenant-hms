'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the Admin Dashboard.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Required Role:</strong> System Administrator
            </p>
            <p className="text-xs text-red-600 mt-2">
              Only users with the "Admin" role can access this application.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Login
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you need admin access, please contact your system administrator.</p>
        </div>
      </div>
    </div>
  );
}
