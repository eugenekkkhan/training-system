import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './card.entity';
import { CardProgress } from './card-progress.entity';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Log } from '../logs/log.entity';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [TypeOrmModule.forFeature([Card, CardProgress, Log]), TemplatesModule],
  providers: [CardsService],
  controllers: [CardsController],
  exports: [CardsService],
})
export class CardsModule {}
