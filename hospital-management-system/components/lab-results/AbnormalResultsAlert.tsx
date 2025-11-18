/**
 * Abnormal Results Alert Component
 * 
 * Display critical and abnormal lab results
 */

'use client';

import { useState } from 'react';
import { useAbnormalResults, useCriticalResults } from '@/hooks/useLabResults';
import { LabResult } from '@/lib/api/lab-results';
import { AlertTriangle, X, Eye, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface AbnormalResultsAlertProps {
  onViewResult?: (result: LabResult) => void;
  showCriticalOnly?: boolean;
}

export default function AbnormalResultsAlert({
  onViewResult,
  showCriticalOnly = false
}: AbnormalResultsAlertProps) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);

  const { data: abnormalResults, loading: loadingAbnormal } = useAbnormalResults();
  const { data: criticalResults, loading: loadingCritical } = useCriticalResults();

  const results = showCriticalOnly ? criticalResults : abnormalResults;
  const loading = showCriticalOnly ? loadingCritical : loadingAbnormal;

  // Filter out dismissed results
  const activeResults = results?.filter(r => !dismissed.includes(r.id)) || [];

  const handleDismiss = (resultId: number) => {
    setDismissed([...dismissed, resultId]);
  };

  const getCriticalityLevel = (result: LabResult) => {
    if (result.abnormal_flag === 'HH' || result.abnormal_flag === 'LL') {
      return 'critical';
    }
    if (result.abnormal_flag === 'H' || result.abnormal_flag === 'L') {
      return 'high';
    }
    return 'abnormal';
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getIconColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getIcon = (result: LabResult) => {
    if (result.abnormal_flag === 'H' || result.abnormal_flag === 'HH') {
      return <TrendingUp className="h-5 w-5" />;
    }
    if (result.abnormal_flag === 'L' || result.abnormal_flag === 'LL') {
      return <TrendingDown className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  if (loading) {
    return null;
  }

  if (activeResults.length === 0) {
    return null;
  }

  // Show compact view if not expanded
  if (!expanded) {
    const criticalCount = activeResults.filter(r => getCriticalityLevel(r) === 'critical').length;
    const highCount = activeResults.filter(r => getCriticalityLevel(r) === 'high').length;
    const abnormalCount = activeResults.filter(r => getCriticalityLevel(r) === 'abnormal').length;

    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-red-600 animate-pulse" />
            <div>
              <h3 className="font-semibold text-red-900">
                {showCriticalOnly ? 'Critical Results Alert' : 'Abnormal Results Alert'}
              </h3>
              <p className="text-sm text-red-700">
                {criticalCount > 0 && `${criticalCount} critical`}
                {criticalCount > 0 && (highCount > 0 || abnormalCount > 0) && ', '}
                {highCount > 0 && `${highCount} high`}
                {highCount > 0 && abnormalCount > 0 && ', '}
                {abnormalCount > 0 && `${abnormalCount} abnormal`}
                {' '}result{activeResults.length !== 1 ? 's' : ''} require attention
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  // Show expanded view
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">
                {showCriticalOnly ? 'Critical Results' : 'Abnormal Results'}
              </h3>
              <p className="text-sm text-red-700">
                {activeResults.length} result{activeResults.length !== 1 ? 's' : ''} require attention
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results List */}
      {activeResults.map((result) => {
        const level = getCriticalityLevel(result);
        const alertColor = getAlertColor(level);
        const iconColor = getIconColor(level);

        return (
          <div
            key={result.id}
            className={`rounded-lg border-2 p-4 ${alertColor}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={iconColor}>
                    {getIcon(result)}
                  </div>
                  <h4 className="font-semibold">
                    {result.test_name}
                  </h4>
                  {level === 'critical' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                      CRITICAL
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Patient:</span>
                    <span>{result.patient_name}</span>
                    {result.patient_number && (
                      <span className="text-gray-600">({result.patient_number})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Result:</span>
                    <span className="font-bold">
                      {result.result_numeric !== null
                        ? `${result.result_numeric} ${result.result_unit || ''}`
                        : result.result_value || result.result_text}
                    </span>
                    {result.reference_range && (
                      <span className="text-gray-600">(Ref: {result.reference_range})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Date:</span>
                    <span>{format(new Date(result.result_date), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {result.interpretation && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                      <p className="text-sm">{result.interpretation}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {onViewResult && (
                  <button
                    onClick={() => onViewResult(result)}
                    className="px-3 py-1.5 bg-white border border-current rounded-lg hover:bg-opacity-90 text-sm font-medium flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(result.id)}
                  className="px-3 py-1.5 bg-white border border-current rounded-lg hover:bg-opacity-90 text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
