import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  // Parse CORS origins from environment variable
  // Supports comma-separated list: "https://app1.com,https://app2.com"
  // Or single origin: "https://app.com"
  // Or "*" for all origins
  const corsOrigins = process.env.CORS_ORIGINS || '*';
  const origins = corsOrigins === '*' 
    ? '*' 
    : corsOrigins.split(',').map(origin => origin.trim()).filter(Boolean);

  return {
    baseUrl: process.env.BASE_URL,
    cors: {
      origins,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  };
});
