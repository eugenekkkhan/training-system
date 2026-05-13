import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './submission.entity';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { CardsModule } from '../cards/cards.module';
import { StatsModule } from '../stats/stats.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [TypeOrmModule.forFeature([Submission]), CardsModule, StatsModule, TemplatesModule],
  providers: [SubmissionsService],
  controllers: [SubmissionsController],
})
export class SubmissionsModule {}
