import express from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingRead } from '../middleware/billing-auth';
import pool from '../database';

const router = express.Router();

// Revenue report (daily/weekly/monthly)
router.get('/revenue', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { period = 'monthly', start_date, end_date } = req.query;

    let dateFormat: string;
    let interval: string;

    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        interval = '30 days';
        break;
      case 'weekly':
        dateFormat = 'IYYY-IW';
        interval = '12 weeks';
        break;
      case 'yearly':
        dateFormat = 'YYYY';
        interval = '5 years';
        break;
      case 'monthly':
      default:
        dateFormat = 'YYYY-MM';
        interval = '12 months';
        break;
    }

    // Use COALESCE to fallback to created_at if paid_at is NULL
    const query = `
      SELECT 
        TO_CHAR(COALESCE(paid_at, created_at), '${dateFormat}') as period,
        COUNT(*) as invoice_count,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN payment_method = 'razorpay' THEN amount ELSE 0 END) as online_revenue,
        SUM(CASE WHEN payment_method IN ('cash', 'cheque', 'bank_transfer', 'manual') OR payment_method IS NULL THEN amount ELSE 0 END) as offline_revenue
      FROM invoices
      WHERE tenant_id = $1
        AND status = 'paid'
        AND COALESCE(paid_at, created_at) >= COALESCE($2::DATE, CURRENT_DATE - INTERVAL '${interval}')
        AND COALESCE(paid_at, created_at) <= COALESCE($3::DATE, CURRENT_DATE)
      GROUP BY TO_CHAR(COALESCE(paid_at, created_at), '${dateFormat}')
      ORDER BY period DESC
    `;

    const result = await pool.query(query, [tenantId, start_date || null, end_date || null]);

    // Calculate totals
    const totals = result.rows.reduce((acc, row) => ({
      total_revenue: acc.total_revenue + parseFloat(row.total_revenue || 0),
      online_revenue: acc.online_revenue + parseFloat(row.online_revenue || 0),
      offline_revenue: acc.offline_revenue + parseFloat(row.offline_revenue || 0),
      invoice_count: acc.invoice_count + parseInt(row.invoice_count || 0)
    }), { total_revenue: 0, online_revenue: 0, offline_revenue: 0, invoice_count: 0 });

    res.json({
      success: true,
      period,
      data: result.rows.map(row => ({
        period: row.period,
        invoice_count: parseInt(row.invoice_count),
        total_revenue: parseFloat(row.total_revenue || 0),
        online_revenue: parseFloat(row.online_revenue || 0),
        offline_revenue: parseFloat(row.offline_revenue || 0)
      })),
      totals
    });
  } catch (error: any) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate revenue report',
      code: 'REVENUE_REPORT_ERROR'
    });
  }
});

// Accounts receivable aging report
router.get('/aging', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const query = `
      SELECT 
        CASE 
          WHEN due_date >= CURRENT_DATE THEN 'current'
          WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
          WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
          WHEN due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
          ELSE '90+'
        END as aging_bucket,
        COUNT(*) as invoice_count,
        SUM(amount) as total_amount
      FROM invoices
      WHERE tenant_id = $1
        AND status IN ('pending', 'overdue')
      GROUP BY 
        CASE 
          WHEN due_date >= CURRENT_DATE THEN 'current'
          WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
          WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
          WHEN due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
          ELSE '90+'
        END
      ORDER BY 
        CASE aging_bucket
          WHEN 'current' THEN 1
          WHEN '1-30' THEN 2
          WHEN '31-60' THEN 3
          WHEN '61-90' THEN 4
          ELSE 5
        END
    `;

    const result = await pool.query(query, [tenantId]);

    // Initialize all buckets
    const buckets = {
      current: { count: 0, amount: 0 },
      '1-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 }
    };

    result.rows.forEach(row => {
      buckets[row.aging_bucket as keyof typeof buckets] = {
        count: parseInt(row.invoice_count),
        amount: parseFloat(row.total_amount || 0)
      };
    });

    const totalOutstanding = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);

    res.json({
      success: true,
      aging_buckets: buckets,
      total_outstanding: totalOutstanding,
      total_invoices: Object.values(buckets).reduce((sum, b) => sum + b.count, 0)
    });
  } catch (error: any) {
    console.error('Error generating aging report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate aging report',
      code: 'AGING_REPORT_ERROR'
    });
  }
});

