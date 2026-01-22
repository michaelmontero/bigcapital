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
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required');
  }

  const parsed = parseRedisUrl(process.env.REDIS_URL);
  if (!parsed) {
    throw new Error('Invalid REDIS_URL format. Expected: redis://:password@host:port');
  }

  return parsed;
});
