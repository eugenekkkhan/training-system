import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Card } from './card.entity';
import { CardProgress } from './card-progress.entity';
import { Log } from '../logs/log.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card) private cardRepo: Repository<Card>,
    @InjectRepository(CardProgress) private progressRepo: Repository<CardProgress>,
    @InjectRepository(Log) private logRepo: Repository<Log>,
  ) {}

  async getDueCards(userId: string, dailyGoal: number, logId?: string) {
    const whereClause = logId
      ? [{ id: logId, userId }, { id: logId, isGlobal: true }]
      : [{ userId }, { isGlobal: true }];
    const logs = await this.logRepo.find({ where: whereClause });
    const logIds = logs.map((l) => l.id);
    if (!logIds.length) return [];

    const allCards = await this.cardRepo
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.log', 'log')
      .where('card.logId IN (:...logIds)', { logIds })
      .getMany();

    if (!allCards.length) return [];
    const cardIds = allCards.map((c) => c.id);

    // Get progress for all these cards
    const progressList = await this.progressRepo.find({
      where: cardIds.map((id) => ({ cardId: id, userId })),
    });
    const progressMap = new Map(progressList.map((p) => [p.cardId, p]));

    const now = new Date();
    const due: { card: Card; progress: CardProgress | null }[] = [];
    const newCards: { card: Card; progress: null }[] = [];

    for (const card of allCards) {
      const progress = progressMap.get(card.id) || null;
      if (!progress || progress.state === 'new') {
        newCards.push({ card, progress: null });
      } else if (new Date(progress.dueAt) <= now) {
        due.push({ card, progress });
      }
    }

    // Mix: due cards first, then new up to dailyGoal
    const result = [
      ...due,
      ...newCards.slice(0, Math.max(0, dailyGoal - due.length)),
    ].slice(0, 50);

    return result;
  }

  async getCardsForLog(logId: string, userId: string) {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new NotFoundException();
    if (log.userId !== userId && !log.isGlobal) throw new ForbiddenException();
    return this.cardRepo.find({ where: { logId }, order: { createdAt: 'ASC' } });
  }

  async createCard(logId: string, userId: string, data: { question: string; answer: string }) {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new NotFoundException();
    if (log.userId !== userId) throw new ForbiddenException();
    return this.cardRepo.save(this.cardRepo.create({ logId, ...data }));
  }

  async addGeneratedCards(logId: string, cards: { templateId: string; seedInputs: Record<string, any> }[]) {
    const entities = cards.map((c) => this.cardRepo.create({ logId, ...c }));
    return this.cardRepo.save(entities);
  }

  async deleteCard(id: string, userId: string) {
    const card = await this.cardRepo.findOne({ where: { id }, relations: ['log'] });
    if (!card) throw new NotFoundException();
    if (card.log.userId !== userId) throw new ForbiddenException();
    await this.cardRepo.remove(card);
  }

  findById(id: string) {
    return this.cardRepo.findOne({ where: { id } });
  }

  async getOrInitProgress(cardId: string, userId: string): Promise<CardProgress> {
    let progress = await this.progressRepo.findOne({ where: { cardId, userId } });
    if (!progress) {
      progress = this.progressRepo.create({ cardId, userId, interval: 1, easeFactor: 2.5, state: 'new', dueAt: new Date() });
      await this.progressRepo.save(progress);
    }
    return progress;
  }

  saveProgress(progress: CardProgress) {
    return this.progressRepo.save(progress);
  }

  async getProgressForUser(userId: string, cardIds: string[]) {
    if (!cardIds.length) return [];
    return this.progressRepo.find({
      where: cardIds.map((id) => ({ cardId: id, userId })),
    });
  }
}
