export type UserRole = 'user' | 'admin';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface UserSettings {
  dailyGoal: number;
  notificationsEnabled: boolean;
  pushSubscription?: PushSubscriptionJSON | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  settings: UserSettings;
  createdAt: string;
}

export interface InputSchemaField {
  type: 'int' | 'float' | 'string';
  min?: number;
  max?: number;
  values?: string[];
}

export interface InputSchema {
  [key: string]: InputSchemaField;
}

export interface Template {
  id: string;
  authorId: string;
  name: string;
  description: string;
  code: string;
  inputSchema: InputSchema;
  isGlobal: boolean;
  createdAt: string;
}

export interface Log {
  id: string;
  userId: string;
  templateId: string | null;
  name: string;
  description: string;
  isGlobal: boolean;
  createdAt: string;
  totalCards?: number;
}

export interface Card {
  id: string;
  logId: string;
  templateId: string | null;
  question: string | null;
  answer: string | null;
  seedInputs: Record<string, unknown> | null;
  createdAt: string;
}

export interface CardProgress {
  id: string;
  cardId: string;
  userId: string;
  interval: number;
  easeFactor: number;
  dueAt: string;
  state: CardState;
}

export interface CardWithDisplay {
  id: string;
  logId: string;
  templateId: string | null;
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
  choices?: string[];
  progress: CardProgress | null;
}

export interface Submission {
  id: string;
  cardId: string;
  userId: string;
  userAnswer: string;
  isCorrect: boolean;
  quality: number;
  reviewedAt: string;
}

export interface SubmissionResult {
  submission: Submission;
  progress: CardProgress;
  isCorrect: boolean;
}

export interface DailyActivity {
  date: string;
  cardsReviewed: number;
  correctCount: number;
}

export interface StatsOverview {
  totalReviewed: number;
  totalCorrect: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LogStats {
  totalCards: number;
  masteredCards: number;
  averageEaseFactor: number;
  retentionRate: number;
}

export interface TemplateResult {
  question: string;
  answer: unknown;
  hint?: string;
  explanation?: string;
  choices?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
