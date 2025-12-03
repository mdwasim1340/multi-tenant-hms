'use client';

/**
 * Lab Report Detail Component
 * Full detail view with test results table and history trends
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Calendar,
  User,
  Building,
  AlertTriangle,
  Download,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  History,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { useLabReportDetails } from '@/hooks/useMedicalRecordsModule';
import * as api from '@/lib/api/medical-records-module';
import type { LabReport, LabTestResult } from '@/types/medical-records';

interface LabReportDetailProps {
  reportId: number;
  patientId: number;
  onClose?: () => void;
}

export function LabReportDetail({ reportId, patientId, onClose }: LabReportDetailProps) {
  const { report, loading, error, refetch } = useLabReportDetails(reportId);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [testHistory, setTestHistory] = useState<Record<string, LabReport[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});

  const toggleTestExpanded = async (testCode: string) => {
    const newExpanded = new Set(expandedTests);
    
    if (newExpanded.has(testCode)) {
      newExpanded.delete(testCode);
    } else {
      newExpanded.add(testCode);
      // Load history if not already loaded
      if (!testHistory[testCode] && !loadingHistory[testCode]) {
        await loadTestHistory(testCode);
      }
    }
    
    setExpandedTests(newExpanded);
  };

  const loadTestHistory = async (testCode: string) => {
    setLoadingHistory((prev) => ({ ...prev, [testCode]: true }));
    try {
      const history = await api.fetchLabReportHistory(patientId, testCode);
      setTestHistory((prev) => ({ ...prev, [testCode]: history }));
    } catch (err) {
      console.error('Failed to load test history:', err);
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [testCode]: false }));
    }
  };

  const handleDownload = () => {
    if (report?.attachment_url) {
      window.open(report.attachment_url, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error || 'Report not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{report.test_name}</CardTitle>
                {report.has_abnormal && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Abnormal
                  </Badge>
                )}
              </div>
              {report.panel_name && (
                <p className="text-muted-foreground">{report.panel_name}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Order #: {report.order_number}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {report.attachment_url && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem
              icon={Calendar}
              label="Report Date"
              value={format(new Date(report.report_date), 'MMM dd, yyyy')}
            />
            <InfoItem
              icon={Calendar}
              label="Collection Date"
              value={format(new Date(report.collection_date), 'MMM dd, yyyy')}
            />
            <InfoItem
              icon={User}
              label="Ordering Doctor"
              value={report.ordering_doctor_name || 'N/A'}
            />
            <InfoItem
              icon={Building}
              label="Laboratory"
              value={report.lab_name || 'N/A'}
            />
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge variant="outline" className="capitalize">
              {report.status}
            </Badge>
            {report.visit_type && (
              <Badge variant="secondary">{report.visit_type}</Badge>
            )}
            {report.department && (
              <Badge variant="secondary">{report.department}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-muted text-sm font-medium">
              <div className="col-span-4">Test Name</div>
              <div className="col-span-2 text-right">Result</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-3">Reference Range</div>
              <div className="col-span-1 text-center">Flag</div>
            </div>

            {/* Test Rows */}
            {report.results.map((result, idx) => (
              <TestResultRow
                key={idx}
                result={result}
                isExpanded={expandedTests.has(result.test_name)}
                onToggle={() => toggleTestExpanded(result.test_name)}
                history={testHistory[result.test_name]}
                loadingHistory={loadingHistory[result.test_name]}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Test Result Row with expandable history
interface TestResultRowProps {
  result: LabTestResult;
  isExpanded: boolean;
  onToggle: () => void;
  history?: LabReport[];
  loadingHistory?: boolean;
}

function TestResultRow({
  result,
  isExpanded,
  onToggle,
  history,
  loadingHistory,
}: TestResultRowProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div
          className={`grid grid-cols-12 gap-2 p-3 border-t cursor-pointer hover:bg-muted/50 transition-colors ${
            result.is_abnormal ? 'bg-red-50' : ''
          }`}
        >
          <div className="col-span-4 flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
            <span className="font-medium">{result.test_name}</span>
          </div>
          <div
            className={`col-span-2 text-right font-semibold ${
              result.is_abnormal ? 'text-red-600' : ''
            }`}
          >
            {result.result_value}
          </div>
          <div className="col-span-2 text-muted-foreground">
            {result.result_unit || '-'}
          </div>
          <div className="col-span-3 text-muted-foreground text-sm">
            {result.reference_range || '-'}
          </div>
          <div className="col-span-1 flex justify-center">
            {result.is_abnormal && <AbnormalFlag flag={result.abnormal_flag} />}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-6 py-4 bg-muted/30 border-t">
          {/* Interpretation */}
          {result.interpretation && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Interpretation</p>
              <p className="text-sm text-muted-foreground">{result.interpretation}</p>
            </div>
          )}

          {/* History Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Previous Results</p>
            </div>

            {loadingHistory ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-1">
                {/* Mini history table */}
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b">
                  <div>Date</div>
                  <div className="text-right">Result</div>
                  <div>Status</div>
                </div>
                {history.slice(0, 5).map((historyItem, idx) => {
                  const historyResult = historyItem.results.find(
                    (r) => r.test_name === result.test_name
                  );
                  if (!historyResult) return null;
                  
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-3 gap-2 text-sm py-1 ${
                        historyResult.is_abnormal ? 'text-red-600' : ''
                      }`}
                    >
                      <div>{format(new Date(historyItem.report_date), 'MMM dd, yyyy')}</div>
                      <div className="text-right font-medium">
                        {historyResult.result_value} {historyResult.result_unit}
                      </div>
                      <div className="flex items-center gap-1">
                        {historyResult.is_abnormal && (
                          <AbnormalFlag flag={historyResult.abnormal_flag} small />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">
                          {historyItem.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Trend indicator placeholder */}
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    📊 Trend visualization coming soon
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No previous results available for this test
              </p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Helper Components
function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function AbnormalFlag({ flag, small = false }: { flag?: string; small?: boolean }) {
  const size = small ? 'h-3 w-3' : 'h-4 w-4';
  
  if (!flag) {
    return <AlertTriangle className={`${size} text-yellow-600`} />;
  }
  
  switch (flag) {
    case 'H':
      return (
        <span className="flex items-center gap-0.5 text-orange-600">
          <TrendingUp className={size} />
          {!small && <span className="text-xs">High</span>}
        </span>
      );
    case 'L':
      return (
        <span className="flex items-center gap-0.5 text-orange-600">
          <TrendingDown className={size} />
          {!small && <span className="text-xs">Low</span>}
        </span>
      );
    case 'HH':
      return (
        <span className="flex items-center gap-0.5 text-red-600">
          <TrendingUp className={size} />
          {!small && <span className="text-xs font-bold">Critical High</span>}
        </span>
      );
    case 'LL':
      return (
        <span className="flex items-center gap-0.5 text-red-600">
          <TrendingDown className={size} />
          {!small && <span className="text-xs font-bold">Critical Low</span>}
        </span>
      );
    default:
      return <AlertTriangle className={`${size} text-yellow-600`} />;
  }
}
