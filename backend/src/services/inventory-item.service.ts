import { Pool, PoolClient } from 'pg';
import {
  InventoryItem,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  InventorySearchParams,
  InventoryItemsResponse,
  InventoryStatsResponse,
} from '../types/inventory';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from '../validation/inventory.validation';

/**
 * Custom error classes for inventory operations
 */
export class InventoryItemNotFoundError extends Error {
  constructor(itemId: number) {
    super(`Inventory item with ID ${itemId} not found`);
    this.name = 'InventoryItemNotFoundError';
  }
}

export class InventoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryValidationError';
  }
}

export class InsufficientStockError extends Error {
  constructor(itemId: number, requested: number, available: number) {
    super(
      `Insufficient stock for item ${itemId}. Requested: ${requested}, Available: ${available}`
    );
    this.name = 'InsufficientStockError';
  }
}

/**
 * InventoryItemService - Manages inventory item operations
 * Implements CRUD operations with multi-tenant isolation and stock management
 * Team: Beta, System: Inventory Management
 */
export class InventoryItemService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new inventory item in the tenant's schema
   * @throws InventoryValidationError if validation fails or SKU already exists
   */
  async createInventoryItem(
    data: CreateInventoryItemData,
    tenantId: string,
    userId: number
  ): Promise<InventoryItem> {
    // Validate input data using Zod schema
    const validatedData = createInventoryItemSchema.parse(data);

    const client = await this.pool.connect();

    try {
      // Set tenant schema context for multi-tenant isolation
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check for duplicate SKU within tenant
      const duplicateCheck = await client.query(
        'SELECT id FROM inventory_items WHERE sku = $1',
        [validatedData.sku]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new InventoryValidationError(
          `SKU '${validatedData.sku}' already exists in inventory`
        );
      }

      // Verify category exists
      const categoryCheck = await client.query(
        'SELECT id FROM inventory_categories WHERE id = $1 AND status = $2',
        [validatedData.category_id, 'active']
      );

      if (categoryCheck.rows.length === 0) {
        throw new InventoryValidationError(
          `Category with ID ${validatedData.category_id} not found or inactive`
        );
      }

      // If supplier provided, verify it exists
      if (validatedData.supplier_id) {
        const supplierCheck = await client.query(
          'SELECT id FROM suppliers WHERE id = $1 AND status = $2',
          [validatedData.supplier_id, 'active']
        );

        if (supplierCheck.rows.length === 0) {
          throw new InventoryValidationError(
            `Supplier with ID ${validatedData.supplier_id} not found or inactive`
          );
        }
      }

      // Validate stock thresholds
      if (validatedData.minimum_stock > validatedData.maximum_stock) {
        throw new InventoryValidationError(
          'Minimum stock cannot be greater than maximum stock'
        );
      }

      if (
        validatedData.reorder_point < validatedData.minimum_stock ||
        validatedData.reorder_point > validatedData.maximum_stock
      ) {
        throw new InventoryValidationError(
          'Reorder point must be between minimum and maximum stock levels'
        );
      }

      // Prepare data with audit fields
      const itemData = {
        ...validatedData,
        current_stock: validatedData.current_stock || 0,
        status: validatedData.status || 'active',
        expiry_date: validatedData.expiry_date || null,
        last_restocked_date: new Date(),
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Build dynamic insert query
      const columns = Object.keys(itemData);
      const values = Object.values(itemData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO inventory_items (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(insertQuery, values);
      const createdItem = result.rows[0];

      // Fetch complete item with relations
      return await this.getInventoryItemById(createdItem.id, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Get inventory item by ID with category and supplier information
   * @throws InventoryItemNotFoundError if item doesn't exist
   */
  async getInventoryItemById(
    itemId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<InventoryItem> {
    const dbClient = client || (await this.pool.connect());

    try {
      // Set schema context if using new connection
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
        SELECT 
          i.*,
          c.name as category_name,
          c.code as category_code,
          s.name as supplier_name,
          s.code as supplier_code,
          s.lead_time_days as supplier_lead_time
        FROM inventory_items i
        LEFT JOIN inventory_categories c ON c.id = i.category_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        WHERE i.id = $1
      `;

      const result = await dbClient.query(query, [itemId]);

      if (result.rows.length === 0) {
        throw new InventoryItemNotFoundError(itemId);
      }

      const item = result.rows[0];

      // Add computed fields
      item.stock_status = this.calculateStockStatus(item);
      item.days_until_expiry = this.calculateDaysUntilExpiry(item.expiry_date);

      // Construct category object if joined
      if (item.category_name) {
        item.category = {
          id: item.category_id,
          name: item.category_name,
          code: item.category_code,
        };
      }

      // Construct supplier object if joined
      if (item.supplier_name) {
        item.supplier = {
          id: item.supplier_id,
          name: item.supplier_name,
          code: item.supplier_code,
          lead_time_days: item.supplier_lead_time,
        };
      }

      return item;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Update inventory item information
   * @throws InventoryItemNotFoundError if item doesn't exist
   * @throws InventoryValidationError if update violates constraints
   */
  async updateInventoryItem(
    itemId: number,
    data: UpdateInventoryItemData,
    tenantId: string,
    userId: number
  ): Promise<InventoryItem> {
    // Validate partial update data
    const validatedData = updateInventoryItemSchema.parse(data);

    // Remove empty/undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw new InventoryValidationError('No valid fields provided for update');
    }

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check item exists
      const existingItem = await this.getInventoryItemById(itemId, tenantId, client);

      // If updating category, verify it exists
      if (updateData.category_id) {
        const categoryCheck = await client.query(
          'SELECT id FROM inventory_categories WHERE id = $1 AND status = $2',
          [updateData.category_id, 'active']
        );

        if (categoryCheck.rows.length === 0) {
          throw new InventoryValidationError(
            `Category with ID ${updateData.category_id} not found or inactive`
          );
        }
      }

      // If updating supplier, verify it exists
      if (updateData.supplier_id) {
        const supplierCheck = await client.query(
          'SELECT id FROM suppliers WHERE id = $1 AND status = $2',
          [updateData.supplier_id, 'active']
        );

        if (supplierCheck.rows.length === 0) {
          throw new InventoryValidationError(
            `Supplier with ID ${updateData.supplier_id} not found or inactive`
          );
        }
      }

      // Validate stock thresholds if being updated
      const minStock = updateData.minimum_stock ?? existingItem.minimum_stock;
      const maxStock = updateData.maximum_stock ?? existingItem.maximum_stock;
      const reorderPoint = updateData.reorder_point ?? existingItem.reorder_point;

      if (minStock > maxStock) {
        throw new InventoryValidationError(
          'Minimum stock cannot be greater than maximum stock'
        );
      }

      if (reorderPoint < minStock || reorderPoint > maxStock) {
        throw new InventoryValidationError(
          'Reorder point must be between minimum and maximum stock levels'
        );
      }

      // Prepare update data with audit fields
      const finalUpdateData = {
        ...updateData,
        updated_by: userId,
        updated_at: new Date(),
      };

      // Build dynamic update query
      const entries = Object.entries(finalUpdateData).filter(([_, v]) => v !== undefined);
      const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
      const values = entries.map(([_, value]) => value);

      const updateQuery = `
        UPDATE inventory_items
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [itemId, ...values]);

      // Return updated item with relations
      return await this.getInventoryItemById(itemId, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete an inventory item (set status = 'discontinued')
   * @throws InventoryItemNotFoundError if item doesn't exist
   */
  async deleteInventoryItem(
    itemId: number,
    tenantId: string,
    userId: number
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check item exists
      await this.getInventoryItemById(itemId, tenantId, client);

      // Soft delete: set status = 'discontinued'
      const updateQuery = `
        UPDATE inventory_items
        SET status = 'discontinued',
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(updateQuery, [itemId, userId]);
    } finally {
      client.release();
    }
  }

  /**
   * Get inventory items with filtering, search, and pagination
   */
  async getInventoryItems(
    tenantId: string,
    params: InventorySearchParams
  ): Promise<InventoryItemsResponse> {
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
      if (params.category_id) {
        whereConditions.push(`i.category_id = $${paramIndex}`);
        queryParams.push(params.category_id);
        paramIndex++;
      }

      if (params.status) {
        whereConditions.push(`i.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }

      if (params.supplier_id) {
        whereConditions.push(`i.supplier_id = $${paramIndex}`);
        queryParams.push(params.supplier_id);
        paramIndex++;
      }

      if (params.stock_status) {
        // Stock status filtering requires complex logic
        switch (params.stock_status) {
          case 'low_stock':
            whereConditions.push(`i.current_stock <= i.reorder_point`);
            break;
          case 'critical':
            whereConditions.push(`i.current_stock <= i.minimum_stock`);
            break;
          case 'out_of_stock':
            whereConditions.push(`i.current_stock = 0`);
            break;
          case 'overstock':
            whereConditions.push(`i.current_stock > i.maximum_stock`);
            break;
          case 'optimal':
            whereConditions.push(
              `i.current_stock > i.reorder_point AND i.current_stock <= i.maximum_stock`
            );
            break;
        }
      }

      if (params.search) {
        whereConditions.push(
          `(i.name ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`
        );
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_items i
        LEFT JOIN inventory_categories c ON c.id = i.category_id
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get items with pagination
      const sortBy = params.sort_by || 'name';
      const sortOrder = params.sort_order || 'asc';

      const itemsQuery = `
        SELECT 
          i.*,
          c.name as category_name,
          c.code as category_code,
          s.name as supplier_name,
          s.code as supplier_code
        FROM inventory_items i
        LEFT JOIN inventory_categories c ON c.id = i.category_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        ${whereClause}
        ORDER BY i.${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const itemsResult = await client.query(itemsQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const items = itemsResult.rows.map((row) => {
        // Add computed fields
        row.stock_status = this.calculateStockStatus(row);
        row.days_until_expiry = this.calculateDaysUntilExpiry(row.expiry_date);

        // Add category object if available
        if (row.category_name) {
          row.category = {
            id: row.category_id,
            name: row.category_name,
            code: row.category_code,
          };
        }

        // Add supplier object if available
        if (row.supplier_name) {
          row.supplier = {
            id: row.supplier_id,
            name: row.supplier_name,
            code: row.supplier_code,
          };
        }

        return row;
      });

      return {
        items,
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
   * Get items with low stock (below reorder point)
   */
  async getLowStockItems(
    tenantId: string,
    limit: number = 50
  ): Promise<InventoryItem[]> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const query = `
        SELECT 
          i.*,
          c.name as category_name,
          c.code as category_code,
          s.name as supplier_name,
          s.lead_time_days as supplier_lead_time
        FROM inventory_items i
        LEFT JOIN inventory_categories c ON c.id = i.category_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        WHERE i.current_stock <= i.reorder_point 
          AND i.status = 'active'
        ORDER BY 
          CASE 
            WHEN i.current_stock = 0 THEN 1
            WHEN i.current_stock <= i.minimum_stock THEN 2
            ELSE 3
          END,
          i.current_stock ASC
        LIMIT $1
      `;

      const result = await client.query(query, [limit]);

      return result.rows.map((row) => {
        row.stock_status = this.calculateStockStatus(row);
        row.days_until_expiry = this.calculateDaysUntilExpiry(row.expiry_date);

        if (row.category_name) {
          row.category = {
            id: row.category_id,
            name: row.category_name,
            code: row.category_code,
          };
        }

        if (row.supplier_name) {
          row.supplier = {
            id: row.supplier_id,
            name: row.supplier_name,
            lead_time_days: row.supplier_lead_time,
          };
        }

        return row;
      });
    } finally {
      client.release();
    }
  }

  /**
   * Get inventory stock level statistics
   */
  async getStockLevels(tenantId: string): Promise<InventoryStatsResponse> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      const query = `
        SELECT 
          COUNT(*) as total_items,
          COUNT(DISTINCT category_id) as categories_count,
          COALESCE(SUM(current_stock * COALESCE(unit_cost, 0)), 0) as total_value,
          COUNT(CASE WHEN current_stock <= reorder_point THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items,
          COUNT(
            CASE 
              WHEN expiry_date IS NOT NULL 
                AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
                AND expiry_date > CURRENT_DATE
              THEN 1 
            END
          ) as expiring_soon_items
        FROM inventory_items
        WHERE status = 'active'
      `;

      const result = await client.query(query);
      const stats = result.rows[0];

      return {
        total_items: parseInt(stats.total_items),
        total_value: parseFloat(stats.total_value),
        low_stock_items: parseInt(stats.low_stock_items),
        out_of_stock_items: parseInt(stats.out_of_stock_items),
        expiring_soon_items: parseInt(stats.expiring_soon_items),
        categories_count: parseInt(stats.categories_count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update stock level for an item (direct update)
   * Note: For tracked changes, use InventoryTransactionService instead
   */
  async updateStockLevel(
    itemId: number,
    newStock: number,
    tenantId: string,
    userId: number
  ): Promise<InventoryItem> {
    if (newStock < 0) {
      throw new InventoryValidationError('Stock level cannot be negative');
    }

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check item exists
      await this.getInventoryItemById(itemId, tenantId, client);

      const updateQuery = `
        UPDATE inventory_items
        SET current_stock = $2,
            last_restocked_date = CURRENT_TIMESTAMP,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [itemId, newStock, userId]);

      return await this.getInventoryItemById(itemId, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Calculate stock status based on current stock and thresholds
   */
  private calculateStockStatus(
    item: any
  ): 'optimal' | 'low_stock' | 'critical' | 'overstock' | 'out_of_stock' {
    if (item.current_stock === 0) {
      return 'out_of_stock';
    } else if (item.current_stock <= item.minimum_stock) {
      return 'critical';
    } else if (item.current_stock <= item.reorder_point) {
      return 'low_stock';
    } else if (item.current_stock > item.maximum_stock) {
      return 'overstock';
    } else {
      return 'optimal';
    }
  }

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryDate?: Date | string): number | undefined {
    if (!expiryDate) return undefined;

    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
