import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  templateId: string;

  @Column()
  name: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: false })
  isGlobal: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