// Collection efficiency report
router.get('/collection', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { months = 6 } = req.query;

    const query = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        SUM(amount) as total_billed,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
        AVG(CASE WHEN status = 'paid' THEN EXTRACT(DAY FROM paid_at - created_at) END) as avg_days_to_pay
      FROM invoices
      WHERE tenant_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(months as string)} months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `;

    const result = await pool.query(query, [tenantId]);

    const data = result.rows.map(row => ({
      month: row.month,
      total_invoices: parseInt(row.total_invoices),
      paid_invoices: parseInt(row.paid_invoices || 0),
      total_billed: parseFloat(row.total_billed || 0),
      total_collected: parseFloat(row.total_collected || 0),
      collection_rate: row.total_billed > 0 
        ? ((parseFloat(row.total_collected || 0) / parseFloat(row.total_billed)) * 100).toFixed(2)
        : 0,
      avg_days_to_pay: row.avg_days_to_pay ? parseFloat(row.avg_days_to_pay).toFixed(1) : null
    }));

    // Calculate overall metrics
    const totals = data.reduce((acc, row) => ({
      total_billed: acc.total_billed + row.total_billed,
      total_collected: acc.total_collected + row.total_collected,
      total_invoices: acc.total_invoices + row.total_invoices,
      paid_invoices: acc.paid_invoices + row.paid_invoices
    }), { total_billed: 0, total_collected: 0, total_invoices: 0, paid_invoices: 0 });

    res.json({
      success: true,
      data,
      summary: {
        ...totals,
        overall_collection_rate: totals.total_billed > 0 
          ? ((totals.total_collected / totals.total_billed) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error: any) {
    console.error('Error generating collection report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate collection report',
      code: 'COLLECTION_REPORT_ERROR'
    });
  }
});

// Payment method breakdown (payer mix analysis)
router.get('/payer-mix', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date } = req.query;

    const query = `
      SELECT 
        COALESCE(payment_method, 'unknown') as payment_method,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM invoices
      WHERE tenant_id = $1
        AND status = 'paid'
        AND paid_at >= COALESCE($2::DATE, CURRENT_DATE - INTERVAL '12 months')
        AND paid_at <= COALESCE($3::DATE, CURRENT_DATE)
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, [tenantId, start_date || null, end_date || null]);

    const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);

    const data = result.rows.map(row => ({
      payment_method: row.payment_method,
      transaction_count: parseInt(row.transaction_count),
      total_amount: parseFloat(row.total_amount || 0),
      percentage: totalAmount > 0 
        ? ((parseFloat(row.total_amount || 0) / totalAmount) * 100).toFixed(2)
        : 0
    }));

    res.json({
      success: true,
      data,
      total_amount: totalAmount
    });
  } catch (error: any) {
    console.error('Error generating payer mix report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate payer mix report',
      code: 'PAYER_MIX_REPORT_ERROR'
    });
  }
});

