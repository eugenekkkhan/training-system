import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { cardsApi, logsApi, submissionsApi } from '../api/client';
import { Latex } from '../components/Latex';
import { Card } from '../components/Card';
import { Button, LinkButton } from '../components/Button';
import { Spinner } from '../components/Spinner';
import type { CardWithDisplay, SubmissionResult } from '../types';

// ── Interval helpers ──────────────────────────────────────────────────────────

function computeNextDays(progress: any, quality: number): number {
  if (quality < 3) return 0;
  const interval = progress?.interval ?? 1;
  const easeFactor = progress?.easeFactor ?? 2.5;
  if (interval === 1) return 6;
  return Math.round(interval * easeFactor);
}

function fmtDays(days: number, t: (k: string) => string): string {
  if (days <= 0) return t('study.again');
  if (days === 1) return '1d';
  if (days < 31) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 52) return `${weeks}w`;
  return `${Math.round(days / 30)}mo`;
}

// ── Session state ─────────────────────────────────────────────────────────────

interface SessionState {
  queue: CardWithDisplay[];
  total: number;
  done: number;
  firstTryCorrect: number;
  seenIds: Set<string>;
  reviewCount: number;
}

// ── CardView ──────────────────────────────────────────────────────────────────

interface CardViewProps {
  card: CardWithDisplay;
  onResult: (result: SubmissionResult) => void;
}

