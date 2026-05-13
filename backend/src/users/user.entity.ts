import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ type: 'jsonb', default: { dailyGoal: 20, notificationsEnabled: false, pushSubscription: null, customColors: {} } })
  settings: {
    dailyGoal: number;
    notificationsEnabled: boolean;
    pushSubscription: any;
    customColors: Record<string, string>;
  };

  @CreateDateColumn()
  createdAt: Date;
}
