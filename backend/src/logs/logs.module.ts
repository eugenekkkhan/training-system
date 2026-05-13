import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { CardsModule } from '../cards/cards.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [TypeOrmModule.forFeature([Log]), CardsModule, TemplatesModule],
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService],
})
export class LogsModule {}
