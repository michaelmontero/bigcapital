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
  // Support DATABASE_URL or TENANT_DATABASE_URL (Railway standard format: mysql://user:password@host:port/database)
  const databaseUrl = process.env.TENANT_DATABASE_URL || process.env.DATABASE_URL;
  if (databaseUrl) {
    const parsed = parseDatabaseUrl(databaseUrl);
    if (parsed) {
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
    }
  }

  // Fallback to individual environment variables
  return {
    client: 'mysql',
    host: process.env.TENANT_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.TENANT_DB_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.TENANT_DB_USER || process.env.DB_USER,
    password: process.env.TENANT_DB_PASSWORD || process.env.DB_PASSWORD,
    dbNamePrefix: process.env.TENANT_DB_NAME_PERFIX || 'bigcapital_tenant_',
    migrationsDir: path.join(__dirname, '../../database/tenant/migrations'),
    seedsDir: path.join(__dirname, '../../database/tenant/seeds/core'),
  };
});
