import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or } from 'typeorm';
import { Template } from './template.entity';
import { SandboxService } from './sandbox.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template) private repo: Repository<Template>,
    private sandbox: SandboxService,
  ) {}

  findAccessible(userId: string, role: string) {
    if (role === 'admin') return this.repo.find({ order: { createdAt: 'DESC' } });
    return this.repo.find({
      where: [{ authorId: userId }, { isGlobal: true }],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException();
    if (role !== 'admin' && t.authorId !== userId && !t.isGlobal)
      throw new ForbiddenException();
    return t;
  }

  create(dto: CreateTemplateDto, userId: string) {
    return this.repo.save(this.repo.create({ ...dto, authorId: userId }));
  }

  async update(id: string, dto: UpdateTemplateDto, userId: string, role: string) {
    const t = await this.findOne(id, userId, role);
    if (role !== 'admin' && t.authorId !== userId) throw new ForbiddenException();
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async remove(id: string, userId: string, role: string) {
    const t = await this.findOne(id, userId, role);
    if (role !== 'admin' && t.authorId !== userId) throw new ForbiddenException();
    await this.repo.remove(t);
  }

  async test(id: string, inputs: Record<string, any>, userId: string, role: string) {
    const t = await this.findOne(id, userId, role);
    return this.sandbox.runTemplate(t.code, inputs);
  }

  runWithInputs(template: Template, inputs: Record<string, any>) {
    return this.sandbox.runTemplate(template.code, inputs);
  }
}
