# Inventory Management Integration - Implementation Tasks

## Overview

This implementation plan converts the Inventory Management frontend from mock data to real backend integration with secure multi-tenant isolation. The plan includes creating database schemas, backend APIs, and frontend integration for managing medical supplies, equipment, purchase orders, and suppliers.

## Task Breakdown

### Phase 1: Database Schema Creation

- [ ] 1. Create Inventory Database Schema
  - Create `inventory_items` table in tenant schemas
  - Create `inventory_categories` table with seed data
  - Create `inventory_transactions` table for stock movements
  - Create `equipment_maintenance` table for maintenance tracking
  - Create `suppliers` table for vendor management
  - Create `purchase_orders` table for procurement
  - Create `purchase_order_items` table for order line items
  - Add all necessary indexes for performance
  - _Requirements: 1.1, 1.2, 2.1, 4.1, 5.1, 6.1_

- [ ] 1.1 Create Migration Script
  - Create migration file for inventory schema
  - Include all table definitions
  - Include seed data for categories
  - Include index creation
  - Test migration on development database
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Apply Schema to All Tenant Schemas
  - Run migration on all existing tenant schemas
  - Verify tables created successfully
  - Verify indexes created
  - Verify foreign key constraints
  - Test with sample data
  - _Requirements: 1.1, 8.1, 8.2_

### Phase 2: Backend API - Inventory Items

- [ ] 2. Create Inventory Service Layer
  - Create `backend/src/services/inventoryService.ts`
  - Implement `getInventoryItems()` with filtering and pagination
  - Implement `getInventoryItem()` with tenant validation
  - Implement `createInventoryItem()` with validation
  - Implement `updateInventoryItem()` with tenant check
  - Implement `deleteInventoryItem()` with tenant check
  - Implement `adjustStock()` for stock movements
  - Implement `getInventoryStats()` for dashboard metrics
  - Calculate stock status (optimal, low_stock, critical, overstock)
  - Calculate total inventory value
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 2.1 Create Inventory Routes
  - Create `backend/src/routes/inventory.ts`
  - Implement `GET /api/inventory` with filters
  - Implement `GET /api/inventory/:id` with tenant validation
  - Implement `GET /api/inventory/stats` for statistics
  - Implement `POST /api/inventory` with validation
  - Implement `PUT /api/inventory/:id` with tenant check
  - Implement `DELETE /api/inventory/:id` with tenant check
  - Implement `POST /api/inventory/:id/adjust` for stock adjustments
  - Add permission middleware (inventory:read, inventory:write, inventory:admin)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2.2 Implement Stock Status Calculation
  - Calculate stock status based on current_stock vs min/max levels
  - Mark items as "Low Stock" when below minimum
  - Mark items as "Critical" when below 50% of minimum
  - Mark items as "Overstock" when above maximum
  - Mark items as "Optimal" when within range
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.3 Implement Expiry Date Tracking
  - Calculate days until expiry
  - Mark items as "Expiring Soon" when < 30 days
  - Mark items as "Expired" when past expiry date
  - Include expired items in waste calculation
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 2.4 Implement Reorder Suggestions
  - Calculate average usage rate from transaction history
  - Generate reorder suggestions when stock reaches reorder point
  - Calculate recommended reorder quantity
  - Consider supplier lead time in calculations
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

### Phase 3: Backend API - Equipment Management

- [ ] 3. Create Equipment Service Layer
  - Create `backend/src/services/equipmentService.ts`
  - Implement `getEquipment()` with maintenance status
  - Implement `getEquipmentItem()` with maintenance history
  - Implement `logMaintenance()` for maintenance records
  - Calculate maintenance status (current, upcoming, overdue)
  - Calculate days until next maintenance
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.1 Create Equipment Routes
  - Create `backend/src/routes/equipment.ts`
  - Implement `GET /api/equipment` with filters
  - Implement `GET /api/equipment/:id` with maintenance history
  - Implement `POST /api/equipment/:id/maintenance` for logging maintenance
  - Add permission middleware
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

