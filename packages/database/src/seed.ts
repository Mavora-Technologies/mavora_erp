import { db } from './index.js';
import { roles, users } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('[Seeder] Starting database seeding...');

  // 1. Ensure SUPER_ADMIN role exists
  let superAdminRole = await db.select().from(roles).where(eq(roles.name, 'SUPER_ADMIN')).limit(1);

  let roleId: string;

  if (superAdminRole.length === 0) {
    console.log('[Seeder] Creating SUPER_ADMIN role...');
    const insertedRole = await db.insert(roles).values({
      name: 'SUPER_ADMIN',
      description: 'System-wide administrator with full access privileges.',
    }).returning();
    roleId = insertedRole[0].id;
  } else {
    roleId = superAdminRole[0].id;
    console.log('[Seeder] SUPER_ADMIN role already exists.');
  }

  // 2. Ensure default Super Admin user exists
  const adminEmail = 'admin@mavoratech.com';
  const existingUser = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (existingUser.length === 0) {
    console.log('[Seeder] Creating default Super Admin user...');
    const hashedPassword = await bcrypt.hash('Mavora@2026!', 12);

    await db.insert(users).values({
      email: adminEmail,
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      roleId: roleId,
      isActive: true,
    });
    console.log('[Seeder] Super Admin user created successfully (Email: admin@mavoratech.com / Pass: Mavora@2026!)');
  } else {
    console.log('[Seeder] Super Admin user already exists.');
  }

  console.log('[Seeder] Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seeder Error]:', err);
  process.exit(1);
});