import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardProgress } from '../cards/card-progress.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CardProgress]), UsersModule],
  providers: [NotificationsService, NotificationsScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
