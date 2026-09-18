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

    // 1. Find user
    const userResult = await db
      .select()
      .from(schema.users)
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

    // 4. Update last login (fire and forget)
    await db.update(schema.users).set({ lastLogin: new Date() }).where(eq(schema.users.id, user.id));

    // 5. Generate Token
    const token = generateToken({ userId: user.id, roleId: user.roleId });

    // 6. Return response payload
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId
      }
    };
  }
}

export const authService = new AuthService();