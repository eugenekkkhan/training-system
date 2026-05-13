import { Controller, Get, Patch, Body, UseGuards, Post, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  @Patch('settings')
  async updateSettings(@CurrentUser() user: any, @Body() dto: UpdateSettingsDto) {
    const updated = await this.usersService.updateSettings(user.id, dto);
    const { passwordHash, ...safe } = updated;
    return safe;
  }

  @Post('push-subscription')
  async savePushSubscription(@CurrentUser() user: any, @Body() body: any) {
    await this.usersService.savePushSubscription(user.id, body.subscription);
    return { ok: true };
  }

  @Delete('push-subscription')
  async removePushSubscription(@CurrentUser() user: any) {
    await this.usersService.removePushSubscription(user.id);
    return { ok: true };
  }
}
