import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('daily_activity')
@Unique(['userId', 'date'])
export class DailyActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 0 })
  cardsReviewed: number;

  @Column({ default: 0 })
  correctCount: number;
}
