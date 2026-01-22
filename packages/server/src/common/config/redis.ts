import { registerAs } from '@nestjs/config';

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) || 0 : 0,
    };
  } catch {
    return null;
  }
}

export default registerAs('redis', () => {
  // Support REDIS_URL (Railway standard format: redis://:password@host:port)
  if (process.env.REDIS_URL) {
    const parsed = parseRedisUrl(process.env.REDIS_URL);
    if (parsed) {
      return parsed;
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  };
});
