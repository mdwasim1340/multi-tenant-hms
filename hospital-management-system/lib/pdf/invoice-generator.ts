import { Invoice, LineItem } from "@/types/billing"

/**
 * Generate a PDF invoice using HTML and print-to-PDF
 * This is a client-side solution that works without external dependencies
 */
export function generateInvoicePDF(invoice: Invoice) {
  const html = generateInvoiceHTML(invoice)
  
  // Create a new window for printing
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) {
    throw new Error('Failed to open print window')
  }
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
    // Close after printing (user can cancel)
    setTimeout(() => {
      printWindow.close()
    }, 1000)
  }
}

/**
 * Generate HTML for invoice that can be printed to PDF
 */
function generateInvoiceHTML(invoice: Invoice): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD'
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const lineItemsHTML = invoice.line_items
    ?.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
          ${item.description}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${formatCurrency(item.unit_price || 0)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          ${formatCurrency(item.amount)}
        </td>
      </tr>
    `)
    .join('')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: white;
          padding: 40px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        
        .company-info h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .company-info p {
          font-size: 14px;
          color: #6b7280;
        }
        
        .invoice-info {
          text-align: right;
        }
        
        .invoice-info h2 {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 10px;
        }
        
        .invoice-info p {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        
        .invoice-number {
          font-weight: 600;
          color: #1f2937;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }
        
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .status-paid {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .status-overdue {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .detail-section h3 {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        
        .detail-section p {
          font-size: 14px;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .line-items {
          margin-bottom: 40px;
        }
        
        .line-items h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background-color: #f3f4f6;
        }
        
        thead th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
        }
        
        tbody td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .summary {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        
        .summary-box {
          width: 300px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .summary-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          border-bottom: 2px solid #3b82f6;
          padding: 15px 0;
          margin-top: 10px;
        }
        
        .notes {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 4px;
          margin-bottom: 40px;
        }
        
        .notes h3 {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        
        .notes p {
          font-size: 14px;
          color: #1f2937;
          white-space: pre-wrap;
        }
        
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .container {
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <h1>INVOICE</h1>
            <p>Professional Billing System</p>
          </div>
          <div class="invoice-info">
            <h2>${invoice.invoice_number}</h2>
            <p><span class="invoice-number">Status:</span></p>
            <span class="status-badge status-${invoice.status.toLowerCase()}">
              ${invoice.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <!-- Details -->
        <div class="details">
          <div class="detail-section">
            <h3>Bill To</h3>
            <p>${invoice.tenant_name || 'N/A'}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">
              Invoice Date: ${formatDate(invoice.created_at)}<br>
              Due Date: ${formatDate(invoice.due_date)}
            </p>
          </div>
          <div class="detail-section">
            <h3>Invoice Details</h3>
            <p><strong>Period:</strong> ${formatDate(invoice.billing_period_start)} - ${formatDate(invoice.billing_period_end)}</p>
            <p><strong>Currency:</strong> ${invoice.currency}</p>
            ${invoice.paid_at ? `<p><strong>Paid:</strong> ${formatDate(invoice.paid_at)}</p>` : ''}
          </div>
        </div>
        
        <!-- Line Items -->
        <div class="line-items">
          <h3>Line Items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHTML}
            </tbody>
          </table>
        </div>
        
        <!-- Summary -->
        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.amount)}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>${formatCurrency(invoice.amount)}</span>
            </div>
          </div>
        </div>
        
        <!-- Notes -->
        ${invoice.notes ? `
          <div class="notes">
            <h3>Notes</h3>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
          <p>This is an automatically generated invoice. Please retain for your records.</p>
          <p style="margin-top: 10px;">Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Download invoice as PDF using browser's print-to-PDF feature
 * This is the most reliable cross-browser solution
 */
export function downloadInvoicePDF(invoice: Invoice) {
  try {
    generateInvoicePDF(invoice)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate invoice PDF')
  }
}

/**
 * Alternative: Generate a data URL for the invoice HTML
 * Useful for preview or email
 */
export function getInvoiceHTMLDataURL(invoice: Invoice): string {
  const html = generateInvoiceHTML(invoice)
  const blob = new Blob([html], { type: 'text/html' })
  return URL.createObjectURL(blob)
}
