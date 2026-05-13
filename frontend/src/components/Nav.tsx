import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MdDashboard,
  MdSchool,
  MdLibraryBooks,
  MdCode,
  MdSettings,
  MdChevronLeft,
  MdMenu,
} from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

interface NavProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export function Nav({ isOpen, onToggle, onNavigate }: NavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <nav className={`sidebar${isOpen ? '' : ' sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h2 className="sidebar-title">{t('nav.title')}</h2>
          <button className="sidebar-toggle" onClick={onToggle} aria-label="Close menu">
            <MdChevronLeft size={22} />
          </button>
        </div>
        <span className="sidebar-email">{user?.email}</span>
      </div>
      <ul className="sidebar-links">
        <li>
          <NavLink to="/" end className={navClass} onClick={onNavigate}>
            <MdDashboard className="nav-icon" />
            {t('nav.dashboard')}
          </NavLink>
        </li>
        <li>
          <NavLink to="/study" className={navClass} onClick={onNavigate}>
            <MdSchool className="nav-icon" />
            {t('nav.study')}
          </NavLink>
        </li>
        <li>
          <NavLink to="/logs" className={navClass} onClick={onNavigate}>
            <MdLibraryBooks className="nav-icon" />
            {t('nav.logs')}
          </NavLink>
        </li>
        {user?.role === 'admin' && (
          <li>
            <NavLink to="/templates" className={navClass} onClick={onNavigate}>
              <MdCode className="nav-icon" />
              {t('nav.templates')}
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/settings" className={navClass} onClick={onNavigate}>
            <MdSettings className="nav-icon" />
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
