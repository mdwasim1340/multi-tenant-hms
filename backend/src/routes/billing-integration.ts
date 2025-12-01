import express from 'express';
import { hospitalAuthMiddleware } from '../middleware/auth';
import { requireBillingWrite } from '../middleware/billing-auth';
import { billingIntegrationService } from '../services/billing-integration';

const router = express.Router();

// Generate invoice from appointment
router.post('/from-appointment/:appointmentId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { include_consultation_fee, additional_charges } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const invoice = await billingIntegrationService.generateInvoiceFromAppointment(
      tenantId,
      parseInt(appointmentId),
      { include_consultation_fee, additional_charges }
    );

    res.json({
      success: true,
      message: 'Invoice generated from appointment successfully',
      invoice
    });
  } catch (error: any) {
    console.error('Error generating invoice from appointment:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate invoice from appointment',
      code: 'APPOINTMENT_INVOICE_ERROR'
    });
  }
});

// Generate invoice from lab order
router.post('/from-lab-order/:labOrderId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { labOrderId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const invoice = await billingIntegrationService.generateInvoiceFromLabOrder(
      tenantId,
      parseInt(labOrderId)
    );

    res.json({
      success: true,
      message: 'Invoice generated from lab order successfully',
      invoice
    });
  } catch (error: any) {
    console.error('Error generating invoice from lab order:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate invoice from lab order',
      code: 'LAB_ORDER_INVOICE_ERROR'
    });
  }
});

// Generate invoice from prescription
router.post('/from-prescription/:prescriptionId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const invoice = await billingIntegrationService.generateInvoiceFromPrescription(
      tenantId,
      parseInt(prescriptionId)
    );

    res.json({
      success: true,
      message: 'Invoice generated from prescription successfully',
      invoice
    });
  } catch (error: any) {
    console.error('Error generating invoice from prescription:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate invoice from prescription',
      code: 'PRESCRIPTION_INVOICE_ERROR'
    });
  }
});

// Generate invoice from bed assignment
router.post('/from-bed-assignment/:assignmentId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { include_room_charges, discharge_date } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    const invoice = await billingIntegrationService.generateInvoiceFromBedAssignment(
      tenantId,
      parseInt(assignmentId),
      {
        include_room_charges,
        discharge_date: discharge_date ? new Date(discharge_date) : undefined
      }
    );

    res.json({
      success: true,
      message: 'Invoice generated from bed assignment successfully',
      invoice
    });
  } catch (error: any) {
    console.error('Error generating invoice from bed assignment:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate invoice from bed assignment',
      code: 'BED_ASSIGNMENT_INVOICE_ERROR'
    });
  }
});

// Calculate late fee for invoice
router.get('/late-fee/:invoiceId', hospitalAuthMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { fee_percentage = 2 } = req.query;

    const lateFee = await billingIntegrationService.calculateLateFee(
      parseInt(invoiceId),
      parseFloat(fee_percentage as string)
    );

    res.json({
      success: true,
      invoice_id: parseInt(invoiceId),
      late_fee: lateFee,
      fee_percentage: parseFloat(fee_percentage as string)
    });
  } catch (error: any) {
    console.error('Error calculating late fee:', error);
    res.status(500).json({
      error: error.message || 'Failed to calculate late fee',
      code: 'LATE_FEE_CALCULATION_ERROR'
    });
  }
});

// Apply late fee to invoice
router.post('/apply-late-fee/:invoiceId', hospitalAuthMiddleware, requireBillingWrite, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;
    const { fee_percentage = 2, created_by } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'X-Tenant-ID header is required',
        code: 'MISSING_TENANT_ID'
      });
    }

    if (!created_by) {
      return res.status(400).json({
        error: 'created_by is required',
        code: 'MISSING_CREATED_BY'
      });
    }

    const adjustment = await billingIntegrationService.applyLateFee(
      tenantId,
      parseInt(invoiceId),
      created_by,
      fee_percentage
    );

    res.json({
      success: true,
      message: 'Late fee applied successfully',
      adjustment
    });
  } catch (error: any) {
    console.error('Error applying late fee:', error);
    res.status(500).json({
      error: error.message || 'Failed to apply late fee',
      code: 'APPLY_LATE_FEE_ERROR'
    });
  }
});

export default router;
