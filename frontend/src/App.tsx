import { useState } from 'react';
import { MdMenu } from 'react-icons/md';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from './components/Spinner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Nav } from './components/Nav';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Study } from './pages/Study';
import { Logs } from './pages/Logs';
import { LogDetail } from './pages/LogDetail';
import { Templates } from './pages/Templates';
import { Settings } from './pages/Settings';

function AppLayout() {
  const { token, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarOpen');
    if (stored !== null) return stored === 'true';
    return window.innerWidth > 768;
  });

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    localStorage.setItem('sidebarOpen', String(next));
    setSidebarOpen(next);
  };

  const handleNavigate = () => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  if (isLoading) return <Spinner />;

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Nav isOpen={sidebarOpen} onToggle={toggleSidebar} onNavigate={handleNavigate} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar} />}
      <main className="main-content">
        {!sidebarOpen && (
          <button
            className="sidebar-open-btn"
            onClick={toggleSidebar}
            aria-label="Open menu"
          >
            <MdMenu size={20} />
          </button>
        )}
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/study" element={<ProtectedRoute><Study /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/logs/:logId" element={<ProtectedRoute><LogDetail /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
