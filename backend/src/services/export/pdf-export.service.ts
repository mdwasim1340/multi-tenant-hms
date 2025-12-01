/**
 * PDF Export Service
 * 
 * Exports balance reports to PDF format with professional layout,
 * tables, and branding. Uses HTML-to-PDF approach for simplicity.
 * 
 * Note: This service generates HTML that can be converted to PDF
 * using browser print or a PDF library like puppeteer/html-pdf.
 * 
 * Requirements: 8.1, 8.4, 8.5
 */

import {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport
} from '../../types/balance-reports';

/**
 * PDF Export Service using HTML generation
 * The generated HTML can be printed to PDF or converted using a PDF library
 */
export class PDFExportService {
  /**
   * Export report to PDF-ready HTML format
   * 
   * @param report - Report data to export
   * @param reportType - Type of report
   * @returns HTML string ready for PDF conversion
   */
  static exportToPDF(
    report: ProfitLossReport | BalanceSheetReport | CashFlowReport,
    reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow'
  ): string {
    switch (reportType) {
      case 'profit-loss':
        return this.exportProfitLossToPDF(report as ProfitLossReport);
      case 'balance-sheet':
        return this.exportBalanceSheetToPDF(report as BalanceSheetReport);
      case 'cash-flow':
        return this.exportCashFlowToPDF(report as CashFlowReport);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Get CSS styles for PDF
   */
  private static getStyles(): string {
    return `
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }
        
        .logo {
          font-size: 24pt;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .report-title {
          font-size: 18pt;
          font-weight: bold;
          color: #1e293b;
          margin-top: 10px;
        }
        
        .report-period {
          font-size: 12pt;
          color: #64748b;
          margin-top: 5px;
        }
        
        .metadata {
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
          color: #64748b;
          margin-top: 10px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #1e293b;
          padding: 8px 12px;
          margin-bottom: 10px;
          border-left: 4px solid #2563eb;
          background: #f8fafc;
        }
        
        .section-title.revenue {
          border-left-color: #16a34a;
          background: #f0fdf4;
        }
        
        .section-title.expenses {
          border-left-color: #dc2626;
          background: #fef2f2;
        }
        
        .section-title.summary {
          border-left-color: #d97706;
          background: #fffbeb;
        }
        
        .section-title.assets {
          border-left-color: #2563eb;
          background: #eff6ff;
        }
        
        .section-title.liabilities {
          border-left-color: #dc2626;
          background: #fef2f2;
        }
        
        .section-title.equity {
          border-left-color: #7c3aed;
          background: #f5f3ff;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
        }
        
        td.amount {
          text-align: right;
          font-family: 'Consolas', monospace;
        }
        
        tr.total {
          font-weight: bold;
          background: #f8fafc;
        }
        
        tr.total td {
          border-top: 2px solid #cbd5e1;
          border-bottom: 2px solid #1e293b;
        }
        
        tr.subtotal {
          font-weight: 600;
        }
        
        tr.subtotal td {
          border-top: 1px solid #cbd5e1;
        }
        
        .profit {
          color: #16a34a;
        }
        
        .loss {
          color: #dc2626;
        }
        
        .highlight {
          background: #fef3c7;
        }
        
        .indent {
          padding-left: 30px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 9pt;
          color: #64748b;
          text-align: center;
        }
        
        .page-number {
          text-align: right;
          font-size: 9pt;
          color: #94a3b8;
        }
        
        .equation-box {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
          text-align: center;
        }
        
        .equation-box.balanced {
          background: #f0fdf4;
          border-color: #16a34a;
        }
        
        .equation-box.unbalanced {
          background: #fef2f2;
          border-color: #dc2626;
        }
        
        .comparison-table th {
          text-align: center;
        }
        
        .variance-positive {
          color: #16a34a;
        }
        
        .variance-negative {
          color: #dc2626;
        }
        
        @media print {
          .container {
            padding: 0;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    `;
  }

  /**
   * Export Profit & Loss report to PDF HTML
   */
  private static exportProfitLossToPDF(report: ProfitLossReport): string {
    const profitLossClass = report.netProfitLoss >= 0 ? 'profit' : 'loss';
    
    let comparisonSection = '';
    if (report.comparison) {
      comparisonSection = `
        <div class="section">
          <div class="section-title summary">COMPARISON</div>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Variance</th>
                <th>Variance %</th>
              </tr>
            </thead>
            <tbody>
              ${report.comparison.revenue ? `
              <tr>
                <td>Revenue</td>
                <td class="amount">${this.formatCurrency(report.comparison.revenue.current)}</td>
                <td class="amount">${this.formatCurrency(report.comparison.revenue.previous)}</td>
                <td class="amount ${report.comparison.revenue.variance >= 0 ? 'variance-positive' : 'variance-negative'}">${this.formatCurrency(report.comparison.revenue.variance)}</td>
                <td class="amount ${report.comparison.revenue.variancePercent >= 0 ? 'variance-positive' : 'variance-negative'}">${this.formatPercentage(report.comparison.revenue.variancePercent)}</td>
              </tr>
              ` : ''}
              ${report.comparison.expenses ? `
              <tr>
                <td>Expenses</td>
                <td class="amount">${this.formatCurrency(report.comparison.expenses.current)}</td>
                <td class="amount">${this.formatCurrency(report.comparison.expenses.previous)}</td>
                <td class="amount ${report.comparison.expenses.variance <= 0 ? 'variance-positive' : 'variance-negative'}">${this.formatCurrency(report.comparison.expenses.variance)}</td>
                <td class="amount ${report.comparison.expenses.variancePercent <= 0 ? 'variance-positive' : 'variance-negative'}">${this.formatPercentage(report.comparison.expenses.variancePercent)}</td>
              </tr>
              ` : ''}
              ${report.comparison.netProfitLoss ? `
              <tr class="total">
                <td>Net Profit/Loss</td>
                <td class="amount">${this.formatCurrency(report.comparison.netProfitLoss.current)}</td>
                <td class="amount">${this.formatCurrency(report.comparison.netProfitLoss.previous)}</td>
                <td class="amount ${report.comparison.netProfitLoss.variance >= 0 ? 'variance-positive' : 'variance-negative'}">${this.formatCurrency(report.comparison.netProfitLoss.variance)}</td>
                <td class="amount ${report.comparison.netProfitLoss.variancePercent >= 0 ? 'variance-positive' : 'variance-negative'}">${this.formatPercentage(report.comparison.netProfitLoss.variancePercent)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profit & Loss Report</title>
  ${this.getStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Hospital Management System</div>
      <div class="report-title">Profit & Loss Report</div>
      <div class="report-period">${this.formatDate(report.period.startDate)} to ${this.formatDate(report.period.endDate)}</div>
      <div class="metadata">
        <span>Generated: ${this.formatDateTime(report.generatedAt)}</span>
        <span>By: ${report.generatedBy || 'System'}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title revenue">REVENUE</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Consultations</td><td class="amount">${this.formatCurrency(report.revenue.consultations)}</td></tr>
          <tr><td>Procedures</td><td class="amount">${this.formatCurrency(report.revenue.procedures)}</td></tr>
          <tr><td>Medications</td><td class="amount">${this.formatCurrency(report.revenue.medications)}</td></tr>
          <tr><td>Lab Tests</td><td class="amount">${this.formatCurrency(report.revenue.labTests)}</td></tr>
          <tr><td>Other</td><td class="amount">${this.formatCurrency(report.revenue.other)}</td></tr>
          <tr class="total"><td>Total Revenue</td><td class="amount profit">${this.formatCurrency(report.revenue.total)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title expenses">EXPENSES</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Salaries</td><td class="amount">${this.formatCurrency(report.expenses.salaries)}</td></tr>
          <tr><td>Supplies</td><td class="amount">${this.formatCurrency(report.expenses.supplies)}</td></tr>
          <tr><td>Utilities</td><td class="amount">${this.formatCurrency(report.expenses.utilities)}</td></tr>
          <tr><td>Maintenance</td><td class="amount">${this.formatCurrency(report.expenses.maintenance)}</td></tr>
          <tr><td>Other</td><td class="amount">${this.formatCurrency(report.expenses.other)}</td></tr>
          <tr class="total"><td>Total Expenses</td><td class="amount loss">${this.formatCurrency(report.expenses.total)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title summary">NET PROFIT/LOSS</div>
      <table>
        <tbody>
          <tr><td>Total Revenue</td><td class="amount">${this.formatCurrency(report.revenue.total)}</td></tr>
          <tr><td>Total Expenses</td><td class="amount">${this.formatCurrency(report.expenses.total)}</td></tr>
          <tr class="total"><td>Net Profit/Loss</td><td class="amount ${profitLossClass}">${this.formatCurrency(report.netProfitLoss)}</td></tr>
        </tbody>
      </table>
    </div>

    ${comparisonSection}

    <div class="footer">
      <p>Hospital Management System - Financial Reports</p>
      <p>Generated on ${this.formatDateTime(report.generatedAt)} | Page 1</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Export Balance Sheet report to PDF HTML
   */
  private static exportBalanceSheetToPDF(report: BalanceSheetReport): string {
    const balancedClass = report.accountingEquationBalanced ? 'balanced' : 'unbalanced';
    const balancedText = report.accountingEquationBalanced ? '✓ Balanced' : '✗ Not Balanced';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Balance Sheet Report</title>
  ${this.getStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Hospital Management System</div>
      <div class="report-title">Balance Sheet Report</div>
      <div class="report-period">As of ${this.formatDate(report.asOfDate)}</div>
      <div class="metadata">
        <span>Generated: ${this.formatDateTime(report.generatedAt)}</span>
        <span>By: ${report.generatedBy || 'System'}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title assets">ASSETS</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="2"><strong>Current Assets</strong></td></tr>
          <tr><td class="indent">Cash</td><td class="amount">${this.formatCurrency(report.assets.current.cash)}</td></tr>
          <tr><td class="indent">Accounts Receivable</td><td class="amount">${this.formatCurrency(report.assets.current.accountsReceivable)}</td></tr>
          <tr><td class="indent">Inventory</td><td class="amount">${this.formatCurrency(report.assets.current.inventory)}</td></tr>
          <tr class="subtotal"><td>Total Current Assets</td><td class="amount">${this.formatCurrency(report.assets.current.total)}</td></tr>
          
          <tr><td colspan="2"><strong>Fixed Assets</strong></td></tr>
          <tr><td class="indent">Equipment</td><td class="amount">${this.formatCurrency(report.assets.fixed.equipment)}</td></tr>
          <tr><td class="indent">Buildings</td><td class="amount">${this.formatCurrency(report.assets.fixed.buildings)}</td></tr>
          <tr><td class="indent">Land</td><td class="amount">${this.formatCurrency(report.assets.fixed.land)}</td></tr>
          <tr><td class="indent">Vehicles</td><td class="amount">${this.formatCurrency(report.assets.fixed.vehicles)}</td></tr>
          <tr class="subtotal"><td>Total Fixed Assets</td><td class="amount">${this.formatCurrency(report.assets.fixed.total)}</td></tr>
          
          <tr class="total"><td>TOTAL ASSETS</td><td class="amount">${this.formatCurrency(report.assets.total)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title liabilities">LIABILITIES</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="2"><strong>Current Liabilities</strong></td></tr>
          <tr><td class="indent">Accounts Payable</td><td class="amount">${this.formatCurrency(report.liabilities.current.accountsPayable)}</td></tr>
          <tr><td class="indent">Accrued Expenses</td><td class="amount">${this.formatCurrency(report.liabilities.current.accruedExpenses)}</td></tr>
          <tr class="subtotal"><td>Total Current Liabilities</td><td class="amount">${this.formatCurrency(report.liabilities.current.total)}</td></tr>
          
          <tr><td colspan="2"><strong>Long-term Liabilities</strong></td></tr>
          <tr><td class="indent">Loans</td><td class="amount">${this.formatCurrency(report.liabilities.longTerm.loans)}</td></tr>
          <tr><td class="indent">Mortgages</td><td class="amount">${this.formatCurrency(report.liabilities.longTerm.mortgages)}</td></tr>
          <tr class="subtotal"><td>Total Long-term Liabilities</td><td class="amount">${this.formatCurrency(report.liabilities.longTerm.total)}</td></tr>
          
          <tr class="total"><td>TOTAL LIABILITIES</td><td class="amount">${this.formatCurrency(report.liabilities.total)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title equity">EQUITY</div>
      <table>
        <tbody>
          <tr><td>Retained Earnings</td><td class="amount">${this.formatCurrency(report.equity.retainedEarnings)}</td></tr>
          <tr class="total"><td>TOTAL EQUITY</td><td class="amount">${this.formatCurrency(report.equity.total)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">ACCOUNTING EQUATION</div>
      <div class="equation-box ${balancedClass}">
        <p style="font-size: 14pt; margin-bottom: 10px;">
          <strong>Assets = Liabilities + Equity</strong>
        </p>
        <p style="font-size: 12pt;">
          ${this.formatCurrency(report.assets.total)} = ${this.formatCurrency(report.liabilities.total)} + ${this.formatCurrency(report.equity.total)}
        </p>
        <p style="font-size: 14pt; margin-top: 10px; font-weight: bold; color: ${report.accountingEquationBalanced ? '#16a34a' : '#dc2626'};">
          ${balancedText}
        </p>
      </div>
    </div>

    <div class="footer">
      <p>Hospital Management System - Financial Reports</p>
      <p>Generated on ${this.formatDateTime(report.generatedAt)} | Page 1</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Export Cash Flow report to PDF HTML
   */
  private static exportCashFlowToPDF(report: CashFlowReport): string {
    const netCashFlowClass = report.netCashFlow >= 0 ? 'profit' : 'loss';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cash Flow Report</title>
  ${this.getStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Hospital Management System</div>
      <div class="report-title">Cash Flow Report</div>
      <div class="report-period">${this.formatDate(report.period.startDate)} to ${this.formatDate(report.period.endDate)}</div>
      <div class="metadata">
        <span>Generated: ${this.formatDateTime(report.generatedAt)}</span>
        <span>By: ${report.generatedBy || 'System'}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title assets">OPERATING ACTIVITIES</div>
      <table>
        <tbody>
          <tr><td>Cash Inflows</td><td class="amount profit">${this.formatCurrency(report.operatingActivities.inflows.total)}</td></tr>
          <tr><td>Cash Outflows</td><td class="amount loss">${this.formatCurrency(report.operatingActivities.outflows.total)}</td></tr>
          <tr class="total"><td>Net Operating Cash Flow</td><td class="amount ${report.operatingActivities.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(report.operatingActivities.net)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title summary">INVESTING ACTIVITIES</div>
      <table>
        <tbody>
          <tr><td>Cash Inflows</td><td class="amount profit">${this.formatCurrency(report.investingActivities.inflows.total)}</td></tr>
          <tr><td>Cash Outflows</td><td class="amount loss">${this.formatCurrency(report.investingActivities.outflows.total)}</td></tr>
          <tr class="total"><td>Net Investing Cash Flow</td><td class="amount ${report.investingActivities.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(report.investingActivities.net)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title equity">FINANCING ACTIVITIES</div>
      <table>
        <tbody>
          <tr><td>Cash Inflows</td><td class="amount profit">${this.formatCurrency(report.financingActivities.inflows.total)}</td></tr>
          <tr><td>Cash Outflows</td><td class="amount loss">${this.formatCurrency(report.financingActivities.outflows.total)}</td></tr>
          <tr class="total"><td>Net Financing Cash Flow</td><td class="amount ${report.financingActivities.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(report.financingActivities.net)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">CASH FLOW SUMMARY</div>
      <table>
        <tbody>
          <tr><td>Beginning Cash Balance</td><td class="amount">${this.formatCurrency(report.beginningCash)}</td></tr>
          <tr><td>Net Operating Cash Flow</td><td class="amount ${report.operatingActivities.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(report.operatingActivities.net)}</td></tr>
          <tr><td>Net Investing Cash Flow</td><td class="amount ${report.investingActivities.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(report.investingActivities.net)}</td></tr>
          <tr><td>Net Financing Cash Flow</td><td class="amount ${report.financingActivities.net >= 0 ? 'profit' : 'loss'}">${this.formatCurrency(report.financingActivities.net)}</td></tr>
          <tr class="subtotal"><td>Total Net Cash Flow</td><td class="amount ${netCashFlowClass}">${this.formatCurrency(report.netCashFlow)}</td></tr>
          <tr class="total"><td>Ending Cash Balance</td><td class="amount">${this.formatCurrency(report.endingCash)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Hospital Management System - Financial Reports</p>
      <p>Generated on ${this.formatDateTime(report.generatedAt)} | Page 1</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Format currency value
   */
  private static formatCurrency(value: number): string {
    if (value === null || value === undefined) {
      return '₹0.00';
    }
    const formatted = Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return value < 0 ? `(₹${formatted})` : `₹${formatted}`;
  }

  /**
   * Format percentage value
   */
  private static formatPercentage(value: number): string {
    if (value === null || value === undefined) {
      return '0.0%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  /**
   * Format date (readable format)
   */
  private static formatDate(dateString: string): string {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format date and time
   */
  private static formatDateTime(dateString: string): string {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get filename for export
   */
  static getFilename(reportType: string, startDate?: string, endDate?: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
    return `${reportType}_report${dateRange}_${timestamp}.pdf`;
  }

  /**
   * Get content type for PDF
   */
  static getContentType(): string {
    return 'application/pdf';
  }

  /**
   * Get content type for HTML (for browser rendering)
   */
  static getHTMLContentType(): string {
    return 'text/html';
  }
}
