/**
 * Inventory Management System - Zod Validation Schemas
 * Team Beta - Sprint 1, Day 3
 */

import { z } from 'zod';

// ==================== Inventory Items ====================

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(100),
  category_id: z.number().int().positive(),
  description: z.string().optional(),
  unit_of_measure: z.string().min(1).max(50),
  current_stock: z.number().int().min(0).default(0),
  minimum_stock: z.number().int().min(0),
  maximum_stock: z.number().int().min(0),
  reorder_point: z.number().int().min(0),
  unit_cost: z.number().min(0).optional(),
  selling_price: z.number().min(0).optional(),
  supplier_id: z.number().int().positive().optional(),
  location: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  expiry_date: z.string().datetime().optional(),
  batch_number: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category_id: z.number().int().positive().optional(),
  description: z.string().optional(),
  unit_of_measure: z.string().min(1).max(50).optional(),
  minimum_stock: z.number().int().min(0).optional(),
  maximum_stock: z.number().int().min(0).optional(),
  reorder_point: z.number().int().min(0).optional(),
  unit_cost: z.number().min(0).optional(),
  selling_price: z.number().min(0).optional(),
  supplier_id: z.number().int().positive().optional(),
  location: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  expiry_date: z.string().datetime().optional(),
  batch_number: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  notes: z.string().optional(),
});

export const adjustStockSchema = z.object({
  transaction_type: z.enum(['addition', 'removal', 'adjustment']),
  quantity: z.number().int(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  reference_type: z.string().optional(),
  reference_id: z.number().int().optional(),
});

// ==================== Categories ====================

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  parent_category_id: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parent_category_id: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// ==================== Suppliers ====================

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional(),
  contact_person: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  payment_terms: z.string().max(100).optional(),
  lead_time_days: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ==================== Purchase Orders ====================

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.number().int().positive(),
  order_date: z.string().datetime().optional(),
  expected_delivery_date: z.string().datetime().optional(),
  items: z.array(z.object({
    item_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unit_cost: z.number().min(0),
  })).min(1),
  shipping_cost: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  expected_delivery_date: z.string().datetime().optional(),
  actual_delivery_date: z.string().datetime().optional(),
  status: z.enum(['pending', 'approved', 'in_transit', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['unpaid', 'partial', 'paid']).optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

export const receivePurchaseOrderItemSchema = z.object({
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

// ==================== Equipment Maintenance ====================

export const createMaintenanceSchema = z.object({
  equipment_id: z.number().int().positive(),
  maintenance_type: z.enum(['preventive', 'corrective', 'calibration', 'inspection']),
  scheduled_date: z.string().datetime(),
  technician_name: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMaintenanceSchema = z.object({
  scheduled_date: z.string().datetime().optional(),
  completed_date: z.string().datetime().optional(),
  next_maintenance_date: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue']).optional(),
  technician_name: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  description: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  parts_replaced: z.string().optional(),
  notes: z.string().optional(),
});

// ==================== Search Parameters ====================

export const inventorySearchSchema = z.object({
  category_id: z.number().int().positive().optional(),
  status: z.string().optional(),
  stock_status: z.string().optional(),
  supplier_id: z.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const purchaseOrderSearchSchema = z.object({
  supplier_id: z.number().int().positive().optional(),
  status: z.string().optional(),
  payment_status: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type InventorySearchInput = z.infer<typeof inventorySearchSchema>;
export type PurchaseOrderSearchInput = z.infer<typeof purchaseOrderSearchSchema>;
