export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  settings: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  dailyGoal: number;
  notificationsEnabled: boolean;
  pushSubscription?: any;
}

export interface Template {
  id: string;
  authorId: string;
  name: string;
  description: string;
  code: string;
  inputSchema: Record<string, any>;
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
}

export interface Card {
  id: string;
  logId: string;
  templateId: string | null;
  question: string | null;
  answer: string | null;
  seedInputs: any;
  createdAt: string;
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
  progress: any;
}

export interface SubmissionResult {
  submission: any;
  progress: any;
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
  answer: any;
  hint?: string;
  explanation?: string;
  choices?: string[];
}
