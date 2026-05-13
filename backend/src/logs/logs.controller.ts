import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { LogsService } from './logs.service';
import { CardsService } from '../cards/cards.service';
import { TemplatesService } from '../templates/templates.service';
import { SandboxService } from '../templates/sandbox.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { GenerateCardsDto } from './dto/generate-cards.dto';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(
    private logsService: LogsService,
    private cardsService: CardsService,
    private templatesService: TemplatesService,
    private sandbox: SandboxService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.logsService.findAccessible(user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.logsService.findOne(id, user.id, user.role);
  }

  @Post()
  create(@Body() dto: CreateLogDto, @CurrentUser() user: any) {
    return this.logsService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLogDto, @CurrentUser() user: any) {
    return this.logsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.logsService.remove(id, user.id, user.role);
  }

  @Post(':id/generate')
  async generateCards(@Param('id') id: string, @Body() dto: GenerateCardsDto, @CurrentUser() user: any) {
    const log = await this.logsService.findOne(id, user.id, user.role);
    if (!log.templateId) throw new Error('Log has no template');
    const template = await this.templatesService.findOne(log.templateId, user.id, user.role);

    const generated = [];
    for (let i = 0; i < dto.count; i++) {
      const seedInputs = this.sandbox.generateInputs(template.inputSchema);
      generated.push({ templateId: template.id, seedInputs });
    }
    return this.cardsService.addGeneratedCards(id, generated);
  }
}
