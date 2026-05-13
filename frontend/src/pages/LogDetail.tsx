import { useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { logsApi, cardsApi, statsApi, templatesApi } from '../api/client';
import { Card } from '../components/Card';
import { Button, LinkButton } from '../components/Button';
import { Spinner } from '../components/Spinner';
import type { Card as CardType, TemplateResult } from '../types';

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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Card pad="md">
          <Card.Header>
            <h3>{t('addCard.title')}</h3>
            <button className="btn-close" onClick={onClose}>×</button>
          </Card.Header>
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
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
            <Card.Footer>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('addCard.cancel')}
              </Button>
              <Button type="submit" variant="primary" loading={createMutation.isPending}>
                {createMutation.isPending ? t('addCard.adding') : t('addCard.add')}
              </Button>
            </Card.Footer>
          </form>
        </Card>
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Card pad="md">
          <Card.Header>
            <h3>{t('generateCards.title')}</h3>
            <button className="btn-close" onClick={onClose}>×</button>
          </Card.Header>
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
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
            <Card.Footer>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('generateCards.cancel')}
              </Button>
              <Button type="submit" variant="primary" loading={generateMutation.isPending}>
                {generateMutation.isPending ? t('generateCards.generating') : t('generateCards.generate')}
              </Button>
            </Card.Footer>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ── Template card preview (lazy-loaded) ───────────────────────────────────────

function TemplateCardPreview({ card }: { card: CardType }) {
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
        <Button variant="secondary" size="sm" onClick={toggle}>
          {open ? t('logDetail.hidePreview') : t('logDetail.showPreview')}
        </Button>
      </div>
      {open && (
        <Card.Inset style={{ marginTop: 10 }}>
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
        </Card.Inset>
      )}
    </div>
  );
}

// ── Card row ──────────────────────────────────────────────────────────────────

function CardRow({ card, logId }: { card: CardType; logId: string }) {
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? t('logDetail.collapse') : t('logDetail.expand')}
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            {t('logs.delete')}
          </Button>
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
        <LinkButton to="/logs" variant="secondary" style={{ marginTop: 12 }}>
          {t('logDetail.backToLogs')}
        </LinkButton>
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
          <LinkButton to={`/study?logId=${logId}`} variant="primary">
            {t('logDetail.studyLog')}
          </LinkButton>
          {log?.templateId && (
            <Button variant="secondary" onClick={() => setShowGenerate(true)}>
              {t('logDetail.generateCards')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowAddCard(true)}>
            {t('logDetail.addCard')}
          </Button>
        </div>
      </div>

      {showAddCard && <AddCardForm logId={logId} onClose={() => setShowAddCard(false)} />}
      {showGenerate && <GenerateCardsForm logId={logId} onClose={() => setShowGenerate(false)} />}

      {logStats && (
        <div className="section">
          <h2 className="section-title">{t('logDetail.statsTitle')}</h2>
          <div className="stats-grid stats-grid-sm">
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">{logStats.totalCards}</div>
              <div className="stat-label">{t('logDetail.totalCards')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">{logStats.masteredCards}</div>
              <div className="stat-label">{t('logDetail.mastered')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">
                {logStats.retentionRate > 0
                  ? Math.round(logStats.retentionRate * 100) + '%'
                  : 'N/A'}
              </div>
              <div className="stat-label">{t('logDetail.retentionRate')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">
                {logStats.averageEaseFactor > 0
                  ? logStats.averageEaseFactor.toFixed(2)
                  : 'N/A'}
              </div>
              <div className="stat-label">{t('logDetail.avgEase')}</div>
            </Card>
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">
          {cards ? t('logDetail.cardsCount', { count: cards.length }) : t('logDetail.cardsTitle')}
        </h2>
        {cardsLoading ? (
          <Spinner />
        ) : !cards || cards.length === 0 ? (
          <Card variant="flat" pad="lg" className="empty-state">
            <p>{t('logDetail.noCards')}</p>
          </Card>
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
