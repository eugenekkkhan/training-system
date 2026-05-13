import { Controller, Get, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  @UseGuards(JwtAuthGuard)
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }
}
