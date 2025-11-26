import { Pool, PoolClient } from 'pg';
import { InventoryCategory } from '../types/inventory';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validation/inventory.validation';
import { InventoryValidationError } from './inventory-item.service';

/**
 * CategoryNotFoundError - Thrown when category doesn't exist
 */
export class CategoryNotFoundError extends Error {
  constructor(categoryId: number) {
    super(`Category with ID ${categoryId} not found`);
    this.name = 'CategoryNotFoundError';
  }
}

/**
 * CategoryService - Manages inventory category operations
 * Supports hierarchical category structures
 * Team: Beta, System: Inventory Management
 */
export class CategoryService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get all categories with optional filtering
   */
  async getCategories(
    tenantId: string,
    params?: {
      status?: 'active' | 'inactive';
      parent_category_id?: number | null;
      search?: string;
    }
  ): Promise<InventoryCategory[]> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (params?.status) {
        whereConditions.push(`c.status = $${paramIndex}`);
        queryParams.push(params.status);
        paramIndex++;
      }

      if (params?.parent_category_id !== undefined) {
        if (params.parent_category_id === null) {
          whereConditions.push(`c.parent_category_id IS NULL`);
        } else {
          whereConditions.push(`c.parent_category_id = $${paramIndex}`);
          queryParams.push(params.parent_category_id);
          paramIndex++;
        }
      }

      if (params?.search) {
        whereConditions.push(
          `(c.name ILIKE $${paramIndex} OR c.code ILIKE $${paramIndex})`
        );
        queryParams.push(`%${params.search}%`);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          c.*,
          pc.name as parent_category_name,
          pc.code as parent_category_code,
          (SELECT COUNT(*) FROM inventory_categories WHERE parent_category_id = c.id) as child_count,
          (SELECT COUNT(*) FROM inventory_items WHERE category_id = c.id AND status = 'active') as item_count
        FROM inventory_categories c
        LEFT JOIN inventory_categories pc ON pc.id = c.parent_category_id
        ${whereClause}
        ORDER BY c.name ASC
      `;

      const result = await client.query(query, queryParams);

      return result.rows.map((row) => {
        // Parse counts
        row.child_count = parseInt(row.child_count) || 0;
        row.item_count = parseInt(row.item_count) || 0;

        // Add parent category info if exists
        if (row.parent_category_name) {
          row.parent_category = {
            id: row.parent_category_id,
            name: row.parent_category_name,
            code: row.parent_category_code,
          };
        }

        return row;
      });
    } finally {
      client.release();
    }
  }

  /**
   * Get category by ID with parent information
   * @throws CategoryNotFoundError if category doesn't exist
   */
  async getCategoryById(
    categoryId: number,
    tenantId: string,
    client?: PoolClient
  ): Promise<InventoryCategory> {
    const dbClient = client || (await this.pool.connect());

    try {
      if (!client) {
        await dbClient.query(`SET search_path TO "${tenantId}"`);
      }

      const query = `
        SELECT 
          c.*,
          pc.name as parent_category_name,
          pc.code as parent_category_code,
          (SELECT COUNT(*) FROM inventory_categories WHERE parent_category_id = c.id) as child_count,
          (SELECT COUNT(*) FROM inventory_items WHERE category_id = c.id AND status = 'active') as item_count
        FROM inventory_categories c
        LEFT JOIN inventory_categories pc ON pc.id = c.parent_category_id
        WHERE c.id = $1
      `;

      const result = await dbClient.query(query, [categoryId]);

      if (result.rows.length === 0) {
        throw new CategoryNotFoundError(categoryId);
      }

      const category = result.rows[0];

      // Parse counts
      category.child_count = parseInt(category.child_count) || 0;
      category.item_count = parseInt(category.item_count) || 0;

      // Add parent category info if exists
      if (category.parent_category_name) {
        category.parent_category = {
          id: category.parent_category_id,
          name: category.parent_category_name,
          code: category.parent_category_code,
        };
      }

      return category;
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  /**
   * Create a new category
   * @throws InventoryValidationError if validation fails or code already exists
   */
  async createCategory(
    data: {
      name: string;
      code: string;
      description?: string;
      parent_category_id?: number;
      status?: 'active' | 'inactive';
    },
    tenantId: string,
    userId: number
  ): Promise<InventoryCategory> {
    // Validate input data
    const validatedData = createCategorySchema.parse(data);

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check for duplicate code
      const duplicateCheck = await client.query(
        'SELECT id FROM inventory_categories WHERE code = $1',
        [validatedData.code]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new InventoryValidationError(
          `Category code '${validatedData.code}' already exists`
        );
      }

      // If parent category provided, verify it exists and prevent circular reference
      if (validatedData.parent_category_id) {
        const parentCheck = await client.query(
          'SELECT id FROM inventory_categories WHERE id = $1',
          [validatedData.parent_category_id]
        );

        if (parentCheck.rows.length === 0) {
          throw new InventoryValidationError(
            `Parent category with ID ${validatedData.parent_category_id} not found`
          );
        }
      }

      // Prepare data with audit fields
      const categoryData = {
        ...validatedData,
        status: validatedData.status || 'active',
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const columns = Object.keys(categoryData);
      const values = Object.values(categoryData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO inventory_categories (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(insertQuery, values);
      const createdCategory = result.rows[0];

      // Fetch complete category with parent info
      return await this.getCategoryById(createdCategory.id, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Update category information
   * @throws CategoryNotFoundError if category doesn't exist
   * @throws InventoryValidationError if update violates constraints
   */
  async updateCategory(
    categoryId: number,
    data: {
      name?: string;
      description?: string;
      parent_category_id?: number;
      status?: 'active' | 'inactive';
    },
    tenantId: string,
    userId: number
  ): Promise<InventoryCategory> {
    // Validate partial update data
    const validatedData = updateCategorySchema.parse(data);

    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      throw new InventoryValidationError('No valid fields provided for update');
    }

    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check category exists
      await this.getCategoryById(categoryId, tenantId, client);

      // If updating parent, validate it exists and prevent circular reference
      if (updateData.parent_category_id !== undefined) {
        if (updateData.parent_category_id === categoryId) {
          throw new InventoryValidationError(
            'Category cannot be its own parent'
          );
        }

        if (updateData.parent_category_id !== null) {
          // Check parent exists
          const parentCheck = await client.query(
            'SELECT id FROM inventory_categories WHERE id = $1',
            [updateData.parent_category_id]
          );

          if (parentCheck.rows.length === 0) {
            throw new InventoryValidationError(
              `Parent category with ID ${updateData.parent_category_id} not found`
            );
          }

          // Prevent circular reference (check if parent is a descendant)
          const isDescendant = await this.isDescendantOf(
            Number(updateData.parent_category_id),
            categoryId,
            tenantId,
            client
          );

          if (isDescendant) {
            throw new InventoryValidationError(
              'Cannot set parent: would create circular reference'
            );
          }
        }
      }

      // Prepare update data with audit fields
      const finalUpdateData = {
        ...updateData,
        updated_by: userId,
        updated_at: new Date(),
      };

      const entries = Object.entries(finalUpdateData).filter(([_, v]) => v !== undefined);
      const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
      const values = entries.map(([_, value]) => value);

      const updateQuery = `
        UPDATE inventory_categories
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      await client.query(updateQuery, [categoryId, ...values]);

      return await this.getCategoryById(categoryId, tenantId, client);
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete a category (set status = 'inactive')
   * Cannot delete if it has active items or child categories
   * @throws CategoryNotFoundError if category doesn't exist
   * @throws InventoryValidationError if category has dependencies
   */
  async deleteCategory(
    categoryId: number,
    tenantId: string,
    userId: number
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Check category exists
      const category = await this.getCategoryById(categoryId, tenantId, client);

      // Check for child categories
      const childCountResult = await client.query(
        'SELECT COUNT(*) as count FROM inventory_categories WHERE parent_category_id = $1',
        [categoryId]
      );
      if (parseInt(childCountResult.rows[0].count) > 0) {
        throw new InventoryValidationError(
          'Cannot delete category with child categories'
        );
      }

      // Check for active items
      const itemCountResult = await client.query(
        'SELECT COUNT(*) as count FROM inventory_items WHERE category_id = $1',
        [categoryId]
      );
      if (parseInt(itemCountResult.rows[0].count) > 0) {
        throw new InventoryValidationError(
          'Cannot delete category with active inventory items'
        );
      }

      // Soft delete
      const updateQuery = `
        UPDATE inventory_categories
        SET status = 'inactive',
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(updateQuery, [categoryId, userId]);
    } finally {
      client.release();
    }
  }

  /**
   * Get hierarchical category tree
   * Returns nested category structure
   */
  async getCategoryTree(
    tenantId: string,
    status: 'active' | 'inactive' | 'all' = 'active'
  ): Promise<InventoryCategory[]> {
    const client = await this.pool.connect();

    try {
      await client.query(`SET search_path TO "${tenantId}"`);

      // Get all categories
      let whereClause = '';
      if (status !== 'all') {
        whereClause = `WHERE status = '${status}'`;
      }

      const query = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM inventory_items WHERE category_id = c.id AND status = 'active') as item_count
        FROM inventory_categories c
        ${whereClause}
        ORDER BY c.name ASC
      `;

      const result = await client.query(query);
      const categories = result.rows;

      // Build tree structure
      const categoryMap = new Map();
      const rootCategories: InventoryCategory[] = [];

      // First pass: create map
      categories.forEach((cat: any) => {
        cat.item_count = parseInt(cat.item_count) || 0;
        cat.children = [];
        categoryMap.set(cat.id, cat);
      });

      // Second pass: build tree
      categories.forEach((cat: any) => {
        if (cat.parent_category_id) {
          const parent = categoryMap.get(cat.parent_category_id);
          if (parent) {
            parent.children.push(cat);
          } else {
            // Parent not found (possibly inactive), treat as root
            rootCategories.push(cat);
          }
        } else {
          rootCategories.push(cat);
        }
      });

      return rootCategories;
    } finally {
      client.release();
    }
  }

  /**
   * Get direct children of a category
   */
  async getCategoryChildren(
    categoryId: number,
    tenantId: string
  ): Promise<InventoryCategory[]> {
    return await this.getCategories(tenantId, {
      parent_category_id: categoryId,
      status: 'active',
    });
  }

  /**
   * Check if category A is a descendant of category B
   * Used to prevent circular references
   */
  private async isDescendantOf(
    potentialDescendantId: number,
    ancestorId: number,
    tenantId: string,
    client: PoolClient
  ): Promise<boolean> {
    const query = `
      WITH RECURSIVE category_hierarchy AS (
        -- Base case: start with the potential descendant
        SELECT id, parent_category_id
        FROM inventory_categories
        WHERE id = $1
        
        UNION ALL
        
        -- Recursive case: traverse up the tree
        SELECT c.id, c.parent_category_id
        FROM inventory_categories c
        INNER JOIN category_hierarchy ch ON c.id = ch.parent_category_id
      )
      SELECT EXISTS(
        SELECT 1 FROM category_hierarchy WHERE id = $2
      ) as is_descendant
    `;

    const result = await client.query(query, [potentialDescendantId, ancestorId]);
    return result.rows[0].is_descendant;
  }
}
