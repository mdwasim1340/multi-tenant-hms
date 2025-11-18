/**
 * Lab Result Details Component
 * 
 * View detailed lab result information
 */

'use client';

import { useState } from 'react';
import { useLabResult, useResultHistory } from '@/hooks/useLabResults';
import { useLabResultMutations } from '@/hooks/useLabResults';
import {
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  Edit,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LabResultDetailsProps {
  resultId: number;
  onClose?: () => void;
  onUpdate?: () => void;
  onEdit?: () => void;
}

export default function LabResultDetails({
  resultId,
  onClose,
  onUpdate,
  onEdit
}: LabResultDetailsProps) {
  const { data: result, loading, error, refetch } = useLabResult(resultId);
  const { data: history } = useResultHistory(
    result?.patient_id || null,
    result?.test_code || undefined
  );
  const { verifyLabResult, loading: verifying } = useLabResultMutations();

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleVerify = async () => {
    try {
      await verifyLabResult(resultId, 1); // TODO: Get from auth context
      setShowVerifyModal(false);
      refetch();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to verify result:', err);
    }
  };

  const getAbnormalityBadge = () => {
    if (!result?.is_abnormal) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4" />
          Normal
        </span>
      );
    }

    const flag = result.abnormal_flag;
    if (flag === 'HH' || flag === 'LL') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          Critical {flag === 'HH' ? 'High' : 'Low'}
        </span>
      );
    }

    if (flag === 'H') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <TrendingUp className="h-4 w-4" />
          High
        </span>
      );
    }

    if (flag === 'L') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <TrendingDown className="h-4 w-4" />
          Low
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle className="h-4 w-4" />
        Abnormal
      </span>
    );
  };

  const getResultDisplay = () => {
    if (result?.result_numeric !== null) {
      return (
        <div className="text-4xl font-bold text-gray-900">
          {result.result_numeric} {result.result_unit}
        </div>
      );
    }

    if (result?.result_value) {
      return (
        <div className="text-3xl font-bold text-gray-900">
          {result.result_value}
        </div>
      );
    }

    if (result?.result_text) {
      return (
        <div className="text-lg text-gray-900">
          {result.result_text}
        </div>
      );
    }

    return null;
  };

  // Prepare trend chart data
  const getTrendChartData = () => {
    if (!history || history.length === 0 || !result?.result_numeric) {
      return null;
    }

    const numericHistory = history.filter(h => h.result_numeric !== null);
    if (numericHistory.length < 2) return null;

    return {
      labels: numericHistory.map(h => format(new Date(h.result_date), 'MMM dd')),
      datasets: [
        {
          label: result.test_name,
          data: numericHistory.map(h => h.result_numeric),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Result not found'}</p>
      </div>
    );
  }

  const trendData = getTrendChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{result.test_name}</h2>
            {getAbnormalityBadge()}
          </div>
          <p className="text-gray-600">
            {result.test_code} • {format(new Date(result.result_date), 'MMMM dd, yyyy HH:mm')}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Result Value */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-8 text-center">
        {getResultDisplay()}
        {result.reference_range && (
          <p className="mt-2 text-sm text-gray-500">
            Reference Range: {result.reference_range}
          </p>
        )}
      </div>

      {/* Patient Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Patient Name</p>
            <p className="font-medium text-gray-900">{result.patient_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Patient Number</p>
            <p className="font-medium text-gray-900">{result.patient_number}</p>
          </div>
        </div>
      </div>

      {/* Test Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Test Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-medium text-gray-900">{result.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Result Date</p>
            <p className="font-medium text-gray-900">
              {format(new Date(result.result_date), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {result.performed_by_name && (
            <div>
              <p className="text-sm text-gray-500">Performed By</p>
              <p className="font-medium text-gray-900">{result.performed_by_name}</p>
            </div>
          )}
          {result.verified_at && result.verified_by_name && (
            <>
              <div>
                <p className="text-sm text-gray-500">Verified By</p>
                <p className="font-medium text-gray-900">{result.verified_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Verification Date</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(result.verified_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interpretation */}
      {result.interpretation && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Clinical Interpretation</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{result.interpretation}</p>
        </div>
      )}

      {/* Notes */}
      {result.notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{result.notes}</p>
        </div>
      )}

      {/* Trend Chart */}
      {trendData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Result Trend</h3>
          <div className="h-64">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        {onEdit && (
          <button
            onClick={onEdit}
            disabled={verifying}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <Edit className="h-5 w-5" />
            Edit Result
          </button>
        )}
        {!result.verified_at && (
          <button
            onClick={() => setShowVerifyModal(true)}
            disabled={verifying}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            Verify Result
          </button>
        )}
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Verify Lab Result
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to verify this result? This action confirms that the result
              has been reviewed and is accurate.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                disabled={verifying}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
