/**
 * Lab Results Main Page
 * 
 * View and manage laboratory test results
 */

'use client';

import { useState } from 'react';
import { useLabResults, useLabResultStatistics } from '@/hooks/useLabResults';
import LabResultsList from '@/components/lab-results/LabResultsList';
import LabResultDetails from '@/components/lab-results/LabResultDetails';
import AbnormalResultsAlert from '@/components/lab-results/AbnormalResultsAlert';
import { LabResult } from '@/lib/api/lab-results';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function LabResultsPage() {
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAbnormalOnly, setShowAbnormalOnly] = useState(false);

  const { data: statistics } = useLabResultStatistics();

  const handleSelectResult = (result: LabResult) => {
    setSelectedResult(result);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
                <p className="text-gray-600">View and verify laboratory test results</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                <input
                  type="checkbox"
                  checked={showAbnormalOnly}
                  onChange={(e) => setShowAbnormalOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Abnormal Only</span>
              </label>
            </div>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Results</p>
                    <p className="text-2xl font-bold text-blue-900">{statistics.total_results}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Abnormal</p>
                    <p className="text-2xl font-bold text-red-900">{statistics.abnormal_results}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Critical</p>
                    <p className="text-2xl font-bold text-orange-900">{statistics.critical_results}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Verified</p>
                    <p className="text-2xl font-bold text-green-900">{statistics.verified_results}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{statistics.pending_verification}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Abnormal Results Alert */}
        <AbnormalResultsAlert
          onViewResult={handleSelectResult}
          showCriticalOnly={false}
        />

        {/* Results List or Details */}
        {showDetails && selectedResult ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <LabResultDetails
              resultId={selectedResult.id}
              onClose={handleCloseDetails}
              onUpdate={() => {
                // Refresh list
              }}
            />
          </div>
        ) : (
          <LabResultsList
            onSelectResult={handleSelectResult}
            showAbnormalOnly={showAbnormalOnly}
          />
        )}
      </div>
    </div>
  );
}
