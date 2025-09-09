import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service.js';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        
        console.log('🔧 Configuring Redis cache store with URL:', redisUrl);
        
        try {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 300, // 5 minutes default TTL in seconds
            max: 10000, // Maximum number of items in cache
            
            // Redis-specific options
            socket: {
              connectTimeout: 60000,
              lazyConnect: true,
            },
          };
        } catch (error) {
          console.error('❌ Failed to configure Redis store, falling back to memory store:', error);
          // Fallback to memory store if Redis fails
          return {
            ttl: 300,
            max: 10000,
          };
        }
      },
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CacheCustomModule {}
