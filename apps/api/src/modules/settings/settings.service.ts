// apps/api/src/modules/settings/settings.service.ts
import { db, settings } from '@mavora/database';
import { eq } from 'drizzle-orm';

export interface UpdateSettingsInput {
  companyName?: string;
  supportEmail?: string;
  timezone?: string;
  currency?: string;
  taxRate?: string | number;
  moduleFlags?: Record<string, boolean>;
}

export class SettingsService {
  async getSettings() {
    let result = await db.select().from(settings).limit(1);
    
    // If no settings row exists yet, initialize a default one
    if (!result.length) {
      const seeded = await db.insert(settings).values({
        companyName: 'Mavora Enterprise',
        supportEmail: 'support@mavora.io',
        timezone: 'UTC',
        currency: 'USD',
        taxRate: '0.00',
        moduleFlags: { crm: true, projects: true, finance: true },
      }).returning();
      return seeded[0];
    }

    return result[0];
  }

  async updateSettings(data: UpdateSettingsInput) {
    const existing = await this.getSettings();

    const result = await db
      .update(settings)
      .set({
        companyName: data.companyName !== undefined ? data.companyName : existing.companyName,
        supportEmail: data.supportEmail !== undefined ? data.supportEmail : existing.supportEmail,
        timezone: data.timezone !== undefined ? data.timezone : existing.timezone,
        currency: data.currency !== undefined ? data.currency : existing.currency,
        taxRate: data.taxRate !== undefined ? data.taxRate.toString() : existing.taxRate,
        moduleFlags: data.moduleFlags !== undefined ? data.moduleFlags : existing.moduleFlags,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, existing.id))
      .returning();

    if (!result.length) {
      throw { status: 404, message: 'Settings record could not be updated' };
    }

    return result[0];
  }
}

export const settingsService = new SettingsService();