import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Log } from '../logs/log.entity';
import { Template } from '../templates/template.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  logId: string;

  @ManyToOne(() => Log, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'logId' })
  log: Log;

  @Column({ nullable: true })
  templateId: string;

  @ManyToOne(() => Template, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column({ nullable: true, type: 'text' })
  question: string;

  @Column({ nullable: true, type: 'text' })
  answer: string;

  @Column({ nullable: true, type: 'jsonb' })
  seedInputs: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
