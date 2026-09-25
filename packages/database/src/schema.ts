// packages/database/src/schema.ts
import { pgTable, uuid, varchar, timestamp, boolean, text, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Reusable timestamp fields for consistent audit logging
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

// ============================================================================
// ENUMS
// ============================================================================

export const inventoryTypeEnum = pgEnum('inventory_type', ['ASSET', 'STOCK', 'CONSUMABLE', 'SERVICE', 'SOFTWARE', 'OTHER']);
export const assetStatusEnum = pgEnum('asset_status', ['AVAILABLE', 'ASSIGNED', 'IN_USE', 'RESERVED', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'DAMAGED', 'LOST', 'TRANSFERRED', 'RETIRED', 'DISPOSED']);
export const assetConditionEnum = pgEnum('asset_condition', ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'UNUSABLE']);
export const movementTypeEnum = pgEnum('movement_type', ['OPENING_BALANCE', 'PURCHASE_RECEIPT', 'STOCK_RECEIPT', 'STOCK_ISSUE', 'ASSET_ALLOCATION', 'ASSET_RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'DAMAGE', 'LOSS', 'DISPOSAL', 'CORRECTION']);
export const stockTransferStatusEnum = pgEnum('stock_transfer_status', ['DRAFT', 'REQUESTED', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'COMPLETED', 'CANCELLED']);
export const inventoryRequestStatusEnum = pgEnum('inventory_request_status', ['REQUESTED', 'MANAGER_REVIEW', 'APPROVED', 'FULFILLED', 'ISSUED', 'REJECTED', 'CANCELLED']);
export const reservationStatusEnum = pgEnum('reservation_status', ['RESERVED', 'RELEASED', 'FULFILLED', 'EXPIRED', 'CANCELLED']);

// ============================================================================
// 1. LEGACY TABLES (Preserved & Typed Correctly)
// ============================================================================

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  ...timestamps,
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  ...timestamps,
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  ...timestamps,
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  ...timestamps,
});

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  status: varchar('status', { length: 50 }).default('Active').notNull(),
  lifecycleStage: varchar('lifecycle_stage', { length: 50 }).default('Lead').notNull(),
  ...timestamps,
});

export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  value: integer('value').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  stage: varchar('stage', { length: 50 }).default('Discovery').notNull(),
  probability: integer('probability').default(20),
  expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
  notes: text('notes'),
  ...timestamps,
});

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  location: text('location').default('Nairobi HQ').notNull(),
  department: text('department').default('Operations').notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  reorderLevel: integer('reorder_level').default(5).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').references(() => suppliers.id).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  poNumber: text('po_number').notNull().unique(),
  status: text('status').default('Draft').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  expectedDate: timestamp('expected_date', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  purchaseOrderId: text('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketNumber: text('ticket_number').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('OPEN').notNull(),
  priority: text('priority').default('MEDIUM').notNull(),
  ticketType: text('ticket_type').default('CLIENT').notNull(),
  source: text('source').default('WEBSITE').notNull(),
  clientName: text('client_name'),
  companyName: text('company_name'),
  category: text('category').default('Software Development').notNull(),
  location: text('location').default('Nairobi HQ').notNull(),
  department: text('department').default('Client Services').notNull(),
  requesterName: text('requester_name').notNull(),
  assignee: text('assignee').default('Unassigned'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  ...timestamps,
});

export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  employeeNumber: varchar('employee_number', { length: 50 }).notNull().unique(),
  jobTitle: varchar('job_title', { length: 100 }).notNull(),
  employmentType: varchar('employment_type', { length: 50 }).default('Full-Time').notNull(),
  hireDate: timestamp('hire_date', { withTimezone: true }).notNull(),
  salary: decimal('salary', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 50 }).default('Active').notNull(),
  ...timestamps,
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).default('Pending').notNull(),
  approvedBy: uuid('approved_by').references(() => users.id),
  ...timestamps,
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  managerId: uuid('manager_id').references(() => users.id),
  status: varchar('status', { length: 50 }).default('Planning').notNull(),
  priority: varchar('priority', { length: 50 }).default('Medium').notNull(),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  startDate: timestamp('start_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  ...timestamps,
});

export const projectTasks = pgTable('project_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('To Do').notNull(),
  priority: varchar('priority', { length: 50 }).default('Medium').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  dueDate: timestamp('due_date', { withTimezone: true }),
  ...timestamps,
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('Draft').notNull(),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  notes: text('notes'),
  ...timestamps,
});

export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull().default('Mavora Enterprise'),
  supportEmail: varchar('support_email', { length: 255 }).default('support@mavora.io'),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  currency: varchar('currency', { length: 10 }).default('USD'),
  taxRate: varchar('tax_rate', { length: 10 }).default('0.00'),
  moduleFlags: jsonb('module_flags').default({ crm: true, projects: true, finance: true }).notNull(),
  ...timestamps,
});

