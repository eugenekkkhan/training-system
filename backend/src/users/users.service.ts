import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  create(data: { email: string; passwordHash: string }) {
    return this.repo.save(this.repo.create(data));
  }

  async updateSettings(userId: string, settings: Partial<User['settings']>) {
    const user = await this.repo.findOne({ where: { id: userId } });
    user.settings = { ...user.settings, ...settings };
    return this.repo.save(user);
  }

  async savePushSubscription(userId: string, subscription: any) {
    await this.repo.update(userId, {
      settings: () => `settings || '{"pushSubscription": ${JSON.stringify(JSON.stringify(subscription))}}'::jsonb`,
    });
  }

  async removePushSubscription(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    user.settings = { ...user.settings, pushSubscription: null };
    return this.repo.save(user);
  }

  findAllWithPushSubscriptions() {
    return this.repo
      .createQueryBuilder('u')
      .where("u.settings->>'pushSubscription' IS NOT NULL")
      .andWhere("u.settings->>'notificationsEnabled' = 'true'")
      .getMany();
  }
}
