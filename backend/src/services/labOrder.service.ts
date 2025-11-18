/**
 * Lab Order Service
 * 
 * Business logic for managing laboratory test orders
 */

import pool from '../database';
import { 
  LabOrder, 
  LabOrderWithDetails,
  LabOrderItem,
  LabOrderItemWithTest,
  LabOrderFilters,
  LabOrdersResponse,
  LabOrderStatistics
} from '../types/labTest';

/**
 * Get all lab orders with optional filtering
 */
export async function getLabOrders(
  tenantId: string,
  filters: LabOrderFilters = {}
): Promise<LabOrdersResponse> {
  const {
    patient_id,
    medical_record_id,
    appointment_id,
    ordered_by,
    priority,
    status,
    order_date_from,
    order_date_to,
    search,
    page = 1,
    limit = 20,
    sort_by = 'order_date',
    sort_order = 'desc'
  } = filters;

  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause
  let whereConditions: string[] = ['1=1'];

  if (patient_id) {
    whereConditions.push(`lo.patient_id = $${paramIndex}`);
    params.push(patient_id);
    paramIndex++;
  }

  if (medical_record_id) {
    whereConditions.push(`lo.medical_record_id = $${paramIndex}`);
    params.push(medical_record_id);
    paramIndex++;
  }

  if (appointment_id) {
    whereConditions.push(`lo.appointment_id = $${paramIndex}`);
    params.push(appointment_id);
    paramIndex++;
  }

  if (ordered_by) {
    whereConditions.push(`lo.ordered_by = $${paramIndex}`);
    params.push(ordered_by);
    paramIndex++;
  }

  if (priority) {
    whereConditions.push(`lo.priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`lo.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (order_date_from) {
    whereConditions.push(`lo.order_date >= $${paramIndex}`);
    params.push(order_date_from);
    paramIndex++;
  }

  if (order_date_to) {
    whereConditions.push(`lo.order_date <= $${paramIndex}`);
    params.push(order_date_to);
    paramIndex++;
  }

  if (search) {
    whereConditions.push(`(
      lo.order_number ILIKE $${paramIndex} OR
      p.first_name ILIKE $${paramIndex} OR
      p.last_name ILIKE $${paramIndex} OR
      p.patient_number ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Set schema context
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Get orders with patient info
  const query = `
    SELECT 
      lo.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.patient_number,
      (SELECT COUNT(*) FROM lab_order_items WHERE order_id = lo.id) as items_count,
      (SELECT COUNT(*) FROM lab_order_items WHERE order_id = lo.id AND status = 'completed') as completed_items_count
    FROM lab_orders lo
    JOIN patients p ON lo.patient_id = p.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY lo.${sort_by} ${sort_order}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM lab_orders lo
    JOIN patients p ON lo.patient_id = p.id
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = await pool.query(countQuery, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].total);

  return {
    orders: result.rows as LabOrderWithDetails[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get lab order by ID with full details
 */
export async function getLabOrderById(
  tenantId: string,
  orderId: number
): Promise<LabOrderWithDetails | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  // Get order with patient info
  const orderResult = await pool.query(`
    SELECT 
      lo.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.patient_number
    FROM lab_orders lo
    JOIN patients p ON lo.patient_id = p.id
    WHERE lo.id = $1
  `, [orderId]);

  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];

  // Get order items with test details
  const itemsResult = await pool.query(`
    SELECT 
      loi.*,
      lt.test_code,
      lt.test_name,
      lt.unit as test_unit,
      lt.specimen_type,
      lt.turnaround_time
    FROM lab_order_items loi
    JOIN lab_tests lt ON loi.test_id = lt.id
    WHERE loi.order_id = $1
    ORDER BY lt.test_name ASC
  `, [orderId]);

  order.items = itemsResult.rows;
  order.items_count = itemsResult.rows.length;
  order.completed_items_count = itemsResult.rows.filter((item: any) => item.status === 'completed').length;

  return order as LabOrderWithDetails;
}

/**
 * Create new lab order
 */
export async function createLabOrder(
  tenantId: string,
  orderData: {
    patient_id: number;
    medical_record_id?: number;
    appointment_id?: number;
    ordered_by: number;
    priority?: string;
    clinical_notes?: string;
    special_instructions?: string;
    test_ids: number[];
  }
): Promise<LabOrderWithDetails> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(`
      INSERT INTO lab_orders (
        patient_id, medical_record_id, appointment_id,
        order_date, ordered_by, priority,
        clinical_notes, special_instructions, status
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [
      orderData.patient_id,
      orderData.medical_record_id || null,
      orderData.appointment_id || null,
      orderData.ordered_by,
      orderData.priority || 'routine',
      orderData.clinical_notes || null,
      orderData.special_instructions || null
    ]);

    const order = orderResult.rows[0];

    // Create order items
    for (const testId of orderData.test_ids) {
      // Get test price
      const testResult = await client.query(
        'SELECT price FROM lab_tests WHERE id = $1',
        [testId]
      );

      const price = testResult.rows[0]?.price || null;

      await client.query(`
        INSERT INTO lab_order_items (order_id, test_id, status, price)
        VALUES ($1, $2, 'pending', $3)
      `, [order.id, testId, price]);
    }

    // Calculate total price
    const totalResult = await client.query(
      'SELECT SUM(price) as total FROM lab_order_items WHERE order_id = $1',
      [order.id]
    );

    const totalPrice = totalResult.rows[0].total;

    await client.query(
      'UPDATE lab_orders SET total_price = $1 WHERE id = $2',
      [totalPrice, order.id]
    );

    await client.query('COMMIT');

    // Return full order details
    return await getLabOrderById(tenantId, order.id) as LabOrderWithDetails;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update lab order
 */
export async function updateLabOrder(
  tenantId: string,
  orderId: number,
  orderData: Partial<LabOrder>
): Promise<LabOrder | null> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = ['priority', 'clinical_notes', 'special_instructions'];

  for (const field of allowedFields) {
    if (field in orderData) {
      updates.push(`${field} = $${paramIndex}`);
      params.push((orderData as any)[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    const result = await pool.query('SELECT * FROM lab_orders WHERE id = $1', [orderId]);
    return result.rows[0] || null;
  }

  params.push(orderId);

  const result = await pool.query(`
    UPDATE lab_orders
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, params);

  return result.rows[0] || null;
}

/**
 * Cancel lab order
 */
export async function cancelLabOrder(
  tenantId: string,
  orderId: number,
  reason?: string
): Promise<boolean> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update order status
    await client.query(
      'UPDATE lab_orders SET status = $1 WHERE id = $2',
      ['cancelled', orderId]
    );

    // Cancel all order items
    await client.query(`
      UPDATE lab_order_items
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $1
      WHERE order_id = $2 AND status NOT IN ('completed', 'cancelled')
    `, [reason || 'Order cancelled', orderId]);

    await client.query('COMMIT');
    return true;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mark specimen collected
 */
export async function collectSpecimen(
  tenantId: string,
  orderId: number,
  collectedBy: number
): Promise<boolean> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update order
    await client.query(`
      UPDATE lab_orders
      SET collection_date = CURRENT_TIMESTAMP, collected_by = $1
      WHERE id = $2
    `, [collectedBy, orderId]);

    // Update all pending items
    await client.query(`
      UPDATE lab_order_items
      SET status = 'collected', specimen_collected_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND status = 'pending'
    `, [orderId]);

    await client.query('COMMIT');
    return true;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Start processing order
 */
export async function startProcessing(
  tenantId: string,
  orderId: number
): Promise<boolean> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  await pool.query(`
    UPDATE lab_order_items
    SET status = 'processing', processing_started_at = CURRENT_TIMESTAMP
    WHERE order_id = $1 AND status = 'collected'
  `, [orderId]);

  return true;
}

/**
 * Get orders by patient
 */
export async function getOrdersByPatient(
  tenantId: string,
  patientId: number
): Promise<LabOrderWithDetails[]> {
  const result = await getLabOrders(tenantId, {
    patient_id: patientId,
    limit: 100
  });

  return result.orders;
}

/**
 * Get order statistics
 */
export async function getLabOrderStatistics(
  tenantId: string
): Promise<LabOrderStatistics> {
  await pool.query(`SET search_path TO "${tenantId}"`);

  const result = await pool.query(`
    SELECT
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_orders,
      COUNT(CASE WHEN priority = 'stat' THEN 1 END) as stat_orders,
      AVG(EXTRACT(EPOCH FROM (updated_at - order_date))/3600) as avg_turnaround_time
    FROM lab_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  `);

  return {
    total_orders: parseInt(result.rows[0].total_orders),
    pending_orders: parseInt(result.rows[0].pending_orders),
    completed_orders: parseInt(result.rows[0].completed_orders),
    urgent_orders: parseInt(result.rows[0].urgent_orders),
    stat_orders: parseInt(result.rows[0].stat_orders),
    avg_turnaround_time: parseFloat(result.rows[0].avg_turnaround_time) || null
  };
}