// ============================================================================
// 2. ENTERPRISE INVENTORY & ASSET EXPANSION TABLES
// ============================================================================

export const inventoryCategories = pgTable('inventory_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  description: text('description'),
  inventoryType: inventoryTypeEnum('inventory_type').default('STOCK').notNull(),
  isSerialized: boolean('is_serialized').default(false).notNull(),
  isConsumable: boolean('is_consumable').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const inventorySubcategories = pgTable('inventory_subcategories', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => inventoryCategories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const inventoryLocations = pgTable('inventory_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentLocationId: uuid('parent_location_id'), // Self reference for hierarchical structure
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  locationType: text('location_type').notNull(), // COMPANY, BRANCH, BUILDING, FLOOR, ROOM, STORE
  address: text('address'),
  description: text('description'),
  managerId: uuid('manager_id').references(() => employees.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const inventoryLocationZones = pgTable('inventory_location_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  locationId: uuid('location_id').references(() => inventoryLocations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  ...timestamps,
});

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }), // Backwards compatibility linkage
  sku: text('sku').unique().notNull(),
  itemCode: text('item_code'),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => inventoryCategories.id),
  subcategoryId: uuid('subcategory_id').references(() => inventorySubcategories.id),
  
  inventoryType: inventoryTypeEnum('inventory_type').default('STOCK').notNull(),
  isSerialized: boolean('is_serialized').default(false).notNull(),
  isConsumable: boolean('is_consumable').default(false).notNull(),
  
  manufacturer: text('manufacturer'),
  brand: text('brand'),
  model: text('model'),
  unitOfMeasure: text('unit_of_measure').default('PCS').notNull(),
  
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(),
  standardCost: decimal('standard_cost', { precision: 12, scale: 2 }),
  lastPurchasePrice: decimal('last_purchase_price', { precision: 12, scale: 2 }),
  averageCost: decimal('average_cost', { precision: 12, scale: 2 }),
  
  quantityOnHand: integer('quantity_on_hand').default(0).notNull(),
  quantityAvailable: integer('quantity_available').default(0).notNull(),
  quantityReserved: integer('quantity_reserved').default(0).notNull(),
  quantityAllocated: integer('quantity_allocated').default(0).notNull(),
  quantityDamaged: integer('quantity_damaged').default(0).notNull(),
  quantityInRepair: integer('quantity_in_repair').default(0).notNull(),
  
  minimumStock: integer('minimum_stock').default(0).notNull(),
  reorderLevel: integer('reorder_level').default(5).notNull(),
  maximumStock: integer('maximum_stock'),
  reorderQuantity: integer('reorder_quantity'),
  
  defaultLocationId: uuid('default_location_id').references(() => inventoryLocations.id),
  defaultDepartmentId: uuid('default_department_id').references(() => departments.id),
  defaultSupplierId: text('default_supplier_id').references(() => suppliers.id),
  
  barcode: text('barcode'),
  qrCode: text('qr_code'),
  status: text('status').default('ACTIVE').notNull(),
  ...timestamps,
});

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  
  assetTag: text('asset_tag').unique().notNull(),
  serialNumber: text('serial_number'),
  barcode: text('barcode'),
  qrCode: text('qr_code'),
  
  manufacturer: text('manufacturer'),
  model: text('model'),
  configuration: text('configuration'),
  
  purchaseOrderId: text('purchase_order_id').references(() => purchaseOrders.id),
  purchaseOrderItemId: text('purchase_order_item_id').references(() => purchaseOrderItems.id),
  supplierId: text('supplier_id').references(() => suppliers.id),
  
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  acquisitionCost: decimal('acquisition_cost', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('KES').notNull(),
  
  warrantyStartDate: timestamp('warranty_start_date', { withTimezone: true }),
  warrantyEndDate: timestamp('warranty_end_date', { withTimezone: true }),
  
  currentLocationId: uuid('current_location_id').references(() => inventoryLocations.id),
  currentDepartmentId: uuid('current_department_id').references(() => departments.id),
  currentEmployeeId: uuid('current_employee_id').references(() => employees.id),
  
  condition: assetConditionEnum('condition').default('NEW').notNull(),
  status: assetStatusEnum('status').default('AVAILABLE').notNull(),
  
  usefulLifeMonths: integer('useful_life_months'),
  depreciationMethod: text('depreciation_method').default('STRAIGHT_LINE'),
  salvageValue: decimal('salvage_value', { precision: 12, scale: 2 }),
  currentBookValue: decimal('current_book_value', { precision: 12, scale: 2 }),
  
  notes: text('notes'),
  createdById: uuid('created_by_id').references(() => users.id),
  updatedById: uuid('updated_by_id').references(() => users.id),
  ...timestamps,
});

