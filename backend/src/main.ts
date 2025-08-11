import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create app with optimized settings for high concurrency
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  
  const configService = app.get(ConfigService);

  // Enable CORS with optimized settings
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe with optimizations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3001;
  
  // Start server with keep-alive settings for high concurrency
  const server = await app.listen(port, '0.0.0.0');
  
  // Optimize for high concurrency
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Health check available at: http://localhost:${port}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
