# Inventory Management Integration - Design Document

## Overview

This design document outlines the architecture for integrating the Inventory Management frontend with the backend API, replacing mock data with actual database operations while ensuring secure multi-tenant isolation. The system will manage medical supplies, equipment, purchase orders, and suppliers using tenant-specific schemas.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Inventory Management Pages                            │ │
│  │  - /inventory (main dashboard)                         │ │
│  │  - /inventory/stock-management                         │ │
│  │  - /inventory/equipment                                │ │
│  │  - /inventory/orders                                   │ │
│  │  - /inventory/suppliers                                │ │
│  │  - /inventory/reports                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Custom Hooks                                          │ │
│  │  - useInventory() - Fetch inventory list              │ │
│  │  - useInventoryItem() - Fetch single item             │ │
│  │  - useInventoryStats() - Fetch statistics             │ │
│  │  - useEquipment() - Fetch equipment list              │ │
│  │  - usePurchaseOrders() - Fetch orders                 │ │
│  │  - useSuppliers() - Fetch suppliers                   │ │
│  │  - useInventoryMutations() - Create/Update/Delete     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Client (lib/api.ts)                              │ │
│  │  - Axios instance with interceptors                   │ │
│  │  - Auto-inject: Authorization, X-Tenant-ID,           │ │
│  │    X-App-ID, X-API-Key headers                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Express.js)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Chain                                      │ │
│  │  1. appAuthMiddleware - Verify app authentication     │ │
│  │  2. authMiddleware - Validate JWT token               │ │
│  │  3. tenantMiddleware - Set tenant context             │ │
│  │  4. authorizationMiddleware - Check permissions       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Inventory Routes (/api/inventory)                    │ │
│  │  - GET /api/inventory - List inventory items          │ │
│  │  - GET /api/inventory/:id - Get item details          │ │
│  │  - GET /api/inventory/stats - Get statistics          │ │
│  │  - POST /api/inventory - Create item                  │ │
│  │  - PUT /api/inventory/:id - Update item               │ │
│  │  - DELETE /api/inventory/:id - Delete item            │ │
│  │  - POST /api/inventory/:id/adjust - Adjust stock      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Equipment Routes (/api/equipment)                    │ │
│  │  - GET /api/equipment - List equipment                │ │
│  │  - GET /api/equipment/:id - Get equipment details     │ │
│  │  - POST /api/equipment/:id/maintenance - Log maint.   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Purchase Order Routes (/api/purchase-orders)         │ │
│  │  - GET /api/purchase-orders - List orders             │ │
│  │  - POST /api/purchase-orders - Create order           │ │
│  │  - PUT /api/purchase-orders/:id - Update order        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supplier Routes (/api/suppliers)                     │ │
│  │  - GET /api/suppliers - List suppliers                │ │
│  │  - POST /api/suppliers - Create supplier              │ │
│  │  - PUT /api/suppliers/:id - Update supplier           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tenant Schema (tenant_xxx)                           │ │
│  │  - inventory_items (supplies and equipment)           │ │
│  │  - inventory_categories (item categories)             │ │
│  │  - inventory_transactions (stock movements)           │ │
│  │  - equipment_maintenance (maintenance logs)           │ │
│  │  - purchase_orders (procurement orders)               │ │
│  │  - purchase_order_items (order line items)            │ │
│  │  - suppliers (vendor information)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Design

### Tenant-Specific Tables (Created in each tenant schema)

#### 1. inventory_items
```sql
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES inventory_categories(id),
  item_type VARCHAR(50) NOT NULL, -- 'supply', 'equipment', 'medication'
  unit_of_measure VARCHAR(50) NOT NULL, -- 'box', 'unit', 'bottle', etc.
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL,
  max_stock_level INTEGER NOT NULL,
  reorder_point INTEGER NOT NULL,
  reorder_quantity INTEGER,
  unit_cost DECIMAL(10, 2) NOT NULL,
  location VARCHAR(255), -- Storage location
  expiry_date DATE, -- For perishable items
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'discontinued'
  last_restocked_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- References public.users.id
  
  -- Computed fields (calculated in application)
  -- stock_status: 'optimal', 'low_stock', 'critical', 'overstock'
  -- total_value: current_stock * unit_cost
  -- days_until_expiry: expiry_date - current_date
  
  CONSTRAINT check_stock_levels CHECK (min_stock_level <= max_stock_level),
  CONSTRAINT check_reorder_point CHECK (reorder_point >= min_stock_level)
);

CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_supplier ON inventory_items(supplier_id);
CREATE INDEX idx_inventory_items_expiry ON inventory_items(expiry_date);
```

