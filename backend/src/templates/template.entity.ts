import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  name: string;

  @Column({ default: '' })
  description: string;

  @Column({ type: 'text' })
  code: string;

  @Column({ type: 'jsonb', default: {} })
  inputSchema: Record<string, any>;

  @Column({ default: false })
  isGlobal: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
