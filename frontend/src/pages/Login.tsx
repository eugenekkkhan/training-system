import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, token } = await authApi.login(email, password);
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card variant="elevated" pad="lg" className="auth-card">
        <h1 className="auth-title">{t('login.title')}</h1>
        <p className="auth-subtitle">{t('login.subtitle')}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              required
            />
          </div>
          <Button type="submit" variant="primary" full loading={loading}>
            {loading ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
        <p className="auth-footer">
          {t('login.noAccount')} <Link to="/register">{t('login.register')}</Link>
        </p>
        <div className="auth-lang-switcher">
          <button
            type="button"
            className={`auth-lang-btn${i18n.language === 'en' ? ' active' : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
          <button
            type="button"
            className={`auth-lang-btn${i18n.language === 'ru' ? ' active' : ''}`}
            onClick={() => handleLanguageChange('ru')}
          >
            Русский
          </button>
        </div>
      </Card>
    </div>
  );
}
