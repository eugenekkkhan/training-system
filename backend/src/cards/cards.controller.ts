import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query, Optional } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CardsService } from './cards.service';
import { TemplatesService } from '../templates/templates.service';
import { CreateCardDto } from './dto/create-card.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(
    private cardsService: CardsService,
    private templatesService: TemplatesService,
  ) {}

  @Get('cards/due')
  async getDue(@CurrentUser() user: any, @Query('logId') logId?: string) {
    const pairs = await this.cardsService.getDueCards(user.id, user.settings?.dailyGoal || 20, logId);
    const results = await Promise.all(
      pairs.map(async ({ card, progress }) => {
        let display: any = {};
        if (card.templateId && card.seedInputs) {
          const tmpl = await this.templatesService['repo'].findOne({ where: { id: card.templateId } });
          if (!tmpl) return null;
          display = await this.templatesService.runWithInputs(tmpl, card.seedInputs);
        } else {
          display = { question: card.question, answer: card.answer };
        }
        return { ...display, id: card.id, logId: card.logId, templateId: card.templateId, progress };
      }),
    );
    return results.filter(Boolean);
  }

  @Get('logs/:logId/cards')
  getForLog(@Param('logId') logId: string, @CurrentUser() user: any) {
    return this.cardsService.getCardsForLog(logId, user.id);
  }

  @Post('logs/:logId/cards')
  createCard(@Param('logId') logId: string, @Body() dto: CreateCardDto, @CurrentUser() user: any) {
    return this.cardsService.createCard(logId, user.id, dto);
  }

  @Delete('cards/:id')
  deleteCard(@Param('id') id: string, @CurrentUser() user: any) {
    return this.cardsService.deleteCard(id, user.id);
  }
}
