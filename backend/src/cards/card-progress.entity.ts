import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Card } from './card.entity';
import { User } from '../users/user.entity';

@Entity('card_progress')
@Unique(['cardId', 'userId'])
export class CardProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cardId: string;

  @ManyToOne(() => Card, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardId' })
  card: Card;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 1 })
  interval: number;

  @Column({ type: 'float', default: 2.5 })
  easeFactor: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  dueAt: Date;

  @Column({ default: 'new' })
  state: string;
}