#### 2. inventory_categories
```sql
CREATE TABLE inventory_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INTEGER REFERENCES inventory_categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO inventory_categories (name, description) VALUES
('PPE', 'Personal Protective Equipment'),
('Medical Supplies', 'General medical supplies and consumables'),
('Medications', 'Pharmaceutical products'),
('Equipment', 'Medical equipment and devices'),
('Laboratory', 'Laboratory supplies and reagents'),
('Surgical', 'Surgical instruments and supplies');
```

#### 3. inventory_transactions
```sql
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'addition', 'removal', 'adjustment', 'expiry', 'transfer'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  reason TEXT,
  reference_type VARCHAR(50), -- 'purchase_order', 'usage', 'waste', 'manual'
  reference_id INTEGER, -- ID of related record (e.g., purchase_order_id)
  performed_by INTEGER, -- References public.users.id
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
```

#### 4. equipment_maintenance
```sql
CREATE TABLE equipment_maintenance (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL, -- 'routine', 'repair', 'calibration', 'inspection'
  maintenance_date DATE NOT NULL,
  next_maintenance_date DATE,
  performed_by VARCHAR(255), -- Technician name or company
  cost DECIMAL(10, 2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER -- References public.users.id
);

CREATE INDEX idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_maintenance_date ON equipment_maintenance(maintenance_date);
CREATE INDEX idx_equipment_maintenance_next_date ON equipment_maintenance(next_maintenance_date);
```

#### 5. suppliers
```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  payment_terms VARCHAR(255),
  lead_time_days INTEGER, -- Average delivery time
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
  rating DECIMAL(3, 2), -- Supplier rating (0-5)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_status ON suppliers(status);
```

#### 6. purchase_orders
```sql
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'ordered', 'in_transit', 'delivered', 'cancelled'
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- References public.users.id
  approved_by INTEGER, -- References public.users.id
  approved_at TIMESTAMP
);

CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
```

#### 7. purchase_order_items
```sql
CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES inventory_items(id),
  item_name VARCHAR(255) NOT NULL, -- Stored for historical record
  item_sku VARCHAR(50),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  notes TEXT
);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_item ON purchase_order_items(item_id);
```

## API Endpoints

### Inventory Items

