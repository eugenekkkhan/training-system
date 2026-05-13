import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './template.entity';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { SandboxService } from './sandbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([Template])],
  providers: [TemplatesService, SandboxService],
  controllers: [TemplatesController],
  exports: [TemplatesService, SandboxService],
})
export class TemplatesModule {}
