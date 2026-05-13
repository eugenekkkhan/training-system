import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logsApi, templatesApi } from '../api/client';
import { Card } from '../components/Card';
import { Button, LinkButton } from '../components/Button';
import { Spinner } from '../components/Spinner';
import type { Log } from '../types';

interface CreateLogFormProps {
  onClose: () => void;
}

function CreateLogForm({ onClose }: CreateLogFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: logsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('createLog.failed'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('createLog.nameRequired'));
      return;
    }
    setError('');
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      templateId: templateId || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Card pad="md">
          <Card.Header>
            <h3>{t('createLog.title')}</h3>
            <button className="btn-close" onClick={onClose}>×</button>
          </Card.Header>
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div className="form-group">
              <label htmlFor="log-name">{t('createLog.name')}</label>
              <input
                id="log-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('createLog.namePlaceholder')}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="log-description">{t('createLog.description')}</label>
              <textarea
                id="log-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('createLog.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="log-template">{t('createLog.template')}</label>
              <select
                id="log-template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">{t('createLog.noTemplate')}</option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <Card.Footer>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('createLog.cancel')}
              </Button>
              <Button type="submit" variant="primary" loading={createMutation.isPending}>
                {createMutation.isPending ? t('createLog.creating') : t('createLog.create')}
              </Button>
            </Card.Footer>
          </form>
        </Card>
      </div>
    </div>
  );
}

function LogCard({ log }: { log: Log }) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const deleteMutation = useMutation({
    mutationFn: () => logsApi.remove(log.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t('logs.deleteConfirm', { name: log.name }))) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card variant="elevated" pad="md" className="log-card">
      <div className="log-card-body">
        <div className="log-meta">
          {log.isGlobal && <span className="badge badge-global">{t('logs.global')}</span>}
          {log.templateId && <span className="badge badge-template">{t('logs.template')}</span>}
        </div>
        <h3 className="log-name">
          <Link to={`/logs/${log.id}`}>{log.name}</Link>
        </h3>
        {log.description && <p className="log-description">{log.description}</p>}
        <p className="log-date">{t('logs.created', { date: new Date(log.createdAt).toLocaleDateString() })}</p>
      </div>
      <div className="log-card-actions">
        <LinkButton to={`/logs/${log.id}`} variant="secondary" size="sm">
          {t('logs.view')}
        </LinkButton>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={deleteMutation.isPending}
        >
          {t('logs.delete')}
        </Button>
      </div>
    </Card>
  );
}

export function Logs() {
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useTranslation();

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['logs'],
    queryFn: logsApi.list,
  });

  if (isLoading) return <Spinner />;

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{t('logs.failed')}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('logs.title')}</h1>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          {t('logs.newLog')}
        </Button>
      </div>

      {showCreate && <CreateLogForm onClose={() => setShowCreate(false)} />}

      {!logs || logs.length === 0 ? (
        <Card variant="flat" pad="lg" className="empty-state">
          <h3>{t('logs.noLogs')}</h3>
          <p>{t('logs.createFirst')}</p>
          <Button variant="primary" onClick={() => setShowCreate(true)} style={{ marginTop: 16 }}>
            {t('logs.createLog')}
          </Button>
        </Card>
      ) : (
        <div className="logs-list">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
