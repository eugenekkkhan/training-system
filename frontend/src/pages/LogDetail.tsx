import { useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { logsApi, cardsApi, statsApi, templatesApi } from '../api/client';
import type { Card, TemplateResult } from '../types';

function AddCardForm({ logId, onClose }: { logId: string; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: () => cardsApi.createCard(logId, question.trim(), answer.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', 'log', logId] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('addCard.failed'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError(t('addCard.required'));
      return;
    }
    setError('');
    createMutation.mutate();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('addCard.title')}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="card-question">{t('addCard.question')}</label>
            <textarea
              id="card-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('addCard.questionPlaceholder')}
              rows={3}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="card-answer">{t('addCard.answer')}</label>
            <textarea
              id="card-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t('addCard.answerPlaceholder')}
              rows={2}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('addCard.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('addCard.adding') : t('addCard.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GenerateCardsForm({ logId, onClose }: { logId: string; onClose: () => void }) {
  const [count, setCount] = useState(10);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const generateMutation = useMutation({
    mutationFn: () => logsApi.generateCards(logId, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', 'log', logId] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'log', logId] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('generateCards.failed'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (count < 1 || count > 100) {
      setError(t('generateCards.countRange'));
      return;
    }
    setError('');
    generateMutation.mutate();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('generateCards.title')}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="gen-count">{t('generateCards.count')}</label>
            <input
              id="gen-count"
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              min={1}
              max={100}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('generateCards.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? t('generateCards.generating') : t('generateCards.generate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Template card preview (lazy-loaded) ───────────────────────────────────────

function TemplateCardPreview({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const { data, isFetching, error, refetch } = useQuery<TemplateResult>({
    queryKey: ['template-preview', card.id],
    queryFn: () => templatesApi.test(card.templateId!, card.seedInputs),
    enabled: false,
    staleTime: Infinity,
  });

  const toggle = () => {
    setOpen((v) => {
      if (!v && !data) refetch();
      return !v;
    });
  };

  return (
    <div className="card-template-info">
      <div className="card-template-header">
        <span className="badge badge-template">{t('logDetail.templateCard')}</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={toggle}>
          {open ? t('logDetail.hidePreview') : t('logDetail.showPreview')}
        </button>
      </div>
      {open && (
        <div className="card-preview-body">
          {isFetching && <span className="card-preview-loading">{t('logDetail.previewing')}</span>}
          {error && <span className="card-preview-error">{t('logDetail.previewFailed')}</span>}
          {data && (
            <>
              <div className="card-preview-question">{data.question}</div>
              <div className="card-preview-answer">
                <strong>{t('logDetail.answerLabel')}</strong> {String(data.answer)}
              </div>
              {data.hint && (
                <div className="card-preview-hint">
                  <strong>{t('study.hintLabel')}</strong> {data.hint}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Card row ──────────────────────────────────────────────────────────────────

function CardRow({ card, logId }: { card: Card; logId: string }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const deleteMutation = useMutation({
    mutationFn: () => cardsApi.deleteCard(card.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', 'log', logId] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'log', logId] });
    },
  });

  const handleDelete = () => {
    if (confirm(t('logDetail.deleteCardConfirm'))) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className={`card-row${expanded ? ' card-row-expanded' : ''}`}>
      <div className="card-row-main">
        <div className="card-row-content" onClick={() => !card.templateId && setExpanded((v) => !v)}>
          {card.templateId ? (
            <TemplateCardPreview card={card} />
          ) : (
            <>
              <div className={`card-question-preview${expanded ? ' card-question-full' : ''}`}>
                {card.question}
              </div>
              {expanded && (
                <div className="card-answer-full">
                  <strong>{t('logDetail.answerLabel')}</strong> {card.answer}
                </div>
              )}
              {!expanded && (
                <div className="card-answer-preview">{card.answer}</div>
              )}
            </>
          )}
        </div>
        <div className="card-row-actions">
          {!card.templateId && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? t('logDetail.collapse') : t('logDetail.expand')}
            </button>
          )}
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {t('logs.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LogDetail page ────────────────────────────────────────────────────────────

export function LogDetail() {
  const { logId } = useParams<{ logId: string }>();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const { t } = useTranslation();

  const { data: logs } = useQuery({ queryKey: ['logs'], queryFn: logsApi.list });

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', 'log', logId],
    queryFn: () => cardsApi.forLog(logId!),
    enabled: !!logId,
  });

  const { data: logStats } = useQuery({
    queryKey: ['stats', 'log', logId],
    queryFn: () => statsApi.logStats(logId!),
    enabled: !!logId,
  });

  const log = logs?.find((l) => l.id === logId);

  if (!logId) {
    return (
      <div className="page">
        <div className="alert alert-error">{t('logDetail.invalidId')}</div>
      </div>
    );
  }

  if (!log && logs) {
    return (
      <div className="page">
        <div className="alert alert-error">{t('logDetail.notFound')}</div>
        <Link to="/logs" className="btn btn-secondary">{t('logDetail.backToLogs')}</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/logs" className="breadcrumb">{t('nav.logs')}</Link>
          <span className="breadcrumb-sep"> / </span>
          <h1>{log?.name ?? t('logDetail.loading')}</h1>
          {log?.description && <p className="page-description">{log.description}</p>}
        </div>
        <div className="page-actions">
          <Link to={`/study?logId=${logId}`} className="btn btn-primary">
            {t('logDetail.studyLog')}
          </Link>
          {log?.templateId && (
            <button className="btn btn-secondary" onClick={() => setShowGenerate(true)}>
              {t('logDetail.generateCards')}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowAddCard(true)}>
            {t('logDetail.addCard')}
          </button>
        </div>
      </div>

      {showAddCard && <AddCardForm logId={logId} onClose={() => setShowAddCard(false)} />}
      {showGenerate && <GenerateCardsForm logId={logId} onClose={() => setShowGenerate(false)} />}

      {logStats && (
        <div className="section">
          <h2 className="section-title">{t('logDetail.statsTitle')}</h2>
          <div className="stats-grid stats-grid-sm">
            <div className="stat-card card">
              <div className="stat-value">{logStats.totalCards}</div>
              <div className="stat-label">{t('logDetail.totalCards')}</div>
            </div>
            <div className="stat-card card">
              <div className="stat-value">{logStats.masteredCards}</div>
              <div className="stat-label">{t('logDetail.mastered')}</div>
            </div>
            <div className="stat-card card">
              <div className="stat-value">
                {logStats.retentionRate > 0
                  ? Math.round(logStats.retentionRate * 100) + '%'
                  : 'N/A'}
              </div>
              <div className="stat-label">{t('logDetail.retentionRate')}</div>
            </div>
            <div className="stat-card card">
              <div className="stat-value">
                {logStats.averageEaseFactor > 0
                  ? logStats.averageEaseFactor.toFixed(2)
                  : 'N/A'}
              </div>
              <div className="stat-label">{t('logDetail.avgEase')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">
          {cards ? t('logDetail.cardsCount', { count: cards.length }) : t('logDetail.cardsTitle')}
        </h2>
        {cardsLoading ? (
          <div className="loading">{t('logDetail.loadingCards')}</div>
        ) : !cards || cards.length === 0 ? (
          <div className="card empty-state">
            <p>{t('logDetail.noCards')}</p>
          </div>
        ) : (
          <div className="cards-list">
            {cards.map((card) => (
              <CardRow key={card.id} card={card} logId={logId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
