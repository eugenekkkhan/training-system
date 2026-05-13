import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{t('nav.title')}</h2>
        <span className="sidebar-email">{user?.email}</span>
      </div>
      <ul className="sidebar-links">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {t('nav.dashboard')}
          </NavLink>
        </li>
        <li>
          <NavLink to="/study" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {t('nav.study')}
          </NavLink>
        </li>
        <li>
          <NavLink to="/logs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {t('nav.logs')}
          </NavLink>
        </li>
        {user?.role === 'admin' && (
          <li>
            <NavLink to="/templates" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {t('nav.templates')}
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {t('nav.settings')}
          </NavLink>
        </li>
      </ul>
      <div className="sidebar-footer">
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          {t('nav.logout')}
        </button>
      </div>
    </nav>
  );
}
