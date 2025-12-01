/**
 * Billing Jobs API Client
 * Frontend interface for billing automation features
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface JobStatus {
  emailsEnabled: boolean;
  adminEmail: string;
  lastRun: string;
}

export interface DailySummary {
  date: string;
  pending_count: number;
  overdue_count: number;
  paid_today_count: number;
  pending_amount: number;
  overdue_amount: number;
  collected_today: number;
}

export interface RemindersStatus {
  upcoming: {
    dueIn3Days: number;
    dueIn1Day: number;
    dueToday: number;
  };
  overdue: {
    overdue7Days: number;
    overdue14Days: number;
    overdue30Days: number;
  };
}

export interface PaymentPlansDue {
  dueToday: any[];
  overdue: any[];
}

class BillingJobsAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    
    const tenantId = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant_id='))
      ?.split('=')[1];

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId || '',
        'X-App-ID': 'hospital-management',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Get job scheduler status
  async getJobStatus(): Promise<JobStatus> {
    const response = await this.request('/api/billing/jobs/status');
    return response.status;
  }

  // Manually trigger daily jobs
  async runDailyJobs(): Promise<{ message: string }> {
    return this.request('/api/billing/jobs/run-daily', { method: 'POST' });
  }

  // Manually trigger weekly jobs
  async runWeeklyJobs(): Promise<{ message: string }> {
    return this.request('/api/billing/jobs/run-weekly', { method: 'POST' });
  }

  // Mark overdue invoices
  async markOverdueInvoices(): Promise<{ message: string; invoices: any[] }> {
    return this.request('/api/billing/jobs/mark-overdue', { method: 'POST' });
  }

  // Apply late fees
  async applyLateFees(lateFeePercent: number = 2): Promise<{ message: string; totalFees: number }> {
    return this.request('/api/billing/jobs/apply-late-fees', {
      method: 'POST',
      body: JSON.stringify({ lateFeePercent })
    });
  }

  // Get invoices due for reminders
  async getRemindersStatus(): Promise<RemindersStatus> {
    return this.request('/api/billing/jobs/reminders-due');
  }

  // Get daily billing summary
  async getDailySummary(): Promise<DailySummary> {
    const response = await this.request('/api/billing/jobs/daily-summary');
    return response.summary;
  }

  // Get payment plans due
  async getPaymentPlansDue(): Promise<PaymentPlansDue> {
    return this.request('/api/billing/jobs/payment-plans-due');
  }
}

export const billingJobsAPI = new BillingJobsAPI();
