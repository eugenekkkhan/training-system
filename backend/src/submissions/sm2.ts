import { CardProgress } from '../cards/card-progress.entity';

export function applySmTwo(progress: CardProgress, quality: number): CardProgress {
  if (quality >= 3) {
    const newInterval = progress.interval === 1 ? 6 : Math.round(progress.interval * progress.easeFactor);
    const newEaseFactor = Math.max(1.3, progress.easeFactor + 0.1 - (5 - quality) * 0.08);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + newInterval);
    return Object.assign(progress, { interval: newInterval, easeFactor: newEaseFactor, state: 'review', dueAt });
  } else {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 1);
    return Object.assign(progress, { interval: 1, state: 'relearning', dueAt });
  }
}
