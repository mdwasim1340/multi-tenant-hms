import pool from '../database';
import { billingService } from './billing';

/**
 * Billing Integration Service
 * Handles automatic invoice generation from various hospital services
 */
export class BillingIntegrationService {
  
  /**
   * Generate invoice from completed appointment
   */
  async generateInvoiceFromAppointment(
    tenantId: string,
    appointmentId: number,
    options?: {
      include_consultation_fee?: boolean;
      additional_charges?: { description: string; amount: number }[];
    }
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get appointment details
      const appointmentResult = await client.query(`
        SELECT 
          a.*,
          p.id as patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          p.patient_number
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1
      `, [appointmentId]);

      if (appointmentResult.rows.length === 0) {
        throw new Error('Appointment not found');
      }

      const appointment = appointmentResult.rows[0];

      // Check if invoice already exists for this appointment
      await client.query('SET search_path TO public');
      const existingInvoice = await client.query(
        'SELECT id FROM invoices WHERE appointment_id = $1 AND tenant_id = $2',
        [appointmentId, tenantId]
      );

      if (existingInvoice.rows.length > 0) {
        throw new Error('Invoice already exists for this appointment');
      }

      // Build line items
      const lineItems: any[] = [];

      // Add consultation fee
      if (options?.include_consultation_fee !== false) {
        const consultationFee = appointment.consultation_fee || 500; // Default fee
        lineItems.push({
          description: `Consultation - ${appointment.appointment_type || 'General'}`,
          amount: consultationFee,
          quantity: 1,
          unit_price: consultationFee
        });
      }

      // Add additional charges
      if (options?.additional_charges) {
        for (const charge of options.additional_charges) {
          lineItems.push({
            description: charge.description,
            amount: charge.amount,
            quantity: 1,
            unit_price: charge.amount
          });
        }
      }

      // Generate invoice
      const invoice = await billingService.generateDiagnosticInvoice(
        tenantId,
        appointment.patient_id,
        appointment.patient_name,
        appointment.patient_number,
        lineItems,
        {
          notes: `Invoice for appointment on ${new Date(appointment.appointment_date).toLocaleDateString()}`,
          referring_doctor: appointment.doctor_name,
          due_days: 7
        }
      );

      // Link invoice to appointment
      await client.query(
        'UPDATE invoices SET appointment_id = $1, department = $2, service_type = $3 WHERE id = $4',
        [appointmentId, appointment.department || 'OPD', 'consultation', invoice.id]
      );

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate invoice from lab order
   */
  async generateInvoiceFromLabOrder(
    tenantId: string,
    labOrderId: number
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get lab order with items
      const orderResult = await client.query(`
        SELECT 
          lo.*,
          p.id as patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          p.patient_number
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        WHERE lo.id = $1
      `, [labOrderId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Lab order not found');
      }

      const labOrder = orderResult.rows[0];

      // Get lab order items
      const itemsResult = await client.query(`
        SELECT 
          loi.*,
          lt.name as test_name,
          lt.price
        FROM lab_order_items loi
        JOIN lab_tests lt ON loi.test_id = lt.id
        WHERE loi.order_id = $1
      `, [labOrderId]);

      // Check if invoice already exists
      await client.query('SET search_path TO public');
      const existingInvoice = await client.query(
        'SELECT id FROM invoices WHERE lab_order_id = $1 AND tenant_id = $2',
        [labOrderId, tenantId]
      );

      if (existingInvoice.rows.length > 0) {
        throw new Error('Invoice already exists for this lab order');
      }

      // Build line items from lab tests
      const lineItems = itemsResult.rows.map(item => ({
        description: `Lab Test: ${item.test_name}`,
        amount: parseFloat(item.price) || 0,
        quantity: 1,
        unit_price: parseFloat(item.price) || 0
      }));

      if (lineItems.length === 0) {
        throw new Error('No lab tests found in order');
      }

      // Generate invoice
      const invoice = await billingService.generateDiagnosticInvoice(
        tenantId,
        labOrder.patient_id,
        labOrder.patient_name,
        labOrder.patient_number,
        lineItems,
        {
          notes: `Lab Order #${labOrderId}`,
          referring_doctor: labOrder.referring_doctor,
          due_days: 7
        }
      );

      // Link invoice to lab order
      await client.query(
        'UPDATE invoices SET lab_order_id = $1, department = $2, service_type = $3 WHERE id = $4',
        [labOrderId, 'Laboratory', 'lab', invoice.id]
      );

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate invoice from prescription (pharmacy)
   */
  async generateInvoiceFromPrescription(
    tenantId: string,
    prescriptionId: number
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get prescription details
      const prescriptionResult = await client.query(`
        SELECT 
          pr.*,
          p.id as patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          p.patient_number
        FROM prescriptions pr
        JOIN patients p ON pr.patient_id = p.id
        WHERE pr.id = $1
      `, [prescriptionId]);

      if (prescriptionResult.rows.length === 0) {
        throw new Error('Prescription not found');
      }

      const prescription = prescriptionResult.rows[0];

      // Check if invoice already exists
      await client.query('SET search_path TO public');
      const existingInvoice = await client.query(
        'SELECT id FROM invoices WHERE prescription_id = $1 AND tenant_id = $2',
        [prescriptionId, tenantId]
      );

      if (existingInvoice.rows.length > 0) {
        throw new Error('Invoice already exists for this prescription');
      }

      // Build line items from medications
      const medications = prescription.medications || [];
      const lineItems = medications.map((med: any) => ({
        description: `${med.name} - ${med.dosage || ''} x ${med.quantity || 1}`,
        amount: (parseFloat(med.price) || 0) * (parseInt(med.quantity) || 1),
        quantity: parseInt(med.quantity) || 1,
        unit_price: parseFloat(med.price) || 0
      }));

      if (lineItems.length === 0) {
        throw new Error('No medications found in prescription');
      }

      // Generate invoice
      const invoice = await billingService.generateDiagnosticInvoice(
        tenantId,
        prescription.patient_id,
        prescription.patient_name,
        prescription.patient_number,
        lineItems,
        {
          notes: `Prescription #${prescriptionId}`,
          referring_doctor: prescription.doctor_name,
          due_days: 0 // Pharmacy usually requires immediate payment
        }
      );

      // Link invoice to prescription
      await client.query(
        'UPDATE invoices SET prescription_id = $1, department = $2, service_type = $3 WHERE id = $4',
        [prescriptionId, 'Pharmacy', 'pharmacy', invoice.id]
      );

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate invoice from bed assignment
   */
  async generateInvoiceFromBedAssignment(
    tenantId: string,
    assignmentId: number,
    options?: {
      include_room_charges?: boolean;
      discharge_date?: Date;
    }
  ): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get bed assignment details
      const assignmentResult = await client.query(`
        SELECT 
          ba.*,
          b.bed_number,
          b.daily_rate,
          d.name as department_name,
          p.id as patient_id,
          p.first_name || ' ' || p.last_name as patient_name,
          p.patient_number
        FROM bed_assignments ba
        JOIN beds b ON ba.bed_id = b.id
        LEFT JOIN departments d ON b.department_id = d.id
        JOIN patients p ON ba.patient_id = p.id
        WHERE ba.id = $1
      `, [assignmentId]);

      if (assignmentResult.rows.length === 0) {
        throw new Error('Bed assignment not found');
      }

      const assignment = assignmentResult.rows[0];

      // Check if invoice already exists
      await client.query('SET search_path TO public');
      const existingInvoice = await client.query(
        'SELECT id FROM invoices WHERE bed_assignment_id = $1 AND tenant_id = $2',
        [assignmentId, tenantId]
      );

      if (existingInvoice.rows.length > 0) {
        throw new Error('Invoice already exists for this bed assignment');
      }

      // Calculate days
      const admissionDate = new Date(assignment.admission_date);
      const dischargeDate = options?.discharge_date || new Date();
      const days = Math.max(1, Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Build line items
      const lineItems: any[] = [];
      const dailyRate = parseFloat(assignment.daily_rate) || 1000;

      lineItems.push({
        description: `Bed Charges - ${assignment.bed_number} (${days} days)`,
        amount: dailyRate * days,
        quantity: days,
        unit_price: dailyRate
      });

      // Add room service charges if applicable
      if (options?.include_room_charges) {
        const roomServiceRate = dailyRate * 0.1; // 10% of daily rate
        lineItems.push({
          description: 'Room Service Charges',
          amount: roomServiceRate * days,
          quantity: days,
          unit_price: roomServiceRate
        });
      }

      // Generate invoice
      const invoice = await billingService.generateDiagnosticInvoice(
        tenantId,
        assignment.patient_id,
        assignment.patient_name,
        assignment.patient_number,
        lineItems,
        {
          notes: `Bed Assignment - ${assignment.bed_number}, Admission: ${admissionDate.toLocaleDateString()}`,
          due_days: 7
        }
      );

      // Link invoice to bed assignment
      await client.query(
        'UPDATE invoices SET bed_assignment_id = $1, department = $2, service_type = $3 WHERE id = $4',
        [assignmentId, assignment.department_name || 'IPD', 'bed', invoice.id]
      );

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate late fee for overdue invoice
   */
  async calculateLateFee(invoiceId: number, feePercentage: number = 2): Promise<number> {
    const invoice = await billingService.getInvoiceById(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'overdue') {
      return 0;
    }

    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      return 0;
    }

    // Calculate late fee (percentage of invoice amount per month overdue)
    const monthsOverdue = Math.ceil(daysOverdue / 30);
    const lateFee = (invoice.amount * feePercentage / 100) * monthsOverdue;

    return Math.round(lateFee * 100) / 100;
  }

  /**
   * Apply late fee to invoice
   */
  async applyLateFee(
    tenantId: string,
    invoiceId: number,
    createdBy: number,
    feePercentage: number = 2
  ): Promise<any> {
    const lateFee = await this.calculateLateFee(invoiceId, feePercentage);

    if (lateFee <= 0) {
      throw new Error('No late fee applicable');
    }

    // Create billing adjustment for late fee
    const result = await pool.query(`
      INSERT INTO billing_adjustments (
        tenant_id, invoice_id, adjustment_type, amount,
        reason, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      tenantId,
      invoiceId,
      'late_fee',
      lateFee,
      `Late payment fee (${feePercentage}% per month)`,
      'pending',
      createdBy
    ]);

    return result.rows[0];
  }
}

export const billingIntegrationService = new BillingIntegrationService();
