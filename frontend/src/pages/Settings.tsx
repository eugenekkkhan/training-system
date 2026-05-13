import { useState, FormEvent, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi, notificationsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export function Settings() {
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const { data: userData } = useQuery({
    queryKey: ['user', 'settings'],
    queryFn: usersApi.getSettings,
  });

  const currentUser = userData ?? user;

  const [dailyGoal, setDailyGoal] = useState(currentUser?.settings?.dailyGoal ?? 20);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    currentUser?.settings?.notificationsEnabled ?? false
  );
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.settings) {
      setDailyGoal(currentUser.settings.dailyGoal);
      setNotificationsEnabled(currentUser.settings.notificationsEnabled);
    }
  }, [currentUser]);

  const updateMutation = useMutation({
    mutationFn: usersApi.updateSettings,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'settings'] });
      const token = localStorage.getItem('token');
      if (token) {
        login(token, updatedUser);
      }
      setSuccess(t('settings.saved'));
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('settings.saveFailed'));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    updateMutation.mutate({ dailyGoal, notificationsEnabled });
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setError('');

    if (enabled) {
      setPushLoading(true);
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setError(t('settings.notificationsNotSupported'));
          setNotificationsEnabled(false);
          setPushLoading(false);
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setError(t('settings.notificationsDenied'));
          setNotificationsEnabled(false);
          setPushLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const { publicKey } = await notificationsApi.getVapidPublicKey();
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await usersApi.savePushSubscription(subscription);
        updateMutation.mutate({ notificationsEnabled: true, dailyGoal });
      } catch (err: any) {
        setError(t('settings.notificationsFailed', { error: err.message || 'Unknown error' }));
        setNotificationsEnabled(false);
      } finally {
        setPushLoading(false);
      }
    } else {
      updateMutation.mutate({ notificationsEnabled: false, dailyGoal });
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
      </div>

      <div className="card settings-card">
        <h2 className="section-title">{t('settings.account')}</h2>
        <div className="setting-item">
          <span className="setting-label">{t('settings.emailLabel')}</span>
          <span className="setting-value">{currentUser?.email}</span>
        </div>
        <div className="setting-item">
          <span className="setting-label">{t('settings.roleLabel')}</span>
          <span className="setting-value setting-role">{currentUser?.role}</span>
        </div>
      </div>

      <div className="card settings-card">
        <h2 className="section-title">{t('settings.preferences')}</h2>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="daily-goal">{t('settings.dailyGoal')}</label>
            <input
              id="daily-goal"
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value) || 1)}
              min={1}
              max={500}
            />
            <span className="form-hint">{t('settings.dailyGoalHint')}</span>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                disabled={pushLoading || updateMutation.isPending}
              />
              {pushLoading ? t('settings.settingUpNotifications') : t('settings.notifications')}
            </label>
            <span className="form-hint">{t('settings.notificationsHint')}</span>
          </div>

          <div className="form-group">
            <label>{t('settings.language')}</label>
            <div className="lang-switcher">
              <button
                type="button"
                className={`btn btn-sm ${i18n.language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleLanguageChange('en')}
              >
                English
              </button>
              <button
                type="button"
                className={`btn btn-sm ${i18n.language === 'ru' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleLanguageChange('ru')}
              >
                Русский
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('settings.saving') : t('settings.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
