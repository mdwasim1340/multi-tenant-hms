import { useState, useEffect, useCallback } from 'react';
import { billingJobsAPI, JobStatus, DailySummary, RemindersStatus, PaymentPlansDue } from '@/lib/api/billing-jobs';

export function useBillingJobs() {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [remindersStatus, setRemindersStatus] = useState<RemindersStatus | null>(null);
  const [paymentPlansDue, setPaymentPlansDue] = useState<PaymentPlansDue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await billingJobsAPI.getJobStatus();
      setJobStatus(status);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchDailySummary = useCallback(async () => {
    try {
      setError(null);
      const summary = await billingJobsAPI.getDailySummary();
      setDailySummary(summary);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchRemindersStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await billingJobsAPI.getRemindersStatus();
      setRemindersStatus(status);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchPaymentPlansDue = useCallback(async () => {
    try {
      setError(null);
      const plans = await billingJobsAPI.getPaymentPlansDue();
      setPaymentPlansDue(plans);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const runDailyJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await billingJobsAPI.runDailyJobs();
      // Refresh data after running jobs
      await Promise.all([
        fetchDailySummary(),
        fetchRemindersStatus(),
        fetchPaymentPlansDue()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDailySummary, fetchRemindersStatus, fetchPaymentPlansDue]);

  const runWeeklyJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await billingJobsAPI.runWeeklyJobs();
      await fetchDailySummary();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDailySummary]);

  const markOverdueInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await billingJobsAPI.markOverdueInvoices();
      await fetchDailySummary();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDailySummary]);

  const applyLateFees = useCallback(async (lateFeePercent: number = 2) => {
    try {
      setLoading(true);
      setError(null);
      const result = await billingJobsAPI.applyLateFees(lateFeePercent);
      await fetchDailySummary();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDailySummary]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobStatus(),
        fetchDailySummary(),
        fetchRemindersStatus(),
        fetchPaymentPlansDue()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchJobStatus, fetchDailySummary, fetchRemindersStatus, fetchPaymentPlansDue]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    jobStatus,
    dailySummary,
    remindersStatus,
    paymentPlansDue,
    loading,
    error,
    actions: {
      runDailyJobs,
      runWeeklyJobs,
      markOverdueInvoices,
      applyLateFees,
      refreshAll
    }
  };
}
