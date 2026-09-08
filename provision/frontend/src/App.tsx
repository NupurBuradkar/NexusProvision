import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './pages/Dashboard';
import { DeveloperList } from './pages/DeveloperList';
import { DeveloperDetail } from './pages/DeveloperDetail';
import { Settings } from './pages/Settings';
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  GitBranch,
  Lock,
  Mail,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading, isAuthenticated, login, logout, hasRole } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<number | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@seqa.dev');
  const [loginPassword, setLoginPassword] = useState('AdminPass123!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      await login(loginEmail, loginPassword);
      setCurrentView('dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleNavigate = (view: string, devId?: number) => {
    if (devId) {
      setSelectedDeveloperId(devId);
      setCurrentView('developer-detail');
    } else {
      setCurrentView(view);
    }
  };

  // Loading state
  if (loading && !user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b12' }}>
        <Activity className="spin" size={32} color="#6366f1" />
      </div>
    );
  }

  // Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), #080b12', padding: 20 }}>
        <div className="card modal-content" style={{ maxWidth: 440, width: '100%', position: 'relative' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="brand-logo-badge" style={{ width: 48, height: 48, margin: '0 auto 12px' }}>
              <Layers size={26} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>SEQA PROVISION</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Developer Onboarding & IT Provisioning Orchestration
            </p>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Enterprise Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 38 }}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 38 }}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 14, padding: 12 }} disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Demo Credentials Hint */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#818cf8" /> Pre-seeded Demo Credentials:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Admin:</span>
              <span className="code-badge" style={{ cursor: 'pointer' }} onClick={() => { setLoginEmail('admin@seqa.dev'); setLoginPassword('AdminPass123!'); }}>
                admin@seqa.dev / AdminPass123!
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Manager:</span>
              <span className="code-badge" style={{ cursor: 'pointer' }} onClick={() => { setLoginEmail('manager@seqa.dev'); setLoginPassword('ManagerPass123!'); }}>
                manager@seqa.dev / ManagerPass123!
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = hasRole(['admin']);
  const canManage = hasRole(['admin', 'manager']);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <Layers size={22} />
          </div>
          <div>
            <div className="brand-title">SEQA</div>
            <div className="brand-subtitle">Provision Platform</div>
          </div>
        </div>

        <nav className="nav-menu">
          <div
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${currentView === 'developers' || currentView === 'developer-detail' ? 'active' : ''}`}
            onClick={() => handleNavigate('developers')}
          >
            <Users size={18} />
            <span>Engineers</span>
          </div>

          <div
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('settings')}
          >
            <SettingsIcon size={18} />
            <span>Governance</span>
          </div>
        </nav>

        {/* User profile strip */}
        <div className="user-profile-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="user-avatar-circle">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {user?.role}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 8px', border: 'none' }}
            title="Sign out"
            onClick={logout}
          >
            <LogOut size={16} color="#94a3b8" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workspace /</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
              {currentView.replace('-', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 9999 }}>
              <ShieldCheck size={14} />
              <span>SOC2 Audit Active</span>
            </div>
          </div>
        </header>

        <main className="page-content-area">
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} />
          )}

          {currentView === 'developers' && (
            <DeveloperList
              onSelectDeveloper={(id) => handleNavigate('developer-detail', id)}
              canManage={canManage}
              isAdmin={isAdmin}
            />
          )}

          {currentView === 'developer-detail' && selectedDeveloperId && (
            <DeveloperDetail
              developerId={selectedDeveloperId}
              onBack={() => handleNavigate('developers')}
              canManage={canManage}
            />
          )}

          {currentView === 'settings' && (
            <Settings isAdmin={isAdmin} />
          )}
        </main>
      </div>
    </div>
  );
};