### Phase 4: Backend API - Purchase Orders

- [ ] 4. Create Purchase Order Service Layer
  - Create `backend/src/services/purchaseOrderService.ts`
  - Implement `getPurchaseOrders()` with filtering
  - Implement `getPurchaseOrder()` with items
  - Implement `createPurchaseOrder()` with validation
  - Implement `updatePurchaseOrder()` with status validation
  - Implement `deliverPurchaseOrder()` to update inventory
  - Validate status transitions (Pending → Approved → In Transit → Delivered)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.1 Create Purchase Order Routes
  - Create `backend/src/routes/purchaseOrders.ts`
  - Implement `GET /api/purchase-orders` with filters
  - Implement `GET /api/purchase-orders/:id` with items
  - Implement `POST /api/purchase-orders` with validation
  - Implement `PUT /api/purchase-orders/:id` with status validation
  - Implement `POST /api/purchase-orders/:id/deliver` to update inventory
  - Add permission middleware (purchase_orders:read, purchase_orders:write, purchase_orders:approve)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 4.2 Implement Automatic Stock Updates
  - When order is delivered, update inventory stock levels
  - Create inventory transactions for each item
  - Update last_restocked_date
  - Recalculate stock status
  - _Requirements: 5.5, 12.1, 12.2, 12.3, 12.4, 12.5_

### Phase 5: Backend API - Suppliers

- [ ] 5. Create Supplier Service Layer
  - Create `backend/src/services/supplierService.ts`
  - Implement `getSuppliers()` with filtering
  - Implement `getSupplier()` with tenant validation
  - Implement `createSupplier()` with validation
  - Implement `updateSupplier()` with tenant check
  - Implement `deactivateSupplier()` (soft delete)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5.1 Create Supplier Routes
  - Create `backend/src/routes/suppliers.ts`
  - Implement `GET /api/suppliers` with filters
  - Implement `GET /api/suppliers/:id` with tenant validation
  - Implement `POST /api/suppliers` with validation
  - Implement `PUT /api/suppliers/:id` with tenant check
  - Implement `DELETE /api/suppliers/:id` (soft delete)
  - Add permission middleware
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5_

### Phase 6: Backend API - Security & Performance

- [ ] 6. Implement Multi-Tenant Security
  - Verify X-Tenant-ID header on all requests
  - Validate tenant exists and is active
  - Filter all queries by tenant schema
  - Log cross-tenant access attempts
  - Return appropriate error codes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.1 Implement Permission-Based Access Control
  - Add `requirePermission('inventory', 'read')` middleware
  - Add `requirePermission('inventory', 'write')` middleware
  - Add `requirePermission('inventory', 'admin')` middleware
  - Add `requirePermission('purchase_orders', 'read')` middleware
  - Add `requirePermission('purchase_orders', 'write')` middleware
  - Add `requirePermission('purchase_orders', 'approve')` middleware
  - Return 403 with INSUFFICIENT_PERMISSIONS code
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6.2 Implement Performance Optimizations
  - Add pagination support with page/limit parameters
  - Return pagination metadata (total, pages, current page)
  - Use indexed queries on tenant_id, sku, category, status
  - Optimize JOIN queries
  - Ensure <200ms response time for queries under 1000 records
  - Ensure <500ms for statistics calculation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 6.3 Implement Error Handling
  - Use consistent error format (error, code, message, timestamp)
  - Handle missing tenant ID (400, MISSING_TENANT_ID)
  - Handle invalid tenant ID (404, INVALID_TENANT_ID)
  - Handle cross-tenant access (403, CROSS_TENANT_ACCESS_DENIED)
  - Handle item not found (404, ITEM_NOT_FOUND)
  - Handle insufficient permissions (403, INSUFFICIENT_PERMISSIONS)
  - Handle validation errors (400, VALIDATION_ERROR)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

