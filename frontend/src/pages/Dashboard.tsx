import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { statsApi, cardsApi } from '../api/client';
import { Card } from '../components/Card';
import { LinkButton } from '../components/Button';
import { Spinner } from '../components/Spinner';
import type { DailyActivity } from '../types';

function getHeatmapColor(count: number): string {
  if (count === 0) return 'color-mix(in srgb, var(--primary) 8%, var(--bg))';
  if (count < 5)  return 'color-mix(in srgb, var(--primary) 25%, transparent)';
  if (count < 10) return 'color-mix(in srgb, var(--primary) 50%, transparent)';
  if (count < 20) return 'color-mix(in srgb, var(--primary) 75%, transparent)';
  return 'var(--primary)';
}

function buildHeatmapGrid(activities: DailyActivity[]): Array<{ date: string; count: number }[]> {
  const map: Record<string, number> = {};
  for (const a of activities) {
    map[a.date] = a.cardsReviewed;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const cols: Array<{ date: string; count: number }[]> = [];
  let current = new Date(startDate);

  while (current <= today) {
    const col: { date: string; count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const dateStr = current.toISOString().split('T')[0];
      col.push({ date: dateStr, count: map[dateStr] ?? 0 });
      current.setDate(current.getDate() + 1);
    }
    cols.push(col);
  }

  return cols;
}

function Heatmap({ activities }: { activities: DailyActivity[] }) {
  const { t } = useTranslation();
  const grid = buildHeatmapGrid(activities);

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap">
        {grid.map((col, ci) => (
          <div key={ci} className="heatmap-col">
            {col.map((cell) => (
              <div
                key={cell.date}
                className="heatmap-cell"
                style={{ backgroundColor: getHeatmapColor(cell.count) }}
                title={t('dashboard.cardsTooltip', { date: cell.date, count: cell.count })}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>{t('dashboard.heatmapLess')}</span>
        {[0, 3, 7, 14, 20].map((n) => (
          <div
            key={n}
            className="heatmap-cell"
            style={{ backgroundColor: getHeatmapColor(n) }}
          />
        ))}
        <span>{t('dashboard.heatmapMore')}</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: statsApi.overview,
  });

  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['stats', 'heatmap'],
    queryFn: statsApi.heatmap,
  });

  const { data: dueCards } = useQuery({
    queryKey: ['cards', 'due'],
    queryFn: () => cardsApi.due(),
  });

  const dueCount = dueCards?.length ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
      </div>

      <Card variant="tinted" pad="md" className="study-banner">
        {dueCount > 0 ? (
          <>
            <div>
              <h3>{t('dashboard.readyToStudy')}</h3>
              <p>{t('dashboard.cardsDue', { count: dueCount })}</p>
            </div>
            <LinkButton to="/study" variant="primary">
              {t('dashboard.startReview')}
            </LinkButton>
          </>
        ) : (
          <>
            <div>
              <h3>{t('dashboard.allCaughtUp')}</h3>
              <p>{t('dashboard.noDue')}</p>
            </div>
            <LinkButton to="/logs" variant="secondary">
              {t('dashboard.browseLogs')}
            </LinkButton>
          </>
        )}
      </Card>

      <div className="section">
        <h2 className="section-title">{t('dashboard.overview')}</h2>
        {overviewLoading ? (
          <Spinner />
        ) : overview ? (
          <div className="stats-grid">
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">{overview.totalReviewed.toLocaleString()}</div>
              <div className="stat-label">{t('dashboard.totalReviewed')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">{overview.totalCorrect.toLocaleString()}</div>
              <div className="stat-label">{t('dashboard.totalCorrect')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">
                {overview.totalReviewed > 0
                  ? Math.round((overview.totalCorrect / overview.totalReviewed) * 100)
                  : 0}%
              </div>
              <div className="stat-label">{t('dashboard.accuracy')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">{overview.currentStreak}</div>
              <div className="stat-label">{t('dashboard.currentStreak')}</div>
            </Card>
            <Card variant="flat" pad="sm" className="stat-card">
              <div className="stat-value">{overview.longestStreak}</div>
              <div className="stat-label">{t('dashboard.longestStreak')}</div>
            </Card>
          </div>
        ) : null}
      </div>

      <div className="section">
        <h2 className="section-title">{t('dashboard.activity')}</h2>
        <Card variant="elevated" pad="md">
          {heatmapLoading ? (
            <Spinner />
          ) : heatmap ? (
            <Heatmap activities={heatmap} />
          ) : null}
        </Card>
      </div>
    </div>
  );
}
