import { pgTable, uuid, varchar, timestamp, boolean, text, integer, decimal, jsonb } from 'drizzle-orm/pg-core';

// Reusable timestamp fields for audit logging
const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // e.g., 'SUPER_ADMIN', 'EMPLOYEE'
  description: text('description'),
  ...timestamps,
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g., 'USERS_VIEW', 'LEADS_CREATE'
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
  lastLogin: timestamp('last_login'),
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
  status: varchar('status', { length: 50 }).default('Active').notNull(), // Health of the account (Active/Inactive)
  lifecycleStage: varchar('lifecycle_stage', { length: 50 }).default('Lead').notNull(), // The pipeline stage
  ...timestamps,
});

export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(), // e.g., "Q4 Enterprise Licensing"
  value: integer('value').notNull(), // Stored in cents or base currency unit
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  
  // Sales Pipeline Stages
  stage: varchar('stage', { length: 50 }).default('Discovery').notNull(), 
  
  // Win/Loss probability (0-100)
  probability: integer('probability').default(20),
  
  expectedCloseDate: timestamp('expected_close_date'),
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

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').references(() => suppliers.id).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(), // Tracks who created the LPO
  poNumber: text('po_number').notNull().unique(),
  status: text('status').default('Draft').notNull(), // Draft, Sent, Approved, Received, Cancelled
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

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // e.g., IT Equipment, Office Supplies, Hardware
  location: text('location').default('Nairobi HQ').notNull(), // Corporate Location
  department: text('department').default('Operations').notNull(), // Owning Department
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull(), // Procurement Cost in KES
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  reorderLevel: integer('reorder_level').default(5).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketNumber: text('ticket_number').notNull().unique(), // e.g., TKT-2026-1042
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('OPEN').notNull(), // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority: text('priority').default('MEDIUM').notNull(), // LOW, MEDIUM, HIGH, URGENT
  ticketType: text('ticket_type').default('CLIENT').notNull(), // CLIENT or INTERNAL
  source: text('source').default('WEBSITE').notNull(), // PHONE, WEBSITE, WALK_IN, EMAIL
  clientName: text('client_name'), // Name of client / contact person
  companyName: text('company_name'), // Client company name (if applicable)
  category: text('category').default('Software Development').notNull(), // Mavora Service or Internal Category
  location: text('location').default('Nairobi HQ').notNull(),
  department: text('department').default('Client Services').notNull(),
  requesterName: text('requester_name').notNull(), // Person logging/submitting the ticket
  assignee: text('assignee').default('Unassigned'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  departmentId: uuid('department_id').references(() => departments.id).notNull(),
  employeeNumber: varchar('employee_number', { length: 50 }).notNull().unique(),
  jobTitle: varchar('job_title', { length: 100 }).notNull(),
  employmentType: varchar('employment_type', { length: 50 }).default('Full-Time').notNull(), // Full-Time, Part-Time, Contractor
  hireDate: timestamp('hire_date').notNull(),
  salary: decimal('salary', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 50 }).default('Active').notNull(), // Active, On Leave, Terminated
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(), // Annual, Sick, Maternity, Unpaid
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).default('Pending').notNull(), // Pending, Approved, Rejected
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  managerId: uuid('manager_id').references(() => users.id),
  status: varchar('status', { length: 50 }).default('Planning').notNull(), // Planning, In Progress, On Hold, Completed, Cancelled
  priority: varchar('priority', { length: 50 }).default('Medium').notNull(), // Low, Medium, High, Urgent
  budget: decimal('budget', { precision: 12, scale: 2 }),
  startDate: timestamp('start_date'),
  dueDate: timestamp('due_date'),
  ...timestamps,
});

export const projectTasks = pgTable('project_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('To Do').notNull(), // To Do, In Progress, Review, Done
  priority: varchar('priority', { length: 50 }).default('Medium').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  dueDate: timestamp('due_date'),
  ...timestamps,
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('Draft').notNull(), // Draft, Sent, Paid, Overdue, Cancelled
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
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