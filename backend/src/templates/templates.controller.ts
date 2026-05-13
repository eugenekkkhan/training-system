import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.templatesService.findAccessible(user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templatesService.findOne(id, user.id, user.role);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.templatesService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() user: any) {
    return this.templatesService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templatesService.remove(id, user.id, user.role);
  }

  @Post(':id/test')
  test(@Param('id') id: string, @Body() body: { inputs: Record<string, any> }, @CurrentUser() user: any) {
    return this.templatesService.test(id, body.inputs, user.id, user.role);
  }
}