#### GET /api/inventory
**Purpose:** Retrieve list of inventory items for the current tenant

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `status` (string): Filter by status (optimal, low_stock, critical, overstock)
- `item_type` (string): Filter by type (supply, equipment, medication)
- `search` (string): Search by name, SKU, or description
- `sortBy` (string): Sort field (name, sku, current_stock, unit_cost)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "sku": "SG-100-001",
      "name": "Surgical Gloves (Box of 100)",
      "category": "PPE",
      "item_type": "supply",
      "current_stock": 450,
      "min_stock_level": 200,
      "max_stock_level": 1000,
      "reorder_point": 250,
      "unit_cost": 12.50,
      "stock_status": "optimal",
      "total_value": 5625.00,
      "supplier": {
        "id": 1,
        "name": "MedSupply Co."
      },
      "last_restocked_date": "2024-10-18",
      "expiry_date": null,
      "days_until_expiry": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  },
  "stats": {
    "total_items": 156,
    "low_stock_count": 23,
    "critical_count": 3,
    "total_value": 487000.00
  }
}
```

#### GET /api/inventory/stats
**Purpose:** Retrieve inventory statistics

**Response:**
```json
{
  "total_items": 1247,
  "low_stock_items": 23,
  "critical_items": 3,
  "total_value": 487000.00,
  "waste_this_month": 2340.00,
  "category_distribution": {
    "PPE": 450,
    "Medical Supplies": 320,
    "Medications": 280,
    "Equipment": 120,
    "Laboratory": 77
  },
  "stock_status_distribution": {
    "optimal": 1180,
    "low_stock": 23,
    "critical": 3,
    "overstock": 41
  }
}
```

#### POST /api/inventory/:id/adjust
**Purpose:** Adjust stock level for an item

**Request Body:**
```json
{
  "transaction_type": "addition",
  "quantity": 100,
  "reason": "Received from supplier",
  "reference_type": "purchase_order",
  "reference_id": 123,
  "notes": "PO-2024-001 delivered"
}
```

### Equipment

#### GET /api/equipment
**Purpose:** Retrieve list of equipment with maintenance status

**Response:**
```json
{
  "equipment": [
    {
      "id": 1,
      "name": "Ultrasound Machine",
      "sku": "USM-001",
      "location": "Room 301",
      "status": "operational",
      "last_maintenance": {
        "date": "2024-10-15",
        "type": "routine",
        "performed_by": "TechCare Inc."
      },
      "next_maintenance_date": "2024-11-15",
      "maintenance_status": "upcoming",
      "days_until_maintenance": 10,
      "condition": "good"
    }
  ]
}
```

### Purchase Orders

#### GET /api/purchase-orders
**Purpose:** Retrieve list of purchase orders

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "order_number": "PO-2024-001",
      "supplier": {
        "id": 1,
        "name": "MedSupply Co."
      },
      "order_date": "2024-10-20",
      "expected_delivery_date": "2024-10-25",
      "status": "delivered",
      "total_amount": 5000.00,
      "items_count": 5,
      "items": [
        {
          "item_name": "Surgical Gloves",
          "quantity": 1000,
          "unit_cost": 12.50,
          "total_cost": 12500.00
        }
      ]
    }
  ]
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  item_type: 'supply' | 'equipment' | 'medication';
  unit_of_measure: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  reorder_quantity?: number;
  unit_cost: number;
  location?: string;
  expiry_date?: string;
  supplier?: Supplier;
  status: 'active' | 'inactive' | 'discontinued';
  last_restocked_date?: string;
  
  // Computed fields
  stock_status: 'optimal' | 'low_stock' | 'critical' | 'overstock';
  total_value: number;
  days_until_expiry?: number;
}

interface InventoryTransaction {
  id: number;
  item_id: number;
  transaction_type: 'addition' | 'removal' | 'adjustment' | 'expiry' | 'transfer';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  reference_type?: string;
  reference_id?: number;
  performed_by: number;
  transaction_date: string;
  notes?: string;
}

interface Equipment {
  id: number;
  name: string;
  sku: string;
  location: string;
  status: 'operational' | 'maintenance_due' | 'under_maintenance' | 'out_of_service';
  last_maintenance?: MaintenanceRecord;
  next_maintenance_date?: string;
  maintenance_status: 'current' | 'upcoming' | 'overdue';
  days_until_maintenance?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

interface MaintenanceRecord {
  id: number;
  equipment_id: number;
  maintenance_type: 'routine' | 'repair' | 'calibration' | 'inspection';
  maintenance_date: string;
  next_maintenance_date?: string;
  performed_by: string;
  cost?: number;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier: Supplier;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: 'pending' | 'approved' | 'ordered' | 'in_transit' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  items: PurchaseOrderItem[];
  notes?: string;
}

interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  item_id?: number;
  item_name: string;
  item_sku?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
  notes?: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  payment_terms?: string;
  lead_time_days?: number;
  status: 'active' | 'inactive';
  rating?: number;
  notes?: string;
}

interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  critical_items: number;
  total_value: number;
  waste_this_month: number;
  category_distribution: Record<string, number>;
  stock_status_distribution: Record<string, number>;
}
```

## Security Considerations

### Multi-Tenant Isolation
1. **Database Level:** All inventory tables in tenant-specific schemas
2. **API Level:** Validate X-Tenant-ID header on every request
3. **Query Level:** All queries automatically scoped to tenant schema

### Permission Requirements
- `inventory:read` - View inventory items
- `inventory:write` - Create/update inventory items
- `inventory:admin` - Delete items, manage suppliers
- `purchase_orders:read` - View purchase orders
- `purchase_orders:write` - Create/update purchase orders
- `purchase_orders:approve` - Approve purchase orders

## Performance Optimization

### Database Indexes
- Primary keys on all tables
- Foreign key indexes
- Composite indexes on (category_id, status)
- Full-text search index on (name, description)

### Caching Strategy
- Cache inventory statistics for 5 minutes
- Cache category list indefinitely (rarely changes)
- Invalidate item cache on stock adjustments

### Query Optimization
- Use pagination for large result sets
- Limit JOIN operations
- Use aggregate queries for statistics
- Implement database connection pooling

## Migration Plan

### Phase 1: Database Schema (Week 1)
1. Create tenant schema tables
2. Seed category data
3. Create indexes
4. Test schema in all tenant schemas

### Phase 2: Backend API (Week 2)
1. Implement inventory service
2. Implement equipment service
3. Implement purchase order service
4. Implement supplier service
5. Add permission checks
6. Write unit tests

### Phase 3: Frontend Integration (Week 3)
1. Create custom hooks
2. Update inventory pages
3. Update equipment pages
4. Update purchase order pages
5. Implement loading/error states

### Phase 4: Testing & Deployment (Week 4)
1. Integration testing
2. Security audit
3. Performance testing
4. User acceptance testing
5. Production deployment
