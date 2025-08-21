import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsResolver } from './reviews.resolver';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsResolver],
  exports: [ReviewsService],
})
export class ReviewsModule {}
