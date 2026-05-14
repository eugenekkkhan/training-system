import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  @Get('vapid-public-key')
  @UseGuards(JwtAuthGuard)
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTest(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user?.settings?.pushSubscription) {
      return { ok: false, reason: 'no_subscription' };
    }
    await this.notificationsService.sendNotification(user.settings.pushSubscription, {
      title: 'Test notification',
      body: 'Push notifications are working!',
      url: '/',
    });
    return { ok: true };
  }
}