// Department-wise revenue breakdown
router.get('/department-revenue', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date } = req.query;

    const query = `
      SELECT 
        COALESCE(department, 'General') as department,
        COALESCE(service_type, 'other') as service_type,
        COUNT(*) as invoice_count,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected_revenue,
        SUM(CASE WHEN status IN ('pending', 'overdue') THEN amount ELSE 0 END) as outstanding_revenue
      FROM invoices
      WHERE tenant_id = $1
        AND created_at >= COALESCE($2::DATE, CURRENT_DATE - INTERVAL '12 months')
        AND created_at <= COALESCE($3::DATE, CURRENT_DATE)
      GROUP BY department, service_type
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, [tenantId, start_date || null, end_date || null]);

    // Group by department
    const departmentMap: Record<string, any> = {};
    result.rows.forEach(row => {
      const dept = row.department;
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          total_revenue: 0,
          collected_revenue: 0,
          outstanding_revenue: 0,
          invoice_count: 0,
          services: []
        };
      }
      departmentMap[dept].total_revenue += parseFloat(row.total_revenue || 0);
      departmentMap[dept].collected_revenue += parseFloat(row.collected_revenue || 0);
      departmentMap[dept].outstanding_revenue += parseFloat(row.outstanding_revenue || 0);
      departmentMap[dept].invoice_count += parseInt(row.invoice_count);
      departmentMap[dept].services.push({
        service_type: row.service_type,
        revenue: parseFloat(row.total_revenue || 0),
        count: parseInt(row.invoice_count)
      });
    });

    const data = Object.values(departmentMap).sort((a: any, b: any) => b.total_revenue - a.total_revenue);

    res.json({
      success: true,
      data,
      total_revenue: data.reduce((sum: number, d: any) => sum + d.total_revenue, 0)
    });
  } catch (error: any) {
    console.error('Error generating department revenue report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate department revenue report',
      code: 'DEPARTMENT_REVENUE_REPORT_ERROR'
    });
  }
});

// Bad debt tracking report
router.get('/bad-debt', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Get overdue invoices older than 90 days
    const query = `
      SELECT 
        i.*,
        EXTRACT(DAY FROM CURRENT_DATE - i.due_date) as days_overdue
      FROM invoices i
      WHERE i.tenant_id = $1
        AND i.status = 'overdue'
        AND i.due_date < CURRENT_DATE - INTERVAL '90 days'
      ORDER BY i.due_date ASC
      LIMIT 100
    `;

    const result = await pool.query(query, [tenantId]);

    // Get write-offs
    const writeOffsQuery = `
      SELECT 
        SUM(amount) as total_written_off,
        COUNT(*) as write_off_count
      FROM billing_adjustments
      WHERE tenant_id = $1
        AND adjustment_type = 'write_off'
        AND status = 'applied'
    `;

    const writeOffsResult = await pool.query(writeOffsQuery, [tenantId]);

    const badDebtInvoices = result.rows.map(row => ({
      id: row.id,
      invoice_number: row.invoice_number,
      patient_name: row.patient_name,
      amount: parseFloat(row.amount),
      due_date: row.due_date,
      days_overdue: parseInt(row.days_overdue)
    }));

    const totalBadDebt = badDebtInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      success: true,
      bad_debt_invoices: badDebtInvoices,
      summary: {
        total_bad_debt: totalBadDebt,
        invoice_count: badDebtInvoices.length,
        total_written_off: parseFloat(writeOffsResult.rows[0]?.total_written_off || 0),
        write_off_count: parseInt(writeOffsResult.rows[0]?.write_off_count || 0)
      }
    });
  } catch (error: any) {
    console.error('Error generating bad debt report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate bad debt report',
      code: 'BAD_DEBT_REPORT_ERROR'
    });
  }
});

// Tax summary report
router.get('/tax-summary', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { start_date, end_date } = req.query;

    const query = `
      SELECT 
        TO_CHAR(paid_at, 'YYYY-MM') as month,
        SUM(tax_amount) as total_tax_collected,
        SUM(amount) as total_revenue,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE tenant_id = $1
        AND status = 'paid'
        AND tax_amount > 0
        AND paid_at >= COALESCE($2::DATE, CURRENT_DATE - INTERVAL '12 months')
        AND paid_at <= COALESCE($3::DATE, CURRENT_DATE)
      GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
      ORDER BY month DESC
    `;

    const result = await pool.query(query, [tenantId, start_date || null, end_date || null]);

    const data = result.rows.map(row => ({
      month: row.month,
      total_tax_collected: parseFloat(row.total_tax_collected || 0),
      total_revenue: parseFloat(row.total_revenue || 0),
      invoice_count: parseInt(row.invoice_count),
      effective_tax_rate: parseFloat(row.total_revenue) > 0
        ? ((parseFloat(row.total_tax_collected) / parseFloat(row.total_revenue)) * 100).toFixed(2)
        : 0
    }));

    const totals = data.reduce((acc, row) => ({
      total_tax: acc.total_tax + row.total_tax_collected,
      total_revenue: acc.total_revenue + row.total_revenue
    }), { total_tax: 0, total_revenue: 0 });

    res.json({
      success: true,
      data,
      summary: {
        total_tax_collected: totals.total_tax,
        total_revenue: totals.total_revenue,
        average_tax_rate: totals.total_revenue > 0
          ? ((totals.total_tax / totals.total_revenue) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error: any) {
    console.error('Error generating tax summary report:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate tax summary report',
      code: 'TAX_SUMMARY_REPORT_ERROR'
    });
  }
});

// Dashboard summary (combined KPIs)
router.get('/dashboard', hospitalAuthMiddleware, requireBillingRead, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Get current month stats
    const currentMonthQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        SUM(amount) as total_billed,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status IN ('pending', 'overdue') THEN amount ELSE 0 END) as total_outstanding
      FROM invoices
      WHERE tenant_id = $1
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const currentMonthResult = await pool.query(currentMonthQuery, [tenantId]);

    // Get previous month for comparison
    const prevMonthQuery = `
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected
      FROM invoices
      WHERE tenant_id = $1
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `;

    const prevMonthResult = await pool.query(prevMonthQuery, [tenantId]);

    // Get today's collections (use COALESCE to fallback to created_at if paid_at is NULL)
    const todayQuery = `
      SELECT 
        COUNT(*) as payments_today,
        SUM(amount) as collected_today
      FROM invoices
      WHERE tenant_id = $1
        AND status = 'paid'
        AND DATE(COALESCE(paid_at, created_at)) = CURRENT_DATE
    `;

    const todayResult = await pool.query(todayQuery, [tenantId]);

    // Get upcoming due (next 7 days)
    const upcomingDueQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(amount) as amount
      FROM invoices
      WHERE tenant_id = $1
        AND status = 'pending'
        AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `;

    const upcomingDueResult = await pool.query(upcomingDueQuery, [tenantId]);

    const current = currentMonthResult.rows[0];
    const prev = prevMonthResult.rows[0];
    const today = todayResult.rows[0];
    const upcoming = upcomingDueResult.rows[0];

    const currentCollected = parseFloat(current.total_collected || 0);
    const prevCollected = parseFloat(prev.total_collected || 0);
    const growthRate = prevCollected > 0 
      ? (((currentCollected - prevCollected) / prevCollected) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      dashboard: {
        current_month: {
          total_invoices: parseInt(current.total_invoices || 0),
          paid_invoices: parseInt(current.paid_invoices || 0),
          pending_invoices: parseInt(current.pending_invoices || 0),
          overdue_invoices: parseInt(current.overdue_invoices || 0),
          total_billed: parseFloat(current.total_billed || 0),
          total_collected: currentCollected,
          total_outstanding: parseFloat(current.total_outstanding || 0),
          collection_rate: parseFloat(current.total_billed) > 0
            ? ((currentCollected / parseFloat(current.total_billed)) * 100).toFixed(1)
            : 0
        },
        today: {
          payments_count: parseInt(today.payments_today || 0),
          amount_collected: parseFloat(today.collected_today || 0)
        },
        upcoming_due: {
          count: parseInt(upcoming.count || 0),
          amount: parseFloat(upcoming.amount || 0)
        },
        growth: {
          rate: growthRate,
          previous_month_collected: prevCollected
        }
      }
    });
  } catch (error: any) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate dashboard',
      code: 'DASHBOARD_ERROR'
    });
  }
});

export default router;