### Phase 7: Frontend API Integration

- [ ] 7. Create Frontend API Client
  - Create `hospital-management-system/lib/api/inventory.ts`
  - Configure axios instance with base URL
  - Add request interceptor for auth headers
  - Add response interceptor for error handling
  - Implement retry logic for network errors
  - _Requirements: 8.4, 8.5, 11.3_

- [ ] 7.1 Create TypeScript Interfaces
  - Create `hospital-management-system/types/inventory.ts`
  - Define InventoryItem interface
  - Define InventoryTransaction interface
  - Define Equipment interface
  - Define MaintenanceRecord interface
  - Define PurchaseOrder interface
  - Define PurchaseOrderItem interface
  - Define Supplier interface
  - Define InventoryStats interface
  - Define ApiError interface
  - _Requirements: 1.2, 2.5, 4.4, 5.3, 6.3, 7.4_

- [ ] 7.2 Create Custom React Hooks
  - Create `hospital-management-system/hooks/useInventory.ts` for inventory list
  - Create `hospital-management-system/hooks/useInventoryItem.ts` for single item
  - Create `hospital-management-system/hooks/useInventoryStats.ts` for statistics
  - Create `hospital-management-system/hooks/useEquipment.ts` for equipment list
  - Create `hospital-management-system/hooks/usePurchaseOrders.ts` for orders
  - Create `hospital-management-system/hooks/useSuppliers.ts` for suppliers
  - Create `hospital-management-system/hooks/useInventoryMutations.ts` for create/update/delete
  - Implement loading states
  - Implement error states
  - Implement caching with React Query
  - _Requirements: 1.2, 1.3, 4.1, 4.4, 5.3, 6.3, 7.4, 11.2, 11.3, 11.5_

### Phase 8: Frontend - Inventory Pages

- [ ] 8. Update Main Inventory Page
  - Replace mock data in `app/inventory/page.tsx` with `useInventory()` hook
  - Replace hardcoded statistics with `useInventoryStats()` hook
  - Implement loading states with skeleton screens
  - Implement error states with retry button
  - Implement empty states with appropriate messaging
  - Add category filter dropdown
  - Add status filter dropdown
  - Add search input with debouncing
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.4, 11.2, 11.3, 11.4, 11.5_

- [ ] 8.1 Update Stock Management Page
  - Replace mock data in `app/inventory/stock-management/page.tsx`
  - Implement filtering by status (all, optimal, low, overstock)
  - Implement search functionality
  - Display stock level progress bars
  - Display AI predictions (reorder suggestions)
  - Add stock adjustment functionality
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 12.1, 12.2, 12.3, 14.1, 14.2, 14.3_

- [ ] 8.2 Update Equipment Page
  - Replace mock data in `app/inventory/equipment/page.tsx`
  - Fetch equipment with `useEquipment()` hook
  - Display maintenance status
  - Display last maintenance and next due date
  - Add maintenance logging functionality
  - Highlight overdue maintenance
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8.3 Update Purchase Orders Page
  - Replace mock data in `app/inventory/orders/page.tsx`
  - Fetch orders with `usePurchaseOrders()` hook
  - Display order details with items
  - Add order creation functionality
  - Add order status update functionality
  - Add delivery confirmation functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.4 Create Suppliers Page
  - Update `app/inventory/suppliers/page.tsx`
  - Fetch suppliers with `useSuppliers()` hook
  - Display supplier list with contact information
  - Add supplier creation functionality
  - Add supplier update functionality
  - Add supplier deactivation functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.5 Add Permission-Based UI Controls
  - Check user permissions on page load
  - Hide "Add Item" button if user lacks inventory:write permission
  - Disable edit buttons if user lacks inventory:write permission
  - Hide delete buttons if user lacks inventory:admin permission
  - Show permission denied messages when appropriate
  - _Requirements: 9.1, 9.5_