export const assetAssignments = pgTable('asset_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  locationId: uuid('location_id').references(() => inventoryLocations.id),
  
  assignedById: uuid('assigned_by_id').references(() => users.id).notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  returnedById: uuid('returned_by_id').references(() => users.id),
  
  conditionAtAssignment: assetConditionEnum('condition_at_assignment'),
  conditionAtReturn: assetConditionEnum('condition_at_return'),
  
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  
  notes: text('notes'),
  ...timestamps,
});

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  movementType: movementTypeEnum('movement_type').notNull(),
  
  quantity: integer('quantity').notNull(),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }),
  
  fromLocationId: uuid('from_location_id').references(() => inventoryLocations.id),
  toLocationId: uuid('to_location_id').references(() => inventoryLocations.id),
  fromDepartmentId: uuid('from_department_id').references(() => departments.id),
  toDepartmentId: uuid('to_department_id').references(() => departments.id),
  
  referenceType: text('reference_type'), // PO_RECEIPT, ISSUE, TRANSFER, ADJUSTMENT
  referenceId: text('reference_id'),
  
  performedById: uuid('performed_by_id').references(() => users.id).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stockReceipts = pgTable('stock_receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  receiptNumber: text('receipt_number').unique().notNull(),
  purchaseOrderId: text('purchase_order_id').references(() => purchaseOrders.id),
  supplierId: text('supplier_id').references(() => suppliers.id),
  invoiceNumber: text('invoice_number'),
  deliveryNote: text('delivery_note'),
  receivedDate: timestamp('received_date', { withTimezone: true }).defaultNow().notNull(),
  receivedById: uuid('received_by_id').references(() => users.id).notNull(),
  locationId: uuid('location_id').references(() => inventoryLocations.id),
  status: text('status').default('COMPLETED').notNull(),
  notes: text('notes'),
  ...timestamps,
});

export const stockReceiptItems = pgTable('stock_receipt_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  stockReceiptId: uuid('stock_receipt_id').references(() => stockReceipts.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  purchaseOrderItemId: text('purchase_order_item_id').references(() => purchaseOrderItems.id),
  quantityOrdered: integer('quantity_ordered').notNull(),
  quantityReceived: integer('quantity_received').notNull(),
  quantityRejected: integer('quantity_rejected').default(0).notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }).notNull(),
  condition: text('condition'),
  notes: text('notes'),
  ...timestamps,
});

export const stockIssues = pgTable('stock_issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  issueNumber: text('issue_number').unique().notNull(),
  requesterId: uuid('requester_id').references(() => users.id),
  approverId: uuid('approver_id').references(() => users.id),
  departmentId: uuid('department_id').references(() => departments.id),
  locationId: uuid('location_id').references(() => inventoryLocations.id),
  projectId: uuid('project_id').references(() => projects.id),
  issueType: text('issue_type').default('EMPLOYEE').notNull(), // EMPLOYEE, DEPARTMENT, PROJECT, INTERNAL
  purpose: text('purpose'),
  issuedById: uuid('issued_by_id').references(() => users.id).notNull(),
  receivedById: uuid('received_by_id').references(() => employees.id),
  issuedDate: timestamp('issued_date', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  ...timestamps,
});

export const stockIssueItems = pgTable('stock_issue_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  stockIssueId: uuid('stock_issue_id').references(() => stockIssues.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  notes: text('notes'),
  ...timestamps,
});

export const stockTransfers = pgTable('stock_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  transferNumber: text('transfer_number').unique().notNull(),
  fromLocationId: uuid('from_location_id').references(() => inventoryLocations.id).notNull(),
  toLocationId: uuid('to_location_id').references(() => inventoryLocations.id).notNull(),
  fromDepartmentId: uuid('from_department_id').references(() => departments.id),
  toDepartmentId: uuid('to_department_id').references(() => departments.id),
  requestedById: uuid('requested_by_id').references(() => users.id).notNull(),
  approvedById: uuid('approved_by_id').references(() => users.id),
  dispatchedById: uuid('dispatched_by_id').references(() => users.id),
  receivedById: uuid('received_by_id').references(() => users.id),
  status: stockTransferStatusEnum('status').default('DRAFT').notNull(),
  dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  notes: text('notes'),
  ...timestamps,
});

export const stockTransferItems = pgTable('stock_transfer_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  stockTransferId: uuid('stock_transfer_id').references(() => stockTransfers.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  assetId: uuid('asset_id').references(() => assets.id),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  ...timestamps,
});

