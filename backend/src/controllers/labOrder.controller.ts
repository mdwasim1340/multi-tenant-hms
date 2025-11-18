/**
 * Lab Order Controller
 * 
 * HTTP request handlers for laboratory order management
 */

import { Request, Response } from 'express';
import * as labOrderService from '../services/labOrder.service';
import { CreateLabOrderSchema, UpdateLabOrderSchema } from '../types/labTest';

/**
 * GET /api/lab-orders
 * Get all lab orders with optional filtering
 */
export async function getLabOrders(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const filters = {
      patient_id: req.query.patient_id ? parseInt(req.query.patient_id as string) : undefined,
      medical_record_id: req.query.medical_record_id ? parseInt(req.query.medical_record_id as string) : undefined,
      appointment_id: req.query.appointment_id ? parseInt(req.query.appointment_id as string) : undefined,
      ordered_by: req.query.ordered_by ? parseInt(req.query.ordered_by as string) : undefined,
      priority: req.query.priority as 'routine' | 'urgent' | 'stat',
      status: req.query.status as 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled',
      order_date_from: req.query.order_date_from as string,
      order_date_to: req.query.order_date_to as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      sort_by: req.query.sort_by as string || 'order_date',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const result = await labOrderService.getLabOrders(tenantId, filters);

    res.json(result);
  } catch (error) {
    console.error('Error getting lab orders:', error);
    res.status(500).json({ error: 'Failed to get lab orders' });
  }
}

/**
 * GET /api/lab-orders/:id
 * Get lab order by ID with full details
 */
export async function getLabOrderById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const orderId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = await labOrderService.getLabOrderById(tenantId, orderId);

    if (!order) {
      res.status(404).json({ error: 'Lab order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Error getting lab order:', error);
    res.status(500).json({ error: 'Failed to get lab order' });
  }
}

/**
 * POST /api/lab-orders
 * Create new lab order
 */
export async function createLabOrder(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    // Validate request body
    const validationResult = CreateLabOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    const order = await labOrderService.createLabOrder(tenantId, validationResult.data as any);

    res.status(201).json({
      message: 'Lab order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({ error: 'Failed to create lab order' });
  }
}

/**
 * PUT /api/lab-orders/:id
 * Update lab order
 */
export async function updateLabOrder(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const orderId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    // Validate request body
    const validationResult = UpdateLabOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      });
      return;
    }

    const order = await labOrderService.updateLabOrder(tenantId, orderId, validationResult.data);

    if (!order) {
      res.status(404).json({ error: 'Lab order not found' });
      return;
    }

    res.json({
      message: 'Lab order updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating lab order:', error);
    res.status(500).json({ error: 'Failed to update lab order' });
  }
}

/**
 * DELETE /api/lab-orders/:id
 * Cancel lab order
 */
export async function cancelLabOrder(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const orderId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const reason = req.body.reason as string;

    const success = await labOrderService.cancelLabOrder(tenantId, orderId, reason);

    if (!success) {
      res.status(404).json({ error: 'Lab order not found' });
      return;
    }

    res.json({ message: 'Lab order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling lab order:', error);
    res.status(500).json({ error: 'Failed to cancel lab order' });
  }
}

/**
 * POST /api/lab-orders/:id/collect
 * Mark specimen collected
 */
export async function collectSpecimen(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const orderId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const collectedBy = req.body.collected_by as number;

    if (!collectedBy) {
      res.status(400).json({ error: 'collected_by is required' });
      return;
    }

    const success = await labOrderService.collectSpecimen(tenantId, orderId, collectedBy);

    if (!success) {
      res.status(404).json({ error: 'Lab order not found' });
      return;
    }

    res.json({ message: 'Specimen collected successfully' });
  } catch (error) {
    console.error('Error collecting specimen:', error);
    res.status(500).json({ error: 'Failed to collect specimen' });
  }
}

/**
 * POST /api/lab-orders/:id/process
 * Start processing order
 */
export async function startProcessing(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const orderId = parseInt(req.params.id);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const success = await labOrderService.startProcessing(tenantId, orderId);

    if (!success) {
      res.status(404).json({ error: 'Lab order not found' });
      return;
    }

    res.json({ message: 'Order processing started successfully' });
  } catch (error) {
    console.error('Error starting processing:', error);
    res.status(500).json({ error: 'Failed to start processing' });
  }
}

/**
 * GET /api/lab-orders/patient/:patientId
 * Get orders by patient
 */
export async function getOrdersByPatient(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const patientId = parseInt(req.params.patientId);

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    if (isNaN(patientId)) {
      res.status(400).json({ error: 'Invalid patient ID' });
      return;
    }

    const orders = await labOrderService.getOrdersByPatient(tenantId, patientId);

    res.json({ orders });
  } catch (error) {
    console.error('Error getting orders by patient:', error);
    res.status(500).json({ error: 'Failed to get orders by patient' });
  }
}

/**
 * GET /api/lab-orders/statistics
 * Get order statistics
 */
export async function getLabOrderStatistics(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ error: 'X-Tenant-ID header is required' });
      return;
    }

    const statistics = await labOrderService.getLabOrderStatistics(tenantId);

    res.json(statistics);
  } catch (error) {
    console.error('Error getting lab order statistics:', error);
    res.status(500).json({ error: 'Failed to get lab order statistics' });
  }
}
