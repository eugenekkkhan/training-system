import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post()
  submit(@CurrentUser() user: any, @Body() dto: SubmitAnswerDto) {
    return this.submissionsService.submit(user.id, dto);
  }
}
