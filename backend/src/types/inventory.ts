/**
 * Inventory Management System - TypeScript Interfaces
 * Team Beta - Sprint 1, Day 3
 */

// ==================== Core Entities ====================

export interface InventoryCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_category_id?: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  description?: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  unit_cost?: number;
  selling_price?: number;
  supplier_id?: number;
  location?: string;
  barcode?: string;
  expiry_date?: Date;
  batch_number?: string;
  status: 'active' | 'inactive' | 'discontinued';
  last_restocked_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
  
  // Computed fields
  category?: InventoryCategory;
  supplier?: Supplier;
  stock_status?: 'optimal' | 'low_stock' | 'critical' | 'overstock' | 'out_of_stock';
  days_until_expiry?: number;
}

export interface InventoryTransaction {
  id: number;
  item_id: number;
  transaction_type: 'addition' | 'removal' | 'adjustment' | 'transfer' | 'expiry' | 'damage' | 'return';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: number;
  from_location?: string;
  to_location?: string;
  reason?: string;
  notes?: string;
  transaction_date: Date;
  created_by: number;
  created_at: Date;
  
  // Relations
  item?: InventoryItem;
}

export interface Supplier {
  id: number;
  name: string;
  code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  payment_terms?: string;
  lead_time_days: number;
  rating?: number;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  order_date: Date;
  expected_delivery_date?: Date;
  actual_delivery_date?: Date;
  status: 'pending' | 'approved' | 'in_transit' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_method?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  updated_by?: number;
  approved_by?: number;
  approved_at?: Date;
  
  // Relations
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  item_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  created_at: Date;
  
  // Relations
  item?: InventoryItem;
}

export interface EquipmentMaintenance {
  id: number;
  equipment_id: number;
  maintenance_type: 'preventive' | 'corrective' | 'calibration' | 'inspection';
  scheduled_date: Date;
  completed_date?: Date;
  next_maintenance_date?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  technician_name?: string;
  cost?: number;
  description?: string;
  findings?: string;
  recommendations?: string;
  parts_replaced?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  updated_by?: number;
  
  // Relations
  equipment?: InventoryItem;
}

// ==================== Request DTOs ====================

export interface CreateInventoryItemData {
  name: string;
  sku: string;
  category_id: number;
  description?: string;
  unit_of_measure: string;
  current_stock?: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  unit_cost?: number;
  selling_price?: number;
  supplier_id?: number;
  location?: string;
  barcode?: string;
  expiry_date?: string;
  batch_number?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export interface UpdateInventoryItemData {
  name?: string;
  category_id?: number;
  description?: string;
  unit_of_measure?: string;
  minimum_stock?: number;
  maximum_stock?: number;
  reorder_point?: number;
  unit_cost?: number;
  selling_price?: number;
  supplier_id?: number;
  location?: string;
  barcode?: string;
  expiry_date?: string;
  batch_number?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  notes?: string;
}

export interface CreatePurchaseOrderData {
  supplier_id: number;
  order_date?: string;
  expected_delivery_date?: string;
  items: {
    item_id: number;
    quantity: number;
    unit_cost: number;
  }[];
  shipping_cost?: number;
  tax_amount?: number;
  notes?: string;
}

export interface CreateSupplierData {
  name: string;
  code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  payment_terms?: string;
  lead_time_days?: number;
  notes?: string;
}

export interface AdjustStockData {
  transaction_type: 'addition' | 'removal' | 'adjustment';
  quantity: number;
  reason?: string;
  notes?: string;
  reference_type?: string;
  reference_id?: number;
}

// ==================== Search & Filter ====================

export interface InventorySearchParams {
  category_id?: number;
  status?: string;
  stock_status?: string;
  supplier_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PurchaseOrderSearchParams {
  supplier_id?: number;
  status?: string;
  payment_status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== Response Types ====================

export interface InventoryItemsResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface InventoryStatsResponse {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  expiring_soon_items: number;
  categories_count: number;
}

export interface PurchaseOrdersResponse {
  orders: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
