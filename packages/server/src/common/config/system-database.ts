import { registerAs } from '@nestjs/config';

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 3306,
      user: parsed.username,
      password: parsed.password || undefined,
      databaseName: parsed.pathname ? parsed.pathname.slice(1) : undefined,
    };
  } catch {
    return null;
  }
}

export default registerAs('systemDatabase', () => {
  // Support DATABASE_URL or SYSTEM_DATABASE_URL (Railway standard format: mysql://user:password@host:port/database)
  const databaseUrl = process.env.SYSTEM_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or SYSTEM_DATABASE_URL environment variable is required');
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  if (!parsed) {
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }

  return {
    client: 'mysql2',
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    // Use DATABASE_URL database name by default (Railway uses 'railway' by default)
    // Override with SYSTEM_DB_NAME if explicitly set
    databaseName: parsed.databaseName || process.env.SYSTEM_DB_NAME,
    migrationDir: process.env.SYSTEM_DB_MIGRATION_DIR || './src/database/system/migrations',
    seedsDir: process.env.SYSTEM_DB_SEEDS_DIR || './src/database/system/seeds',
  };
});
