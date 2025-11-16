/**
 * Lab Results List Component
 * 
 * Display and manage lab results
 */

'use client';

import { useState } from 'react';
import { useLabResults } from '@/hooks/useLabResults';
import { LabResult } from '@/lib/api/lab-results';
import { Search, Filter, Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface LabResultsListProps {
  orderId?: number;
  patientId?: number;
  onSelectResult?: (result: LabResult) => void;
  showAbnormalOnly?: boolean;
}

export default function LabResultsList({
  orderId,
  patientId,
  onSelectResult,
  showAbnormalOnly = false
}: LabResultsListProps) {
  const [page, setPage] = useState(1);
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>();

  const { data, loading, error } = useLabResults({
    order_id: orderId,
    patient_id: patientId,
    is_abnormal: showAbnormalOnly ? true : undefined,
    verified: verifiedFilter,
    page,
    limit: 20
  });

  const getAbnormalityIndicator = (result: LabResult) => {
    if (!result.is_abnormal) return null;

    const flag = result.abnormal_flag;
    if (flag === 'HH' || flag === 'LL') {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-bold">Critical</span>
        </div>
      );
    }

    if (flag === 'H') {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">High</span>
        </div>
      );
    }

    if (flag === 'L') {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs font-medium">Low</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">Abnormal</span>
      </div>
    );
  };

  const getResultDisplay = (result: LabResult) => {
    if (result.result_numeric !== null) {
      return (
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {result.result_numeric} {result.result_unit}
          </div>
          {result.reference_range && (
            <div className="text-xs text-gray-500">
              Ref: {result.reference_range}
            </div>
          )}
        </div>
      );
    }

    if (result.result_value) {
      return (
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {result.result_value}
          </div>
        </div>
      );
    }

    if (result.result_text) {
      return (
        <div className="text-right">
          <div className="text-sm text-gray-900 line-clamp-2">
            {result.result_text}
          </div>
        </div>
      );
    }

    return (
      <div className="text-right">
        <div className="text-sm text-gray-400 italic">
          No result
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={verifiedFilter === true}
              onChange={(e) => setVerifiedFilter(e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Verified only</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={verifiedFilter === false}
              onChange={(e) => setVerifiedFilter(e.target.checked ? false : undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Pending verification</span>
          </label>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {data?.results.map((result) => (
          <div
            key={result.id}
            onClick={() => onSelectResult?.(result)}
            className={`bg-white rounded-lg border-2 p-4 transition-all ${
              result.is_abnormal
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200'
            } ${
              onSelectResult ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              {/* Left Side - Test Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {result.test_name}
                  </h3>
                  {result.test_code && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {result.test_code}
                    </span>
                  )}
                  {getAbnormalityIndicator(result)}
                </div>

                {/* Patient Info (if not filtered) */}
                {!patientId && result.patient_name && (
                  <div className="text-sm text-gray-600 mb-2">
                    {result.patient_name}
                    {result.patient_number && (
                      <span className="text-gray-400 ml-2">({result.patient_number})</span>
                    )}
                  </div>
                )}

                {/* Order Info */}
                {result.order_number && (
                  <div className="text-sm text-gray-600 mb-2">
                    Order: {result.order_number}
                  </div>
                )}

                {/* Result Date */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(result.result_date), 'MMM dd, yyyy HH:mm')}</span>
                </div>

                {/* Performed By */}
                {result.performed_by_name && (
                  <div className="text-sm text-gray-600 mt-1">
                    Performed by: {result.performed_by_name}
                  </div>
                )}

                {/* Interpretation Preview */}
                {result.interpretation && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-1">
                    {result.interpretation}
                  </p>
                )}
              </div>

              {/* Right Side - Result Value & Status */}
              <div className="flex flex-col items-end gap-2 ml-4">
                {/* Result Value */}
                {getResultDisplay(result)}

                {/* Verification Status */}
                <div className="flex items-center gap-2 mt-2">
                  {result.verified_at ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="text-right">
                        <div className="text-xs font-medium text-green-700">Verified</div>
                        {result.verified_by_name && (
                          <div className="text-xs text-gray-500">
                            by {result.verified_by_name}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div className="text-xs font-medium text-yellow-700">
                        Pending Verification
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.results.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {showAbnormalOnly
              ? 'No abnormal results to display'
              : 'Results will appear here once available'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of{' '}
            {data.pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
