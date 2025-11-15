import { Pool, PoolClient } from 'pg';
import {
  InventoryTransaction,
  InventoryItem,
  AdjustStockData,
} from '../types/inventory';
import { adjustStockSchema } from '../validation/inventory.validation';
import {
  InventoryItemNotFoundError,
  InventoryValidationError,
  InsufficientStockError,
} from './inventory-item.service';

/**
 * InventoryTransactionService - Manages inventory stock transactions
 * Tracks all stock movements with full audit trail
 * Team: Beta, System: Inventory Management
 */
export class InventoryTransactionService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new inventory transaction
   * Updates item stock level atomically
   * @throws InventoryItemNotFoundError if item doesn't exist
   * @throws InsufficientStockError if removing more stock than available
   */
  async createTransaction(
    data: {
      item_id: number;
      transaction_type:
        | 'addition'
        | 'removal'
        | 'adjustment'
        | 'transfer'
        | 'expiry'
        | 'damage'
        | 'return';
      quantity: number;
      unit_cost?: number;
      reference_type?: string;
      reference_id?: number;
      from_location?: string;
      to_location?: string;
      reason?: string;
      notes?: string;
    },
    tenantId: string,
    userId: number
  ): Promise<InventoryTransaction> {
    if (data.quantity === 0) {
      throw new InventoryValidationError('Transaction quantity cannot be zero');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO "${tenantId}"`);

      // Verify item exists
      const itemCheck = await client.query(
        'SELECT id, current_stock, sku, name, unit_cost FROM inventory_items WHERE id = $1',
        [data.item_id]
      );

      if (itemCheck.rows.length === 0) {
        throw new InventoryItemNotFoundError(data.item_id);
      }

      const item = itemCheck.rows[0];
      const currentStock = item.current_stock;

      // Calculate stock change
      let stockChange = 0;
      switch (data.transaction_type) {
        case 'addition':
        case 'return':
          stockChange = Math.abs(data.quantity);
          break;
        case 'removal':
        case 'expiry':
        case 'damage':
          stockChange = -Math.abs(data.quantity);
          break;
        case 'adjustment':
          stockChange = data.quantity; // Can be positive or negative
          break;
        case 'transfer':
          // Transfer is handled differently - this is just logging
          stockChange = 0;
          break;
      }

      // Check for sufficient stock on removals
      const newStock = currentStock + stockChange;
      if (newStock < 0) {
        throw new InsufficientStockError(
          data.item_id,
          Math.abs(stockChange),
          currentStock
        );
      }

      // Calculate total cost
      const unitCost = data.unit_cost || item.unit_cost || 0;
      const totalCost = Math.abs(data.quantity) * unitCost;

      // Create transaction record
      const transactionData = {
        item_id: data.item_id,
        transaction_type: data.transaction_type,
        quantity: data.quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
        reference_type: data.reference_type || null,
        reference_id: data.reference_id || null,
        from_location: data.from_location || null,
        to_location: data.to_location || null,
        reason: data.reason || null,
        notes: data.notes || null,
        transaction_date: new Date(),
        created_by: userId,
        created_at: new Date(),
      };

      const columns = Object.keys(transactionData);
      const values = Object.values(transactionData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO inventory_transactions (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const transactionResult = await client.query(insertQuery, values);
      const transaction = transactionResult.rows[0];

      // Update item stock level
      if (stockChange !== 0) {
        const updateStockQuery = `
          UPDATE inventory_items
          SET current_stock = current_stock + $1,
              last_restocked_date = CASE WHEN $1 > 0 THEN CURRENT_TIMESTAMP ELSE last_restocked_date END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;

        await client.query(updateStockQuery, [stockChange, data.item_id]);
      }

      await client.query('COMMIT');

      // Fetch complete transaction with item details
      return await this.getTransactionById(transaction.id, tenantId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get transaction by ID with item details
   */
  async getTransactionById(
    transactionId: number,
    tenantId: string
  ): Promise<InventoryTransaction> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const query = `
        SELECT 
          t.*,
          i.name as item_name,
          i.sku as item_sku,
          i.unit_of_measure
        FROM inventory_transactions t
        LEFT JOIN inventory_items i ON i.id = t.item_id
        WHERE t.id = $1
      `;

      const result = await client.query(query, [transactionId]);

      if (result.rows.length === 0) {
        throw new Error(`Transaction with ID ${transactionId} not found`);
      }

      const transaction = result.rows[0];

      // Add item object if joined
      if (transaction.item_name) {
        transaction.item = {
          id: transaction.item_id,
          name: transaction.item_name,
          sku: transaction.item_sku,
          unit_of_measure: transaction.unit_of_measure,
        };
      }

      return transaction;
    } finally {
      client.release();
    }
  }

  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(
    tenantId: string,
    params: {
      item_id?: number;
      transaction_type?: string;
      from_date?: string;
      to_date?: string;
      reference_type?: string;
      reference_id?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    transactions: InventoryTransaction[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (params.item_id) {
        whereConditions.push(`t.item_id = $${paramIndex}`);
        queryParams.push(params.item_id);
        paramIndex++;
      }

      if (params.transaction_type) {
        whereConditions.push(`t.transaction_type = $${paramIndex}`);
        queryParams.push(params.transaction_type);
        paramIndex++;
      }

      if (params.reference_type) {
        whereConditions.push(`t.reference_type = $${paramIndex}`);
        queryParams.push(params.reference_type);
        paramIndex++;
      }

      if (params.reference_id) {
        whereConditions.push(`t.reference_id = $${paramIndex}`);
        queryParams.push(params.reference_id);
        paramIndex++;
      }

      if (params.from_date) {
        whereConditions.push(`t.transaction_date >= $${paramIndex}`);
        queryParams.push(params.from_date);
        paramIndex++;
      }

      if (params.to_date) {
        whereConditions.push(`t.transaction_date <= $${paramIndex}`);
        queryParams.push(params.to_date);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_transactions t
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get transactions
      const transactionsQuery = `
        SELECT 
          t.*,
          i.name as item_name,
          i.sku as item_sku,
          i.unit_of_measure
        FROM inventory_transactions t
        LEFT JOIN inventory_items i ON i.id = t.item_id
        ${whereClause}
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const transactionsResult = await client.query(transactionsQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const transactions = transactionsResult.rows.map((row) => {
        if (row.item_name) {
          row.item = {
            id: row.item_id,
            name: row.item_name,
            sku: row.item_sku,
            unit_of_measure: row.unit_of_measure,
          };
        }
        return row;
      });

      return {
        transactions,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get complete transaction history for an item
   */
  async getItemTransactionHistory(
    itemId: number,
    tenantId: string,
    limit: number = 50
  ): Promise<InventoryTransaction[]> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const query = `
        SELECT 
          t.*,
          i.name as item_name,
          i.sku as item_sku,
          i.unit_of_measure
        FROM inventory_transactions t
        LEFT JOIN inventory_items i ON i.id = t.item_id
        WHERE t.item_id = $1
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT $2
      `;

      const result = await client.query(query, [itemId, limit]);

      return result.rows.map((row) => {
        if (row.item_name) {
          row.item = {
            id: row.item_id,
            name: row.item_name,
            sku: row.item_sku,
            unit_of_measure: row.unit_of_measure,
          };
        }
        return row;
      });
    } finally {
      client.release();
    }
  }

  /**
   * Adjust stock with transaction logging
   * Convenience wrapper around createTransaction
   */
  async adjustStock(
    itemId: number,
    data: AdjustStockData,
    tenantId: string,
    userId: number
  ): Promise<{
    transaction: InventoryTransaction;
    new_stock: number;
  }> {
    // Validate adjustment data
    const validatedData = adjustStockSchema.parse(data);

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get current stock
      const itemCheck = await client.query(
        'SELECT current_stock FROM inventory_items WHERE id = $1',
        [itemId]
      );

      if (itemCheck.rows.length === 0) {
        throw new InventoryItemNotFoundError(itemId);
      }

      const currentStock = itemCheck.rows[0].current_stock;

      // Create transaction
      const transaction = await this.createTransaction(
        {
          item_id: itemId,
          transaction_type: validatedData.transaction_type,
          quantity: validatedData.quantity,
          reference_type: validatedData.reference_type,
          reference_id: validatedData.reference_id,
          reason: validatedData.reason,
          notes: validatedData.notes,
        },
        tenantId,
        userId
      );

      // Get new stock level
      const newStockQuery = await client.query(
        'SELECT current_stock FROM inventory_items WHERE id = $1',
        [itemId]
      );

      return {
        transaction,
        new_stock: newStockQuery.rows[0].current_stock,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Add stock (convenience method)
   */
  async stockIn(
    itemId: number,
    quantity: number,
    tenantId: string,
    userId: number,
    options?: {
      unit_cost?: number;
      reference_type?: string;
      reference_id?: number;
      notes?: string;
    }
  ): Promise<InventoryTransaction> {
    if (quantity <= 0) {
      throw new InventoryValidationError('Stock in quantity must be positive');
    }

    return await this.createTransaction(
      {
        item_id: itemId,
        transaction_type: 'addition',
        quantity: quantity,
        unit_cost: options?.unit_cost,
        reference_type: options?.reference_type,
        reference_id: options?.reference_id,
        notes: options?.notes,
        reason: 'Stock received',
      },
      tenantId,
      userId
    );
  }

  /**
   * Remove stock (convenience method)
   */
  async stockOut(
    itemId: number,
    quantity: number,
    tenantId: string,
    userId: number,
    options?: {
      reference_type?: string;
      reference_id?: number;
      reason?: string;
      notes?: string;
    }
  ): Promise<InventoryTransaction> {
    if (quantity <= 0) {
      throw new InventoryValidationError('Stock out quantity must be positive');
    }

    return await this.createTransaction(
      {
        item_id: itemId,
        transaction_type: 'removal',
        quantity: quantity,
        reference_type: options?.reference_type,
        reference_id: options?.reference_id,
        reason: options?.reason || 'Stock issued',
        notes: options?.notes,
      },
      tenantId,
      userId
    );
  }

  /**
   * Validate stock availability for a transaction
   */
  async validateStockAvailability(
    itemId: number,
    requiredQuantity: number,
    tenantId: string
  ): Promise<{
    available: boolean;
    current_stock: number;
    shortage: number;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const query = 'SELECT current_stock FROM inventory_items WHERE id = $1';
      const result = await client.query(query, [itemId]);

      if (result.rows.length === 0) {
        throw new InventoryItemNotFoundError(itemId);
      }

      const currentStock = result.rows[0].current_stock;
      const available = currentStock >= requiredQuantity;
      const shortage = available ? 0 : requiredQuantity - currentStock;

      return {
        available,
        current_stock: currentStock,
        shortage,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get transaction statistics for reporting
   */
  async getTransactionStats(
    tenantId: string,
    from_date?: string,
    to_date?: string
  ): Promise<{
    total_transactions: number;
    additions: number;
    removals: number;
    adjustments: number;
    total_value_in: number;
    total_value_out: number;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (from_date) {
        whereConditions.push(`transaction_date >= $${paramIndex}`);
        queryParams.push(from_date);
        paramIndex++;
      }

      if (to_date) {
        whereConditions.push(`transaction_date <= $${paramIndex}`);
        queryParams.push(to_date);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN transaction_type IN ('addition', 'return') THEN 1 END) as additions,
          COUNT(CASE WHEN transaction_type IN ('removal', 'expiry', 'damage') THEN 1 END) as removals,
          COUNT(CASE WHEN transaction_type = 'adjustment' THEN 1 END) as adjustments,
          COALESCE(SUM(CASE WHEN transaction_type IN ('addition', 'return') THEN total_cost ELSE 0 END), 0) as total_value_in,
          COALESCE(SUM(CASE WHEN transaction_type IN ('removal', 'expiry', 'damage') THEN total_cost ELSE 0 END), 0) as total_value_out
        FROM inventory_transactions
        ${whereClause}
      `;

      const result = await client.query(query, queryParams);
      const stats = result.rows[0];

      return {
        total_transactions: parseInt(stats.total_transactions),
        additions: parseInt(stats.additions),
        removals: parseInt(stats.removals),
        adjustments: parseInt(stats.adjustments),
        total_value_in: parseFloat(stats.total_value_in),
        total_value_out: parseFloat(stats.total_value_out),
      };
    } finally {
      client.release();
    }
  }
}
