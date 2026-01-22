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

  // Configure CORS
  const configService = app.get(ConfigService);
  const corsConfig = configService.get('app.cors');
  
  // Get CORS origins - support array or string
  let corsOrigins: string | string[] | boolean = '*';
  if (corsConfig?.origins) {
    corsOrigins = corsConfig.origins;
  } else if (process.env.CORS_ORIGINS) {
    // Fallback to direct env var if config not loaded
    const envOrigins = process.env.CORS_ORIGINS.trim();
    if (envOrigins === '*') {
      corsOrigins = '*';
    } else {
      corsOrigins = envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
    }
  }
  
  const corsCredentials = corsConfig?.credentials || process.env.CORS_CREDENTIALS === 'true' || false;
  
  console.log('CORS Configuration:', {
    origins: corsOrigins,
    credentials: corsCredentials,
    envCorsOrigins: process.env.CORS_ORIGINS,
  });
  
  app.enableCors({
    origin: corsOrigins,
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'organization-id', 'Accept-Language', 'x-access-token'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

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
