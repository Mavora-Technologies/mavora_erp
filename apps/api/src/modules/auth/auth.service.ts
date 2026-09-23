// apps/api/src/modules/auth/auth.service.ts
import { db, schema } from '@mavora/database';
import { eq } from 'drizzle-orm';
import { comparePassword } from '../../utils/hash.util.js';
import { generateToken } from '../../utils/jwt.util.js';

export class AuthService {
  async login(credentials: { email?: string; password?: string }) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw { status: 400, message: 'Email and password are required' };
    }

    // 1. Join users with roles to fetch actual role details
    const userResult = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        passwordHash: schema.users.passwordHash,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        isActive: schema.users.isActive,
        roleId: schema.users.roleId,
        roleName: schema.roles.name,
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.email, email))
      .limit(1);

    const user = userResult[0];

    // 2. Verify existence and status
    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }
    if (!user.isActive) {
      throw { status: 403, message: 'Account is deactivated' };
    }

    // 3. Verify password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    // 4. Update last login timestamp
    await db
      .update(schema.users)
      .set({ lastLogin: new Date() })
      .where(eq(schema.users.id, user.id));

    // 5. Generate Token containing essential user IDs
    const token = generateToken({ userId: user.id, roleId: user.roleId });

    // 6. Return standard user metadata payload
    const fullName = `${user.firstName} ${user.lastName}`.trim();

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: fullName,
        role: user.roleName || 'EMPLOYEE',
        roleId: user.roleId,
      },
    };
  }
}

export const authService = new AuthService();