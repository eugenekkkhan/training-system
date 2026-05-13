import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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

    if (password !== confirm) {
      setError(t('register.passwordsMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await authApi.register(email, password);
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('register.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">{t('register.title')}</h1>
        <p className="auth-subtitle">{t('register.subtitle')}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('register.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('register.emailPlaceholder')}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('register.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('register.passwordPlaceholder')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">{t('register.confirmPassword')}</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('register.confirmPlaceholder')}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? t('register.submitting') : t('register.submit')}
          </button>
        </form>
        <p className="auth-footer">
          {t('register.hasAccount')} <Link to="/login">{t('register.signIn')}</Link>
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
      </div>
    </div>
  );
}
