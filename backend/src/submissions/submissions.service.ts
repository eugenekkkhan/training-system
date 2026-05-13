import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './submission.entity';
import { CardsService } from '../cards/cards.service';
import { StatsService } from '../stats/stats.service';
import { applySmTwo } from './sm2';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission) private repo: Repository<Submission>,
    private cardsService: CardsService,
    private statsService: StatsService,
    private templatesService: TemplatesService,
  ) {}

  async submit(userId: string, dto: SubmitAnswerDto) {
    const card = await this.cardsService.findById(dto.cardId);
    if (!card) throw new NotFoundException('Card not found');

    let correctAnswer: string;
    if (card.templateId && card.seedInputs) {
      const template = await this.templatesService['repo'].findOne({ where: { id: card.templateId } });
      const result = await this.templatesService.runWithInputs(template, card.seedInputs);
      correctAnswer = String(result.answer ?? '');
    } else {
      correctAnswer = card.answer ?? '';
    }

    const isCorrect = dto.userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    const quality = dto.quality !== undefined ? dto.quality : isCorrect ? 4 : 1;

    const submission = await this.repo.save(
      this.repo.create({ cardId: card.id, userId, userAnswer: dto.userAnswer, isCorrect, quality }),
    );

    const progress = await this.cardsService.getOrInitProgress(card.id, userId);
    const updatedProgress = applySmTwo(progress, quality);
    await this.cardsService.saveProgress(updatedProgress);

    await this.statsService.recordActivity(userId, isCorrect);

    return { submission, progress: updatedProgress, isCorrect };
  }
}