### Phase 9: Frontend - Forms and Modals

- [ ] 9. Create Inventory Item Form
  - Create inventory item creation modal/page
  - Implement form validation (name, SKU, category, stock levels required)
  - Check for duplicate SKUs within tenant
  - Add category selection dropdown
  - Add supplier selection dropdown
  - Show success/error messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9.1 Create Stock Adjustment Form
  - Create stock adjustment modal
  - Implement transaction type selection (addition, removal, adjustment, expiry)
  - Implement quantity input with validation
  - Add reason text field
  - Show current stock and new stock preview
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 9.2 Create Purchase Order Form
  - Create purchase order creation modal/page
  - Implement supplier selection
  - Implement item selection with quantities
  - Calculate subtotal, tax, shipping, and total
  - Validate required fields
  - Show success/error messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9.3 Create Supplier Form
  - Create supplier creation/edit modal
  - Implement form validation (name, contact email required)
  - Add address fields
  - Add payment terms and lead time fields
  - Show success/error messages
  - _Requirements: 6.1, 6.2, 6.3_

### Phase 10: Frontend - Reports and Analytics

- [ ] 10. Create Inventory Reports Page
  - Update `app/inventory/reports/page.tsx`
  - Implement date range filter
  - Implement category filter
  - Display inventory value trends
  - Display stock movement charts
  - Display waste analysis
  - Add export functionality (CSV/PDF)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 10.1 Implement Error Handling UI
  - Create error boundary component
  - Display user-friendly error messages
  - Show retry button for network errors
  - Show maintenance message for 503 errors
  - Log errors for debugging
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

### Phase 11: Testing & Validation

- [ ] 11. Backend Testing
  - Write unit tests for inventory service functions
  - Test multi-tenant isolation (items from different tenants)
  - Test category filtering
  - Test status filtering
  - Test search functionality
  - Test pagination
  - Test stock adjustment logic
  - Test permission checks
  - Test error scenarios
  - _Requirements: All requirements_

- [ ] 11.1 Frontend Testing
  - Write unit tests for custom hooks
  - Test loading states
  - Test error states
  - Test empty states
  - Test filtering functionality
  - Test search functionality
  - Test permission-based UI controls
  - _Requirements: All requirements_

- [ ] 11.2 Integration Testing
  - Test complete frontend-backend flow
  - Test with multiple tenants
  - Test cross-tenant access prevention
  - Test permission enforcement
  - Test stock adjustment updates
  - Test purchase order delivery updates inventory
  - Test error handling
  - _Requirements: All requirements_

- [ ] 11.3 Security Audit
  - Verify multi-tenant isolation
  - Test cross-tenant access attempts
  - Verify permission enforcement
  - Test SQL injection prevention
  - Test XSS prevention
  - Test rate limiting (if implemented)
  - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 11.4 Performance Testing
  - Test with 1000+ inventory items
  - Test with 100+ purchase orders
  - Verify <200ms response time
  - Verify <500ms statistics calculation
  - Test pagination performance
  - Test search performance
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

### Phase 12: Documentation & Deployment

- [ ] 12. Update Documentation
  - Document API endpoints in backend/docs/
  - Document database schema
  - Document frontend components
  - Document custom hooks usage
  - Document error codes
  - Document security considerations
  - Create user guide for inventory management
  - _Requirements: All requirements_

- [ ] 12.1 Deployment Preparation
  - Review all code changes
  - Run all tests
  - Perform security audit
  - Update environment variables
  - Create deployment checklist
  - _Requirements: All requirements_

- [ ] 12.2 Deployment & Monitoring
  - Deploy database migrations
  - Deploy backend changes
  - Deploy frontend changes
  - Monitor error logs
  - Monitor performance metrics
  - Gather user feedback
  - Fix any issues found
  - _Requirements: All requirements_

## Implementation Notes

### Key Security Considerations