export const inventoryReservations = pgTable('inventory_reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  reservationNumber: text('reservation_number').unique().notNull(),
  requesterId: uuid('requester_id').references(() => users.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  projectId: uuid('project_id').references(() => projects.id),
  reservedUntil: timestamp('reserved_until', { withTimezone: true }).notNull(),
  status: reservationStatusEnum('status').default('RESERVED').notNull(),
  purpose: text('purpose'),
  ...timestamps,
});

export const inventoryReservationItems = pgTable('inventory_reservation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  reservationId: uuid('reservation_id').references(() => inventoryReservations.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  ...timestamps,
});

export const inventoryRequests = pgTable('inventory_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestNumber: text('request_number').unique().notNull(),
  requesterId: uuid('requester_id').references(() => users.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  approverId: uuid('approver_id').references(() => users.id),
  status: inventoryRequestStatusEnum('status').default('REQUESTED').notNull(),
  reason: text('reason'),
  ...timestamps,
});

export const inventoryRequestItems = pgTable('inventory_request_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => inventoryRequests.id, { onDelete: 'cascade' }).notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  quantityApproved: integer('quantity_approved').default(0).notNull(),
  ...timestamps,
});

export const assetMaintenance = pgTable('asset_maintenance', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  maintenanceType: text('maintenance_type').notNull(), // PREVENTIVE, REPAIR, INSPECTION, OVERHAUL
  description: text('description'),
  serviceProvider: text('service_provider'),
  technician: text('technician'),
  maintenanceDate: timestamp('maintenance_date', { withTimezone: true }).notNull(),
  cost: decimal('cost', { precision: 12, scale: 2 }).default('0.00').notNull(),
  currency: text('currency').default('KES').notNull(),
  status: text('status').default('COMPLETED').notNull(),
  nextMaintenanceDate: timestamp('next_maintenance_date', { withTimezone: true }),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdById: uuid('created_by_id').references(() => users.id),
  ...timestamps,
});

export const assetWarranties = pgTable('asset_warranties', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  warrantyNumber: text('warranty_number'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  coverage: text('coverage'),
  terms: text('terms'),
  contact: text('contact'),
  status: text('status').default('ACTIVE').notNull(),
  ...timestamps,
});

export const assetDocuments = pgTable('asset_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  documentType: text('document_type').notNull(), // INVOICE, WARRANTY, DELIVERY_NOTE, MAINTENANCE, HANDOVER, DISPOSAL
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  uploadedById: uuid('uploaded_by_id').references(() => users.id),
  ...timestamps,
});

export const assetDisposals = pgTable('asset_disposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  disposalNumber: text('disposal_number').unique().notNull(),
  proposedById: uuid('proposed_by_id').references(() => users.id).notNull(),
  approvedById: uuid('approved_by_id').references(() => users.id),
  disposedById: uuid('disposed_by_id').references(() => users.id),
  disposalDate: timestamp('disposal_date', { withTimezone: true }),
  status: text('status').default('PROPOSED').notNull(),
  reason: text('reason'),
  ...timestamps,
});

export const assetDisposalItems = pgTable('asset_disposal_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  disposalId: uuid('disposal_id').references(() => assetDisposals.id, { onDelete: 'cascade' }).notNull(),
  assetId: uuid('asset_id').references(() => assets.id).notNull(),
  bookValue: decimal('book_value', { precision: 12, scale: 2 }),
  disposalValue: decimal('disposal_value', { precision: 12, scale: 2 }),
  disposalMethod: text('disposal_method'), // SOLD, SCRAPPED, DONATED, RECYCLED
  condition: text('condition'),
  notes: text('notes'),
  ...timestamps,
});

export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id: uuid('id').defaultRandom().primaryKey(),
  adjustmentNumber: text('adjustment_number').unique().notNull(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id).notNull(),
  locationId: uuid('location_id').references(() => inventoryLocations.id),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  adjustmentQuantity: integer('adjustment_quantity').notNull(),
  reason: text('reason').notNull(),
  performedById: uuid('performed_by_id').references(() => users.id).notNull(),
  ...timestamps,
});

export const assetAuditLogs = pgTable('asset_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  reason: text('reason'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inventoryAlerts = pgTable('inventory_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  severity: text('severity').default('WARNING').notNull(), // CRITICAL, WARNING, INFO
  entityType: text('entity_type').notNull(), // INVENTORY_ITEM, ASSET, WARRANTY, MAINTENANCE
  entityId: text('entity_id').notNull(),
  message: text('message').notNull(),
  status: text('status').default('OPEN').notNull(), // OPEN, RESOLVED, DISMISSED
  resolvedById: uuid('resolved_by_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});