import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AIReviewModule } from './review/ai-review.module';

@Module({
  imports: [DatabaseModule, AIReviewModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
