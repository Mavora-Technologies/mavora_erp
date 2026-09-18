// packages/database/src/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the Neon HTTP client
const sql = neon(databaseUrl);

// Export the initialized Drizzle instance
export const db = drizzle(sql, { schema });

// Re-export individual schema items directly (e.g., import { customers } from '@mavora/database')
export * from './schema';

// Re-export the schema namespace (e.g., import { schema } from '@mavora/database')
export { schema };