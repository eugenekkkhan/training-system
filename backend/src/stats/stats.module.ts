import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyActivity } from './daily-activity.entity';
import { Submission } from '../submissions/submission.entity';
import { Card } from '../cards/card.entity';
import { CardProgress } from '../cards/card-progress.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DailyActivity, Submission, Card, CardProgress])],
  providers: [StatsService],
  controllers: [StatsController],
  exports: [StatsService],
})
export class StatsModule {}
