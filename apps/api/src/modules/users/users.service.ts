import { db, users } from '@mavora/database';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export interface UpdateProfileInput {
  userId: string;
  fullName?: string;
  phone?: string;
  notifications?: { emailAlerts: boolean; systemDigest: boolean };
  currentPassword?: string;
  newPassword?: string;
}

export class UsersService {
  async updateProfile(data: UpdateProfileInput) {
    const { userId, fullName, phone, notifications, currentPassword, newPassword } = data;

    // 1. Fetch the existing user
    const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!userRecords.length) {
      throw { status: 404, message: 'User not found' };
    }
    
    const user = userRecords[0];
    const updatePayload: any = { updatedAt: new Date() };

    // 2. Map standard profile fields to match your schema properties
    if (fullName !== undefined) {
      const parts = fullName.trim().split(' ');
      updatePayload.firstName = parts[0] || '';
      updatePayload.lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    }
    
    // Note: If 'phone' and 'notifications' are not yet defined in your 
    // Drizzle users schema, comment these two lines out to prevent further TS errors.
    if (phone !== undefined) updatePayload.phone = phone;
    if (notifications !== undefined) updatePayload.notifications = notifications;

    // 3. Handle Password Update Securely
    if (newPassword) {
      if (!currentPassword) {
        throw { status: 400, message: 'Current password is required to set a new password.' };
      }
      
      // Verify current password matches the DB hash
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isMatch) {
        throw { status: 400, message: 'The current password provided is incorrect.' };
      }

      // Hash the new password before saving to the correct schema property
      updatePayload.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // 4. Save to Database
    const updated = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, userId))
      .returning();

    // 5. Remove sensitive data before returning to the frontend
    const { passwordHash, ...safeUser } = updated[0];
    return safeUser;
  }
}

export const usersService = new UsersService();