import { useState, FormEvent, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi, notificationsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, ALL_COLOR_VARS } from '../contexts/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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

const COLOR_GROUPS: { groupKey: string; vars: { key: string; varKey: string }[] }[] = [
  {
    groupKey: 'settings.colors.groups.accent',
    vars: [
      { key: '--primary',       varKey: 'settings.colors.vars.primary'      },
      { key: '--primary-dark',  varKey: 'settings.colors.vars.primaryDark'  },
      { key: '--primary-light', varKey: 'settings.colors.vars.primaryLight' },
    ],
  },
  {
    groupKey: 'settings.colors.groups.surfaces',
    vars: [
      { key: '--bg',        varKey: 'settings.colors.vars.bg'       },
      { key: '--card-bg',   varKey: 'settings.colors.vars.cardBg'   },
      { key: '--input-bg',  varKey: 'settings.colors.vars.inputBg'  },
      { key: '--surface-2', varKey: 'settings.colors.vars.surface2' },
      { key: '--hover-bg',  varKey: 'settings.colors.vars.hoverBg'  },
    ],
  },
  {
    groupKey: 'settings.colors.groups.text',
    vars: [
      { key: '--text',       varKey: 'settings.colors.vars.text'      },
      { key: '--text-muted', varKey: 'settings.colors.vars.textMuted' },
    ],
  },
  {
    groupKey: 'settings.colors.groups.border',
    vars: [
      { key: '--border', varKey: 'settings.colors.vars.border' },
    ],
  },
  {
    groupKey: 'settings.colors.groups.semantic',
    vars: [
      { key: '--success', varKey: 'settings.colors.vars.success' },
      { key: '--danger',  varKey: 'settings.colors.vars.danger'  },
      { key: '--warning', varKey: 'settings.colors.vars.warning' },
    ],
  },
  {
    groupKey: 'settings.colors.groups.sidebar',
    vars: [
      { key: '--sidebar-bg',   varKey: 'settings.colors.vars.sidebarBg'   },
      { key: '--sidebar-text', varKey: 'settings.colors.vars.sidebarText' },
    ],
  },
  {
    groupKey: 'settings.colors.groups.hint',
    vars: [
      { key: '--hint-bg',         varKey: 'settings.colors.vars.hintBg'     },
      { key: '--hint-text-color', varKey: 'settings.colors.vars.hintText'   },
      { key: '--hint-border',     varKey: 'settings.colors.vars.hintBorder' },
    ],
  },
  {
    groupKey: 'settings.colors.groups.alerts',
    vars: [
      { key: '--alert-error-bg',       varKey: 'settings.colors.vars.alertErrorBg'      },
      { key: '--alert-error-text',     varKey: 'settings.colors.vars.alertErrorText'    },
      { key: '--alert-error-border',   varKey: 'settings.colors.vars.alertErrorBorder'  },
      { key: '--alert-success-bg',     varKey: 'settings.colors.vars.alertSuccessBg'    },
      { key: '--alert-success-border', varKey: 'settings.colors.vars.alertSuccessBorder'},
    ],
  },
];

function getCSSVarHex(key: string): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(val)) return val;
  return '#000000';
}

export function Settings() {
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { customColors, setCustomColors } = useTheme();

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

  // Local copy of custom colors for live-editing
  const [localColors, setLocalColors] = useState<Record<string, string>>({ ...customColors });

  useEffect(() => {
    if (currentUser?.settings) {
      setDailyGoal(currentUser.settings.dailyGoal);
      setNotificationsEnabled(currentUser.settings.notificationsEnabled);
    }
  }, [currentUser]);

  // Keep local colors in sync when customColors change (e.g. on initial load from backend)
  useEffect(() => {
    setLocalColors({ ...customColors });
  }, [customColors]);

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
    updateMutation.mutate({ dailyGoal, notificationsEnabled, customColors: localColors });
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

  const handleColorChange = (key: string, value: string) => {
    const next = { ...localColors, [key]: value };
    setLocalColors(next);
    setCustomColors(next);
  };

  const resetColor = (key: string) => {
    const next = { ...localColors };
    delete next[key];
    setLocalColors(next);
    setCustomColors(next);
  };

  const resetAllColors = () => {
    setLocalColors({});
    setCustomColors({});
  };

  const hasAnyCustomColor = Object.keys(localColors).length > 0;

  const isDirty = useMemo(() => {
    const s = currentUser?.settings;
    if (!s) return false;
    if (dailyGoal !== s.dailyGoal || notificationsEnabled !== s.notificationsEnabled) return true;
    const serverColors = s.customColors ?? {};
    const localKeys = Object.keys(localColors);
    const serverKeys = Object.keys(serverColors);
    if (localKeys.length !== serverKeys.length) return true;
    return localKeys.some(k => localColors[k] !== serverColors[k]);
  }, [dailyGoal, notificationsEnabled, localColors, currentUser]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
      </div>

      <Card pad="md" className="settings-card">
        <Card.Header>
          <h3>{t('settings.account')}</h3>
        </Card.Header>
        <div className="setting-item">
          <span className="setting-label">{t('settings.emailLabel')}</span>
          <span className="setting-value">{currentUser?.email}</span>
        </div>
        <div className="setting-item">
          <span className="setting-label">{t('settings.roleLabel')}</span>
          <span className="setting-value setting-role">{currentUser?.role}</span>
        </div>
      </Card>

      <Card pad="md" className="settings-card">
        <Card.Header>
          <h3>{t('settings.preferences')}</h3>
        </Card.Header>

        {success && <div className="alert alert-success" style={{ marginTop: 16 }}>{success}</div>}
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
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
              <Button
                type="button"
                size="sm"
                variant={i18n.language === 'en' ? 'primary' : 'secondary'}
                onClick={() => handleLanguageChange('en')}
              >
                English
              </Button>
              <Button
                type="button"
                size="sm"
                variant={i18n.language === 'ru' ? 'primary' : 'secondary'}
                onClick={() => handleLanguageChange('ru')}
              >
                Русский
              </Button>
            </div>
          </div>

          <div className="form-group">
            <div className="color-editor-header">
              <label>{t('settings.colors.title')}</label>
              {hasAnyCustomColor && (
                <Button type="button" size="sm" variant="ghost" onClick={resetAllColors}>
                  {t('settings.colors.resetAll')}
                </Button>
              )}
            </div>
            <div className="color-editor">
              {COLOR_GROUPS.map((group) => (
                <div key={group.groupKey} className="color-editor-group">
                  <span className="color-editor-group-label">{t(group.groupKey)}</span>
                  <div className="color-editor-items">
                    {group.vars.map(({ key, varKey }) => {
                      const isCustom = !!localColors[key];
                      const value = localColors[key] || getCSSVarHex(key);
                      return (
                        <div key={key} className={`color-editor-item${isCustom ? ' color-editor-item--custom' : ''}`}>
                          <label className="color-editor-swatch-label">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              className="color-editor-input"
                            />
                            <span
                              className="color-editor-preview"
                              style={{ background: value }}
                            />
                          </label>
                          <span className="color-editor-name">{t(varKey)}</span>
                          {isCustom && (
                            <button
                              type="button"
                              className="color-editor-reset"
                              onClick={() => resetColor(key)}
                              title={t('settings.colors.resetTooltip')}
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card.Footer>
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty}
              loading={updateMutation.isPending}
            >
              {updateMutation.isPending ? t('settings.saving') : t('settings.save')}
            </Button>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
}
