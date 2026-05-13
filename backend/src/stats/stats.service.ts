import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyActivity } from './daily-activity.entity';
import { Submission } from '../submissions/submission.entity';
import { Card } from '../cards/card.entity';
import { CardProgress } from '../cards/card-progress.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(DailyActivity) private activityRepo: Repository<DailyActivity>,
    @InjectRepository(Submission) private submissionRepo: Repository<Submission>,
    @InjectRepository(Card) private cardRepo: Repository<Card>,
    @InjectRepository(CardProgress) private progressRepo: Repository<CardProgress>,
  ) {}

  async recordActivity(userId: string, isCorrect: boolean) {
    const today = new Date().toISOString().split('T')[0];
    let activity = await this.activityRepo.findOne({ where: { userId, date: today } });
    if (!activity) {
      activity = this.activityRepo.create({ userId, date: today, cardsReviewed: 0, correctCount: 0 });
    }
    activity.cardsReviewed += 1;
    if (isCorrect) activity.correctCount += 1;
    return this.activityRepo.save(activity);
  }

  getHeatmap(userId: string) {
    return this.activityRepo.find({
      where: { userId },
      order: { date: 'ASC' },
    });
  }

  async getOverview(userId: string) {
    const submissions = await this.submissionRepo.find({ where: { userId } });
    const totalReviewed = submissions.length;
    const totalCorrect = submissions.filter((s) => s.isCorrect).length;

    const activities = await this.activityRepo.find({ where: { userId }, order: { date: 'DESC' } });
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < activities.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedDate = expected.toISOString().split('T')[0];
      if (activities[i]?.date === expectedDate && activities[i].cardsReviewed > 0) {
        streak++;
        if (i === 0 || (i === 1 && activities[0].date === today)) currentStreak = streak;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 0;
        break;
      }
    }
    longestStreak = Math.max(longestStreak, streak);

    return { totalReviewed, totalCorrect, currentStreak, longestStreak };
  }

  async getLogStats(logId: string) {
    const cards = await this.cardRepo.find({ where: { logId } });
    const cardIds = cards.map((c) => c.id);
    if (!cardIds.length) return { totalCards: 0, masteredCards: 0, averageEaseFactor: 2.5, retentionRate: 0 };

    const progress = await this.progressRepo.find({
      where: cardIds.map((id) => ({ cardId: id })),
    });
    const submissions = await this.submissionRepo.find({
      where: cardIds.map((id) => ({ cardId: id })),
    });

    const masteredCards = progress.filter((p) => p.interval > 21).length;
    const averageEaseFactor = progress.length
      ? progress.reduce((sum, p) => sum + p.easeFactor, 0) / progress.length
      : 2.5;
    const retentionRate = submissions.length
      ? submissions.filter((s) => s.isCorrect).length / submissions.length
      : 0;

    return { totalCards: cards.length, masteredCards, averageEaseFactor, retentionRate };
  }
}