1. **Multi-Tenant Isolation**: All inventory tables in tenant-specific schemas
2. **Permission Checks**: All endpoints verify user has required permissions
3. **Cross-Tenant Protection**: Prevent users from accessing inventory from other tenants
4. **Input Validation**: Validate all inputs to prevent SQL injection and XSS
5. **Transaction Logging**: Log all stock movements for audit trail

### Performance Requirements

1. **Response Time**: <200ms for queries under 1000 records
2. **Statistics**: <500ms for statistics calculation
3. **Pagination**: Support large datasets with efficient pagination
4. **Caching**: Implement frontend caching with 30-second stale time
5. **Indexes**: Use indexes on tenant_id, sku, category, status

### Error Handling Standards

All API errors must follow this format:
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2025-11-14T10:00:00Z"
}
```

Error codes:
- `MISSING_TENANT_ID` (400)
- `INVALID_TENANT_ID` (404)
- `MISSING_AUTH_TOKEN` (401)
- `INVALID_AUTH_TOKEN` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `CROSS_TENANT_ACCESS_DENIED` (403)
- `ITEM_NOT_FOUND` (404)
- `SUPPLIER_NOT_FOUND` (404)
- `ORDER_NOT_FOUND` (404)
- `DUPLICATE_SKU` (409)
- `VALIDATION_ERROR` (400)
- `INVALID_STATUS_TRANSITION` (400)
- `INTERNAL_SERVER_ERROR` (500)

### Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test complete API flows
3. **Security Tests**: Test multi-tenant isolation and permissions
4. **Performance Tests**: Test with large datasets
5. **E2E Tests**: Test complete user workflows

### Rollback Plan

If issues arise:
1. **Database Rollback**: Drop tenant schema tables, no data loss in other systems
2. **Backend Rollback**: Revert to previous version, frontend continues with mock data
3. **Frontend Rollback**: Revert to mock data, backend remains functional

## Success Criteria

- [ ] All inventory data comes from backend API
- [ ] Multi-tenant isolation verified (no cross-tenant access)
- [ ] Permission-based access control working
- [ ] Loading, error, and empty states implemented
- [ ] Search and filtering functional
- [ ] Statistics display real data
- [ ] Stock adjustments update inventory correctly
- [ ] Purchase order delivery updates inventory
- [ ] Equipment maintenance tracking functional
- [ ] Performance requirements met (<200ms, <500ms)
- [ ] All tests passing
- [ ] Security audit passed
- [ ] User feedback positive

## Estimated Timeline

- **Phase 1 (Database)**: 2-3 days
- **Phase 2 (Backend - Inventory)**: 3-4 days
- **Phase 3 (Backend - Equipment)**: 2-3 days
- **Phase 4 (Backend - Purchase Orders)**: 3-4 days
- **Phase 5 (Backend - Suppliers)**: 2-3 days
- **Phase 6 (Backend - Security)**: 2-3 days
- **Phase 7 (Frontend - API)**: 2-3 days
- **Phase 8 (Frontend - Pages)**: 4-5 days
- **Phase 9 (Frontend - Forms)**: 3-4 days
- **Phase 10 (Frontend - Reports)**: 2-3 days
- **Phase 11 (Testing)**: 3-4 days
- **Phase 12 (Deployment)**: 2-3 days

**Total**: 30-40 days (6-8 weeks)

## Dependencies

- ✅ Multi-tenant infrastructure functional
- ✅ Authentication middleware functional
- ✅ Authorization middleware functional
- ✅ Frontend authentication working
- ✅ API client infrastructure ready
- ❌ Inventory database schema (to be created)
- ❌ Inventory backend APIs (to be created)
- ❌ Inventory permissions (to be added to permission system)

## Next Steps

1. Review this implementation plan
2. Start with Phase 1, Task 1 (Database Schema Creation)
3. Test each task before moving to the next
4. Coordinate database, backend, and frontend development
5. Perform thorough testing before deployment
