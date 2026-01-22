import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClsMiddleware } from 'nestjs-cls';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import './utils/moment-mysql';
import { AppModule } from './modules/App/App.module';
import { NestExpressApplication } from '@nestjs/platform-express';

global.__public_dirname = path.join(__dirname, '..', 'public');
global.__static_dirname = path.join(__dirname, '../static');
global.__views_dirname = path.join(global.__static_dirname, '/views');
global.__images_dirname = path.join(global.__static_dirname, '/images');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.set('query parser', 'extended');
  app.setGlobalPrefix('/api');

  // Configure CORS - MUST be before any middleware
  const configService = app.get(ConfigService);
  const corsConfig = configService.get('app.cors');
  
  // Get CORS origins - support array or string
  // Priority: 1. CORS_ORIGINS env var, 2. app.cors config, 3. default to '*'
  let corsOrigins: string | string[] | boolean = '*';
  
  if (process.env.CORS_ORIGINS) {
    // Direct env var takes priority
    const envOrigins = process.env.CORS_ORIGINS.trim();
    if (envOrigins === '*') {
      corsOrigins = '*';
    } else {
      corsOrigins = envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
    }
  } else if (corsConfig?.origins) {
    corsOrigins = corsConfig.origins;
  }
  
  const corsCredentials = corsConfig?.credentials || process.env.CORS_CREDENTIALS === 'true' || false;
  
  console.log('=== CORS Configuration ===');
  console.log('Origins:', corsOrigins);
  console.log('Credentials:', corsCredentials);
  console.log('CORS_ORIGINS env:', process.env.CORS_ORIGINS || 'NOT SET');
  console.log('app.cors config:', corsConfig);
  console.log('========================');
  
  // Enable CORS with proper configuration
  // This MUST be called before any routes or middleware
  app.enableCors({
    origin: corsOrigins,
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'organization-id', 'Accept-Language', 'x-access-token'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  console.log('✅ CORS enabled successfully');

  // create and mount the middleware manually here
  app.use(new ClsMiddleware({}).use);

  const config = new DocumentBuilder()
    .setTitle('Bigcapital')
    .setDescription('Financial accounting software')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
