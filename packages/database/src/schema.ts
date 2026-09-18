import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

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