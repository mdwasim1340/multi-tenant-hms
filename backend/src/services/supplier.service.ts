import { Pool, PoolClient } from 'pg';
import { Supplier, CreateSupplierData } from '../types/inventory';
import { createSupplierSchema, updateSupplierSchema } from '../validation/inventory.validation';
import { InventoryValidationError } from './inventory-item.service';

export class SupplierNotFoundError extends Error {
  constructor(supplierId: number) {
    super(`Supplier with ID ${supplierId} not found`);
    this.name = 'SupplierNotFoundError';
  }
}

/**
 * SupplierService - Manages supplier CRUD and relationships
 * Team Beta - Inventory Management System
 */
export class SupplierService {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getSuppliers(
    tenantId: string,
    params?: { status?: 'active'|'inactive'|'blocked', search?: string; }
  ): Promise<Supplier[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      let where = [];
      let values = [];
      let i = 1;
      if (params?.status) { where.push(`status = $${i}`); values.push(params.status); i++; }
      if (params?.search) { where.push(`(name ILIKE $${i} OR code ILIKE $${i} OR email ILIKE $${i})`); values.push(`%${params.search}%`); i++; }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const query = `SELECT * FROM suppliers ${whereClause} ORDER BY name ASC`;
      const res = await client.query(query, values);
      return res.rows;
    } finally { client.release(); }
  }

  async getSupplierById(
    supplierId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<Supplier> {
    const dbClient = client || (await this.pool.connect());
    try {
      if (!client) await dbClient.query(`SET search_path TO "${tenantId}"`);
      const res = await dbClient.query(`SELECT * FROM suppliers WHERE id = $1`, [supplierId]);
      if (res.rows.length === 0) throw new SupplierNotFoundError(supplierId);
      return res.rows[0];
    } finally { if (!client) dbClient.release(); }
  }

  async createSupplier(
    data: CreateSupplierData,
    tenantId: string,
    userId: number
  ): Promise<Supplier> {
    const validated = createSupplierSchema.parse(data);
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      // Code uniqueness
      if (validated.code) {
        const dup = await client.query('SELECT id FROM suppliers WHERE code = $1', [validated.code]);
        if (dup.rows.length) throw new InventoryValidationError(`Supplier code '${validated.code}' already exists`);
      }
      // Prepare data
      const supData = { ...validated, status: validated.status || 'active', created_by: userId, updated_by: userId, created_at: new Date(), updated_at: new Date() };
      const cols = Object.keys(supData);
      const vals = Object.values(supData);
      const ph = vals.map((_, i) => `$${i+1}`).join(', ');
      const insert = `INSERT INTO suppliers(${cols.join(',')}) VALUES (${ph}) RETURNING *`;
      const res = await client.query(insert, vals);
      return await this.getSupplierById(res.rows[0].id, tenantId, client);
    } finally { client.release(); }
  }

  async updateSupplier(
    supplierId: number,
    data: Partial<CreateSupplierData>,
    tenantId: string,
    userId: number
  ): Promise<Supplier> {
    const validated = updateSupplierSchema.parse(data);
    const upd = Object.fromEntries(Object.entries(validated).filter(([_, v])=>v!==undefined));
    if (!Object.keys(upd).length) throw new InventoryValidationError('No valid fields for update');
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      await this.getSupplierById(supplierId, tenantId, client);
      if (upd.code) {
        const dup = await client.query('SELECT id FROM suppliers WHERE code = $1 AND id <> $2', [upd.code, supplierId]);
        if (dup.rows.length) throw new InventoryValidationError(`Supplier code '${upd.code}' already exists`);
      }
      const finalUpd = { ...upd, updated_by: userId, updated_at: new Date() };
      const entries = Object.entries(finalUpd);
      const set = entries.map(([k],i)=>`${k} = $${i+2}`).join(', ');
      const vals = entries.map(([_,v])=>v);
      await client.query(`UPDATE suppliers SET ${set} WHERE id = $1`, [supplierId,...vals]);
      return await this.getSupplierById(supplierId, tenantId, client);
    } finally { client.release(); }
  }

  async deleteSupplier(
    supplierId: number,
    tenantId: string,
    userId: number
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      await this.getSupplierById(supplierId, tenantId, client);
      // Soft delete (status = 'inactive')
      await client.query(`UPDATE suppliers SET status = 'inactive', updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [supplierId, userId]);
    } finally { client.release(); }
  }

  async getSupplierItems(
    supplierId: number,
    tenantId: string
  ): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const q = `SELECT * FROM inventory_items WHERE supplier_id = $1 AND status='active' ORDER BY name ASC`;
      const res = await client.query(q, [supplierId]);
      return res.rows;
    } finally { client.release(); }
  }

  async getSupplierStats(
    supplierId: number,
    tenantId: string
  ): Promise<{ item_count: number; avg_lead_time: number; }> {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${tenantId}"`);
      const q = `SELECT COUNT(*) AS item_count, AVG(lead_time_days) AS avg_lead_time FROM suppliers WHERE id = $1`;
      const res = await client.query(q, [supplierId]);
      return { item_count: parseInt(res.rows[0].item_count), avg_lead_time: parseFloat(res.rows[0].avg_lead_time)||0 };
    } finally { client.release(); }
  }
}
