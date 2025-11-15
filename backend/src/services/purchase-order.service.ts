import { Pool, PoolClient } from 'pg';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrderData,
} from '../types/inventory';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  receivePurchaseOrderItemSchema,
} from '../validation/inventory.validation';
import { InventoryValidationError } from './inventory-item.service';

export class PurchaseOrderNotFoundError extends Error {
  constructor(poId: number) {
    super(`Purchase Order with ID ${poId} not found`);
    this.name = 'PurchaseOrderNotFoundError';
  }
}

export class PurchaseOrderService {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new purchase order with items (atomic)
   */
  async createPurchaseOrder(
    data: CreatePurchaseOrderData,
    tenantId: string,
    userId: number
  ): Promise<PurchaseOrder> {
    const validatedData = createPurchaseOrderSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);
      // Compose order number
      const res = await client.query('SELECT nextval(\'purchase_order_seq\') AS seq');
      const seq = res.rows[0].seq;
      const orderNumber = `PO-${new Date().getFullYear()}-${seq}`;
      // Aggregate totals
      const subtotal = validatedData.items.reduce((s, it) => s + it.unit_cost * it.quantity, 0);
      const total = subtotal + (validatedData.tax_amount||0) + (validatedData.shipping_cost||0);
      // Insert PO
      const poRes = await client.query(
        `INSERT INTO purchase_orders (order_number,supplier_id,order_date,expected_delivery_date,status,subtotal,tax_amount,shipping_cost,total_amount,payment_status,notes,created_at,updated_at,created_by,updated_by) VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,'unpaid',$9,NOW(),NOW(),$10,$10) RETURNING *`,
        [orderNumber, validatedData.supplier_id, validatedData.order_date||new Date().toISOString(), validatedData.expected_delivery_date, subtotal, validatedData.tax_amount||0, validatedData.shipping_cost||0, total, validatedData.notes||null, userId]
      );
      const po = poRes.rows[0];
      // Insert items
      for (const item of validatedData.items) {
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id,item_id,quantity,unit_cost,total_cost,received_quantity,status,created_at) VALUES ($1,$2,$3,$4,$5,0,'pending',NOW())`,
          [po.id, item.item_id, item.quantity, item.unit_cost, item.unit_cost * item.quantity]
        );
      }
      await client.query('COMMIT');
      return await this.getPurchaseOrderById(po.id, tenantId, client);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  /**
   * Get purchase order by ID, including items and supplier
   */
  async getPurchaseOrderById(
    poId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<PurchaseOrder> {
    const dbClient = client || (await this.pool.connect());
    try {
      if (!client) await dbClient.query(`SET search_path TO "${tenantId}"`);
      const poRes = await dbClient.query('SELECT * FROM purchase_orders WHERE id = $1', [poId]);
      if (poRes.rows.length === 0) throw new PurchaseOrderNotFoundError(poId);
      const po = poRes.rows[0];
      // Get supplier
      const suppRes = await dbClient.query('SELECT * FROM suppliers WHERE id = $1', [po.supplier_id]);
      if (suppRes.rows.length) po.supplier = suppRes.rows[0];
      // Get items
      const itemsRes = await dbClient.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [poId]);
      po.items = itemsRes.rows;
      return po;
    } finally { if (!client) dbClient.release(); }
  }
  
  /**
   * Update purchase order fields
   */
  async updatePurchaseOrder(
    poId: number,
    data: Partial<any>,
    tenantId: string,
    userId: number
  ): Promise<PurchaseOrder> {
    const validatedData = updatePurchaseOrderSchema.parse(data);
    const updateData = Object.fromEntries(Object.entries(validatedData).filter(([_, v])=>v!==undefined));
    if (!Object.keys(updateData).length) throw new InventoryValidationError('No valid fields provided for update');
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      await this.getPurchaseOrderById(poId, tenantId, client);
      const finalUpdate = { ...updateData, updated_by: userId, updated_at: new Date() };
      const entries = Object.entries(finalUpdate);
      const setClause = entries.map(([k],i)=>`${k} = $${i+2}`).join(', ');
      const values = entries.map(([_,v])=>v);
      await client.query(`UPDATE purchase_orders SET ${setClause} WHERE id = $1`, [poId, ...values]);
      return await this.getPurchaseOrderById(poId, tenantId, client);
    } finally { client.release(); }
  }

  /**
   * Approve an order (status transition + audit)
   */
  async approvePurchaseOrder(
    poId: number,
    tenantId: string,
    userId: number
  ): Promise<PurchaseOrder> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      await this.getPurchaseOrderById(poId, tenantId, client);
      await client.query(`UPDATE purchase_orders SET status='approved', approved_by=$2, approved_at=NOW(), updated_by=$2, updated_at=NOW() WHERE id = $1`, [poId, userId]);
      return await this.getPurchaseOrderById(poId, tenantId, client);
    } finally { client.release(); }
  }

  /**
   * Receive an item in purchase order (partial/complete)
   */
  async receivePurchaseOrderItem(
    poId: number,
    itemId: number,
    data: { quantity: number; notes?: string },
    tenantId: string,
    userId: number
  ): Promise<{ updatedItem: PurchaseOrderItem; completed: boolean; }> {
    receivePurchaseOrderItemSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);
      // Get PO item
      const itemRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 AND item_id = $2', [poId, itemId]);
      if (itemRes.rows.length === 0) throw new Error('Purchase order item not found');
      const item = itemRes.rows[0];
      // Receive
      const receivedQty = item.received_quantity + data.quantity;
      const newStatus = receivedQty >= item.quantity ? 'received' : 'partial';
      await client.query('UPDATE purchase_order_items SET received_quantity=$1, status=$2 WHERE id=$3', [receivedQty, newStatus, item.id]);
      // Update inventory stock!
      await client.query('UPDATE inventory_items SET current_stock = current_stock + $1, updated_at = NOW(), updated_by = $2 WHERE id = $3', [data.quantity, userId, itemId]);
      await client.query('COMMIT');
      // Return updated item
      const updatedRes = await client.query('SELECT * FROM purchase_order_items WHERE id = $1', [item.id]);
      return { updatedItem: updatedRes.rows[0], completed: newStatus === 'received' };
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  /**
   * Cancel a PO
   */
  async cancelPurchaseOrder(
    poId: number,
    tenantId: string,
    userId: number
  ) { const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      await this.getPurchaseOrderById(poId, tenantId, client);
      await client.query('UPDATE purchase_orders SET status = $2, updated_by = $3, updated_at = NOW() WHERE id = $1', [poId, 'cancelled', userId]);
    } finally { client.release(); }
  }

  /**
   * List purchase orders with pagination/filtering
   */
  async getPurchaseOrders(
    tenantId: string,
    params: { supplier_id?: number; status?: string; payment_status?: string; from_date?: string; to_date?: string; search?: string; page?: number; limit?: number; } = {}
  ): Promise<{ orders: PurchaseOrder[]; total: number; page: number; limit: number; pages: number }>{
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page-1) * limit;
      let where = [];
      let vals = [];
      let i = 1;
      if (params.supplier_id) { where.push(`supplier_id = $${i}`); vals.push(params.supplier_id); i++; }
      if (params.status) { where.push(`status = $${i}`); vals.push(params.status); i++; }
      if (params.payment_status) { where.push(`payment_status = $${i}`); vals.push(params.payment_status); i++; }
      if (params.from_date) { where.push(`order_date >= $${i}`); vals.push(params.from_date); i++; }
      if (params.to_date) { where.push(`order_date <= $${i}`); vals.push(params.to_date); i++; }
      if (params.search) { where.push(`(order_number ILIKE $${i})`); vals.push(`%${params.search}%`); i++; }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const countRes = await client.query(`SELECT COUNT(*) as total FROM purchase_orders ${whereClause}`, vals);
      const total = parseInt(countRes.rows[0].total);
      const poRes = await client.query(
        `SELECT * FROM purchase_orders ${whereClause} ORDER BY order_date DESC, id DESC LIMIT $${i} OFFSET $${i+1}`,
        [...vals, limit, offset]
      );
      const orders = poRes.rows;
      for (const po of orders) {
        const itemsRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [po.id]);
        po.items = itemsRes.rows;
      }
      return { orders, total, page, limit, pages: Math.ceil(total/limit) };
    } finally { client.release(); }
  }
}