import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { templatesApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import type { Template, TemplateResult } from '../types';

const DEFAULT_CODE = `({ a, b }) => ({
  question: \`What is \${a} + \${b}?\`,
  answer: a + b,
  hint: "Just add the numbers",
  explanation: \`\${a} + \${b} = \${a + b}\`
})`;

const DEFAULT_SCHEMA = `{
  "a": { "type": "int", "min": 1, "max": 100 },
  "b": { "type": "int", "min": 1, "max": 100 }
}`;

interface TemplateFormProps {
  template?: Template;
  onClose: () => void;
}

function TemplateForm({ template, onClose }: TemplateFormProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [code, setCode] = useState(template?.code ?? DEFAULT_CODE);
  const [inputSchema, setInputSchema] = useState(
    template ? JSON.stringify(template.inputSchema, null, 2) : DEFAULT_SCHEMA
  );
  const [isGlobal, setIsGlobal] = useState(template?.isGlobal ?? false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.message || t('templateForm.createFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Template>) => templatesApi.update(template!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.message || t('templateForm.updateFailed')),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    let parsedSchema: Record<string, any>;
    try {
      parsedSchema = JSON.parse(inputSchema);
    } catch {
      setError(t('templateForm.invalidJson'));
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      code: code.trim(),
      inputSchema: parsedSchema,
      isGlobal,
    };

    if (template) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <Card pad="md">
          <Card.Header>
            <h3>{template ? t('templateForm.edit') : t('templateForm.create')}</h3>
            <button className="btn-close" onClick={onClose}>×</button>
          </Card.Header>
          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tmpl-name">{t('templateForm.name')}</label>
                <input
                  id="tmpl-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('templateForm.namePlaceholder')}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group form-check-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                  />
                  {t('templateForm.global')}
                </label>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="tmpl-description">{t('templateForm.description')}</label>
              <input
                id="tmpl-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('templateForm.descriptionPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tmpl-code">{t('templateForm.code')}</label>
              <textarea
                id="tmpl-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={8}
                className="code-editor"
                placeholder={DEFAULT_CODE}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tmpl-schema">{t('templateForm.schema')}</label>
              <textarea
                id="tmpl-schema"
                value={inputSchema}
                onChange={(e) => setInputSchema(e.target.value)}
                rows={6}
                className="code-editor"
                placeholder={DEFAULT_SCHEMA}
                required
              />
            </div>
            <Card.Footer>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('templateForm.cancel')}
              </Button>
              <Button type="submit" variant="primary" loading={isPending}>
                {isPending
                  ? t('templateForm.saving')
                  : template
                    ? t('templateForm.save')
                    : t('templateForm.createBtn')}
              </Button>
            </Card.Footer>
          </form>
        </Card>
      </div>
    </div>
  );
}

interface TestFormProps {
  template: Template;
}

function TestForm({ template }: TestFormProps) {
  const [inputs, setInputs] = useState(() => {
    const examples: Record<string, any> = {};
    for (const [key, spec] of Object.entries(template.inputSchema)) {
      if (spec.type === 'int') {
        examples[key] = spec.min ?? 1;
      } else if (spec.type === 'float') {
        examples[key] = spec.min ?? 0.0;
      } else {
        examples[key] = '';
      }
    }
    return JSON.stringify(examples, null, 2);
  });
  const [result, setResult] = useState<TemplateResult | null>(null);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const testMutation = useMutation({
    mutationFn: (parsedInputs: Record<string, any>) =>
      templatesApi.test(template.id, parsedInputs),
    onSuccess: (data) => {
      setResult(data);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('testForm.failed'));
      setResult(null);
    },
  });

  const handleTest = (e: FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(inputs);
      testMutation.mutate(parsed);
    } catch {
      setError(t('testForm.invalidJson'));
    }
  };

  return (
    <div className="test-form">
      <h4>{t('testForm.title')}</h4>
      <form onSubmit={handleTest}>
        <div className="form-group">
          <label>{t('testForm.inputs')}</label>
          <textarea
            value={inputs}
            onChange={(e) => setInputs(e.target.value)}
            rows={4}
            className="code-editor"
          />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={testMutation.isPending}
        >
          {testMutation.isPending ? t('testForm.testing') : t('testForm.test')}
        </Button>
      </form>
      {result && (
        <Card.Inset style={{ marginTop: 14 }}>
          <div className="test-result-item">
            <strong>{t('testForm.question')}</strong> {result.question}
          </div>
          <div className="test-result-item">
            <strong>{t('testForm.answer')}</strong> {String(result.answer)}
          </div>
          {result.hint && (
            <div className="test-result-item">
              <strong>{t('testForm.hint')}</strong> {result.hint}
            </div>
          )}
          {result.explanation && (
            <div className="test-result-item">
              <strong>{t('testForm.explanation')}</strong> {result.explanation}
            </div>
          )}
          {result.choices && (
            <div className="test-result-item">
              <strong>{t('testForm.choices')}</strong> {result.choices.join(', ')}
            </div>
          )}
        </Card.Inset>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  isAdmin: boolean;
}

function TemplateCard({ template, isAdmin }: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const deleteMutation = useMutation({
    mutationFn: () => templatesApi.remove(template.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleDelete = () => {
    if (confirm(t('templates.deleteConfirm', { name: template.name }))) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      {editing && <TemplateForm template={template} onClose={() => setEditing(false)} />}
      <Card variant="elevated" pad="none" className="template-card">
        <div className="template-header" onClick={() => setExpanded((x) => !x)}>
          <div className="template-meta">
            <div className="template-badges">
              {template.isGlobal && <span className="badge badge-global">{t('templates.global')}</span>}
            </div>
            <h3 className="template-name">{template.name}</h3>
            {template.description && (
              <p className="template-description">{template.description}</p>
            )}
          </div>
          <div className="template-actions" onClick={(e) => e.stopPropagation()}>
            {isAdmin && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  {t('templates.edit')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={deleteMutation.isPending}
                >
                  {t('templates.delete')}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((x) => !x)}
            >
              {expanded ? t('templates.collapse') : t('templates.expand')}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="template-details">
            <div className="form-group">
              <label>{t('templates.codeLabel')}</label>
              <pre className="code-preview">{template.code}</pre>
            </div>
            <div className="form-group">
              <label>{t('templates.schemaLabel')}</label>
              <pre className="code-preview">{JSON.stringify(template.inputSchema, null, 2)}</pre>
            </div>
            <TestForm template={template} />
          </div>
        )}
      </Card>
    </>
  );
}

export function Templates() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const isAdmin = user?.role === 'admin';
  const { t } = useTranslation();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: templatesApi.list,
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('templates.title')}</h1>
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            {t('templates.newTemplate')}
          </Button>
        )}
      </div>

      {showCreate && <TemplateForm onClose={() => setShowCreate(false)} />}

      {isLoading && <Spinner />}
      {error && <div className="alert alert-error">{t('templates.failed')}</div>}

      {!isLoading && templates && templates.length === 0 && (
        <Card variant="flat" pad="lg" className="empty-state">
          <h3>{t('templates.noTemplates')}</h3>
          {isAdmin ? (
            <p>{t('templates.noTemplatesAdmin')}</p>
          ) : (
            <p>{t('templates.noTemplatesUser')}</p>
          )}
        </Card>
      )}

      <div className="templates-list">
        {templates?.map((template) => (
          <TemplateCard key={template.id} template={template} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}
