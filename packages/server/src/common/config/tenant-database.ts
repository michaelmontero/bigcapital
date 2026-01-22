import * as path from 'path';
import { registerAs } from '@nestjs/config';

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 3306,
      user: parsed.username,
      password: parsed.password || undefined,
    };
  } catch {
    return null;
  }
}

export default registerAs('tenantDatabase', () => {
  // Uses DATABASE_URL (same server, different database names per tenant)
  // Tenants are created as separate databases: bigcapital_tenant_{organizationId}
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  if (!parsed) {
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }

  return {
    client: 'mysql',
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    dbNamePrefix: process.env.TENANT_DB_NAME_PERFIX || 'bigcapital_tenant_',
    migrationsDir: path.join(__dirname, '../../database/tenant/migrations'),
    seedsDir: path.join(__dirname, '../../database/tenant/seeds/core'),
  };
});
