import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

@Injectable()
export class LogsService {
  constructor(@InjectRepository(Log) private repo: Repository<Log>) {}

  findAccessible(userId: string, role: string) {
    if (role === 'admin') return this.repo.find({ order: { createdAt: 'DESC' } });
    return this.repo.find({
      where: [{ userId }, { isGlobal: true }],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const log = await this.repo.findOne({ where: { id } });
    if (!log) throw new NotFoundException();
    if (role !== 'admin' && log.userId !== userId && !log.isGlobal) throw new ForbiddenException();
    return log;
  }

  create(dto: CreateLogDto, userId: string) {
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  async update(id: string, dto: UpdateLogDto, userId: string, role: string) {
    const log = await this.findOne(id, userId, role);
    if (role !== 'admin' && log.userId !== userId) throw new ForbiddenException();
    Object.assign(log, dto);
    return this.repo.save(log);
  }

  async remove(id: string, userId: string, role: string) {
    const log = await this.findOne(id, userId, role);
    if (role !== 'admin' && log.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(log);
  }
}
