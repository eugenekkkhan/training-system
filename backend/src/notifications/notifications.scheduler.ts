import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { CardProgress } from '../cards/card-progress.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  constructor(
    @InjectRepository(CardProgress) private progressRepo: Repository<CardProgress>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyNotifications() {
    const users = await this.usersService.findAllWithPushSubscriptions();
    const now = new Date();

    for (const user of users) {
      const dueCount = await this.progressRepo.count({
        where: { userId: user.id, dueAt: LessThanOrEqual(now) },
      });
      if (dueCount > 0) {
        await this.notificationsService.sendNotification(user.settings.pushSubscription, {
          title: 'Cards due for review',
          body: `You have ${dueCount} card${dueCount > 1 ? 's' : ''} ready to review.`,
          url: '/',
        });
      }
    }
  }
}
