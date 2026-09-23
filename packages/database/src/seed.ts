// packages/database/src/seed.ts
import { db } from './index.js';
import { roles, users } from './schema.js';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const TEAM_USERS = [
  {
    firstName: 'Valary',
    lastName: 'Femy',
    oldEmail: 'valary.femy@mavora.com',
    newEmail: 'valary@mavoratechnologies.com',
  },
  {
    firstName: 'Noreen',
    lastName: 'Olindi',
    oldEmail: 'noreen.olindi@mavora.com',
    newEmail: 'noreen@mavoratechnologies.com',
  },
  {
    firstName: 'Saum',
    lastName: 'Ndeda',
    oldEmail: 'saum.ndeda@mavora.com',
    newEmail: 'saumu@mavoratechnologies.com',
  },
  {
    firstName: 'Jacob',
    lastName: 'Mogire',
    oldEmail: 'jacob.mogire@mavora.com',
    newEmail: 'jacob@mavoratechnologies.com',
  },
  {
    firstName: 'Mohamed',
    lastName: 'Khalif',
    oldEmail: 'mohamed.khalif@mavora.com',
    newEmail: 'mohamed@mavoratechnologies.com',
  },
];

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
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (existingAdmin.length === 0) {
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

  // 3. Seed / Update Team Members
  const defaultPasswordHash = await bcrypt.hash('Mavora@26!', 10);

  for (const user of TEAM_USERS) {
    // Check if user exists by either new or old email
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.email, user.newEmail), eq(users.email, user.oldEmail)))
      .limit(1);

    if (existing.length === 0) {
      // Insert new user
      await db.insert(users).values({
        email: user.newEmail,
        passwordHash: defaultPasswordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: roleId,
        isActive: true,
      });
      console.log(`[Seeder] Created user: ${user.newEmail}`);
    } else {
      // Update existing record (migrates email if still on old domain)
      await db
        .update(users)
        .set({
          email: user.newEmail,
          passwordHash: defaultPasswordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: true,
        })
        .where(eq(users.id, existing[0].id));
      console.log(`[Seeder] Updated user: ${user.newEmail}`);
    }
  }

  console.log('[Seeder] Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seeder Error]:', err);
  process.exit(1);
});