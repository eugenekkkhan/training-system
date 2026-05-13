import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('heatmap')
  heatmap(@CurrentUser() user: any) {
    return this.statsService.getHeatmap(user.id);
  }

  @Get('overview')
  overview(@CurrentUser() user: any) {
    return this.statsService.getOverview(user.id);
  }

  @Get('logs/:logId')
  logStats(@Param('logId') logId: string) {
    return this.statsService.getLogStats(logId);
  }
}
