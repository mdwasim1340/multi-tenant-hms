/**
 * Lab Tests Main Page
 * 
 * Browse available lab tests and manage test catalog
 */

'use client';

import { useState } from 'react';
import { useLabTests, useLabTestMutations } from '@/hooks/useLabTests';
import LabTestsList from '@/components/lab-orders/LabTestsList';
import { Plus, TestTube, Settings } from 'lucide-react';

export default function LabTestsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TestTube className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lab Tests Catalog</h1>
                <p className="text-gray-600">Browse and manage available laboratory tests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LabTestsList />
      </div>
    </div>
  );
}
