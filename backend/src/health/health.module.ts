import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController, MetricsController],
})
export class HealthModule {}