function CardView({ card, onResult }: CardViewProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [phase, setPhase] = useState<'input' | 'rating'>('input');
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [ratedQuality, setRatedQuality] = useState<number | null>(null);
  const { t } = useTranslation();

  const submitMutation = useMutation({
    mutationFn: (payload: { cardId: string; userAnswer: string; quality: number }) =>
      submissionsApi.submit(payload),
  });

  const submitRef = useRef<(quality: number) => void>(() => {});
  submitRef.current = (quality: number) => {
    if (submitMutation.isPending || ratedQuality !== null) return;
    setRatedQuality(quality);
    submitMutation
      .mutateAsync({ cardId: card.id, userAnswer: selectedAnswer, quality })
      .then(onResult)
      .catch(() => setRatedQuality(null));
  };

  const handleAnswerSubmit = (e?: FormEvent, choiceAnswer?: string) => {
    if (e) e.preventDefault();
    const answer = choiceAnswer ?? userAnswer;
    if (!answer.trim()) return;
    const correct =
      answer.trim().toLowerCase() === String(card.answer ?? '').trim().toLowerCase();
    setIsCorrect(correct);
    setSelectedAnswer(answer);
    setPhase('rating');
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (phase === 'input' && !inInput) {
        if (e.key.toLowerCase() === 'h' && card.hint) {
          e.preventDefault();
          setShowHint((v) => !v);
          return;
        }
        if (card.choices && card.choices.length > 0 && !submitMutation.isPending) {
          const idx = parseInt(e.key) - 1;
          if (idx >= 0 && idx < card.choices.length) {
            e.preventDefault();
            const choice = card.choices[idx];
            const correct =
              choice.trim().toLowerCase() === String(card.answer ?? '').trim().toLowerCase();
            setIsCorrect(correct);
            setSelectedAnswer(choice);
            setPhase('rating');
          }
        }
      }

      if (phase === 'rating' && !inInput) {
        const q = parseInt(e.key);
        if (q >= 1 && q <= 5) {
          e.preventDefault();
          submitRef.current(q);
        }
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [phase, card.hint, card.choices, submitMutation.isPending]);

  return (
    <Card variant="elevated" pad="md" className="study-card">
      {/* Question */}
      <div className="study-question">
        <p className="question-label">{t('study.question')}</p>
        <p className="question-text">{card.templateId ? <Latex>{card.question}</Latex> : card.question}</p>
      </div>

      {/* Hint */}
      {card.hint && phase === 'input' && (
        <div className="hint-area">
          {showHint ? (
            <div className="hint-text">
              <strong>{t('study.hintLabel')}</strong>{' '}
              {card.templateId ? <Latex>{card.hint!}</Latex> : card.hint}
            </div>
          ) : (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setShowHint(true)}
            >
              {t('study.showHint')} <kbd className="kbd-hint">H</kbd>
            </Button>
          )}
        </div>
      )}

      {/* Input phase */}
      {phase === 'input' &&
        (card.choices && card.choices.length > 0 ? (
          <div className="choices">
            {card.choices.map((choice, i) => (
              <button
                key={choice}
                type="button"
                className="btn btn-secondary choice-btn"
                onClick={() => handleAnswerSubmit(undefined, choice)}
                disabled={submitMutation.isPending}
              >
                <span className="choice-key">{i + 1}</span>
                {card.templateId ? <Latex>{choice}</Latex> : choice}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleAnswerSubmit} className="answer-form">
            <div className="form-group">
              <label htmlFor="answer-input">{t('study.yourAnswer')}</label>
              <input
                id="answer-input"
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={t('study.typeAnswer')}
                autoFocus
                disabled={submitMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={submitMutation.isPending || !userAnswer.trim()}
            >
              {t('study.submit')} <kbd className="kbd-hint">↵</kbd>
            </Button>
          </form>
        ))}

      {/* Rating phase */}
      {phase === 'rating' && (
        <div className="review-phase">
          <div className={`result-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? t('study.correctBanner') : t('study.incorrectBanner')}
          </div>

          {!isCorrect && selectedAnswer && (
            <div className="your-answer-shown">
              <span className="your-answer-label">{t('study.yourAnswerLabel')}</span>
              <span className="your-answer-text">{selectedAnswer}</span>
            </div>
          )}

          <div className="correct-answer">
            <strong>{t('study.correctAnswer')}</strong>{' '}
            {card.templateId ? <Latex>{String(card.answer ?? '')}</Latex> : String(card.answer ?? '')}
          </div>

          {!isCorrect && card.explanation && (
            <div className="explanation">
              <strong>{t('study.explanationLabel')}</strong>{' '}
              {card.templateId ? <Latex>{card.explanation!}</Latex> : card.explanation}
            </div>
          )}

          <div className="quality-rating">
            <p className="quality-label">
              {t('study.howWell')}
              <span className="quality-kbd-hint">{t('study.pressKey')}</span>
            </p>
            <div className="quality-buttons">
              {([1, 2, 3, 4, 5] as const).map((q) => {
                const days = computeNextDays(card.progress, q);
                const isActive = ratedQuality === q;
                const isPending = submitMutation.isPending && isActive;
                return (
                  <button
                    key={q}
                    type="button"
                    className={`btn quality-btn quality-${q}${isActive ? ' quality-active' : ''}`}
                    onClick={() => submitRef.current(q)}
                    disabled={ratedQuality !== null && !isActive}
                    title={t(`study.quality.${q}.desc`)}
                  >
                    <span className="quality-key">{q}</span>
                    <span className="quality-text">{t(`study.quality.${q}.label`)}</span>
                    <span className="quality-interval">
                      {isPending ? '…' : fmtDays(days, t)}
                    </span>
                  </button>
                );
              })}
            </div>
            {submitMutation.isError && (
              <p className="quality-error">{t('study.submitError')}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Study page ────────────────────────────────────────────────────────────────

export function Study() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | undefined>(
    searchParams.get('logId') ?? undefined,
  );
  const { t } = useTranslation();

  const { data: logs } = useQuery({ queryKey: ['logs'], queryFn: logsApi.list });

  const { data: dueCards, isLoading, error } = useQuery({
    queryKey: ['cards', 'due', selectedLogId ?? 'all'],
    queryFn: () => cardsApi.due(selectedLogId),
  });

  const startSession = () => {
    if (!dueCards || dueCards.length === 0) return;
    setSession({
      queue: [...dueCards],
      total: dueCards.length,
      done: 0,
      firstTryCorrect: 0,
      seenIds: new Set(),
      reviewCount: 0,
    });
  };

  const handleResult = useCallback((result: SubmissionResult) => {
    setSession((prev) => {
      if (!prev || prev.queue.length === 0) return prev;
      const [current, ...rest] = prev.queue;
      const isFirstTime = !prev.seenIds.has(current.id);
      const newSeenIds = new Set([...prev.seenIds, current.id]);
      const failed = result.progress?.state === 'relearning';
      return {
        queue: failed ? [...rest, current] : rest,
        total: prev.total,
        done: failed ? prev.done : prev.done + 1,
        firstTryCorrect:
          isFirstTime && result.isCorrect ? prev.firstTryCorrect + 1 : prev.firstTryCorrect,
        seenIds: newSeenIds,
        reviewCount: prev.reviewCount + 1,
      };
    });
  }, []);

  const handleSessionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['cards', 'due', selectedLogId ?? 'all'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    setSession(null);
  };

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{t('study.failedToLoad')}</div>
      </div>
    );
  }

  // ── Session complete ────────────────────────────────────────────────────────

  if (session && session.queue.length === 0) {
    const pct =
      session.total > 0 ? Math.round((session.firstTryCorrect / session.total) * 100) : 0;
    const relearned = session.total - session.firstTryCorrect;
    return (
      <div className="page">
        <Card variant="elevated" pad="lg" className="session-complete">
          <div className="session-complete-icon">✓</div>
          <h2>{t('study.sessionComplete')}</h2>
          <div className="session-score">
            <span className="score-big">{session.firstTryCorrect}</span>
            <span className="score-sep">/</span>
            <span className="score-big">{session.total}</span>
          </div>
          <p className="score-label">{t('study.firstTryAccuracy', { pct })}</p>
          {relearned > 0 && (
            <p className="score-relearned">
              {t('study.relearned', { count: relearned })}
            </p>
          )}
          <div className="session-actions">
            <Button variant="primary" onClick={handleSessionComplete}>
              {t('study.done')}
            </Button>
            <LinkButton to="/" variant="secondary">
              {t('study.goToDashboard')}
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  // ── Pre-session ─────────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>{t('study.title')}</h1>
        </div>
        <Card variant="elevated" pad="lg" className="session-start">
          <h3>{t('study.readyTitle')}</h3>

          {logs && logs.length > 0 && (
            <div className="form-group session-log-select">
              <label htmlFor="log-select">{t('study.logFilter')}</label>
              <select
                id="log-select"
                value={selectedLogId ?? ''}
                onChange={(e) => setSelectedLogId(e.target.value || undefined)}
              >
                <option value="">{t('study.allLogs')}</option>
                {logs.map((log) => (
                  <option key={log.id} value={log.id}>
                    {log.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading ? (
            <Spinner />
          ) : !dueCards || dueCards.length === 0 ? (
            <>
              <p className="session-start-desc">{t('study.noDueDesc')}</p>
              <LinkButton to="/logs" variant="secondary">
                {t('study.browseLogs')}
              </LinkButton>
            </>
          ) : (
            <>
              <p className="session-start-desc">
                <Trans
                  i18nKey="study.cardsCount"
                  count={dueCards.length}
                  values={{ count: dueCards.length }}
                  components={{ strong: <strong /> }}
                />
              </p>
              <Button variant="primary" onClick={startSession}>
                {t('study.startSession')}
              </Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ── Active session ──────────────────────────────────────────────────────────

  const currentCard = session.queue[0];
  const progressPct = (session.done / session.total) * 100;
  const againInQueue = session.queue.filter((c) => session.seenIds.has(c.id)).length;

  return (
    <div className="page study-page">
      <div className="study-header">
        <div className="study-progress-bar">
          <div className="study-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="study-counter">
          {session.done}/{session.total}
          {againInQueue > 0 && (
            <span className="again-badge">+{againInQueue}</span>
          )}
        </div>
      </div>

      <CardView
        key={`${currentCard.id}-${session.reviewCount}`}
        card={currentCard}
        onResult={handleResult}
      />
    </div>
  );
}
