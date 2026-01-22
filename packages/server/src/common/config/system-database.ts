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
  if (databaseUrl) {
    const parsed = parseDatabaseUrl(databaseUrl);
    if (parsed) {
      return {
        client: 'mysql',
        host: parsed.host,
        port: parsed.port,
        user: parsed.user,
        password: parsed.password,
        databaseName: parsed.databaseName,
        migrationDir: process.env.SYSTEM_DB_MIGRATION_DIR || './src/database/system/migrations',
        seedsDir: process.env.SYSTEM_DB_SEEDS_DIR || './src/database/system/seeds',
      };
    }
  }

  // Fallback to individual environment variables
  return {
    client: 'mysql',
    host: process.env.SYSTEM_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.SYSTEM_DB_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.SYSTEM_DB_USER || process.env.DB_USER,
    password: process.env.SYSTEM_DB_PASSWORD || process.env.DB_PASSWORD,
    databaseName: process.env.SYSTEM_DB_NAME || process.env.DB_NAME,
    migrationDir: process.env.SYSTEM_DB_MIGRATION_DIR || './src/database/system/migrations',
    seedsDir: process.env.SYSTEM_DB_SEEDS_DIR || './src/database/system/seeds',
  };
});
