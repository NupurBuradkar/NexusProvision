import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './pages/Dashboard';
import { DeveloperList } from './pages/DeveloperList';
import { DeveloperDetail } from './pages/DeveloperDetail';
import { EmployeePortal } from './pages/EmployeePortal';
import { Settings } from './pages/Settings';
import { ThemeSelector } from './components/ThemeSelector';
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  Lock,
  Mail,
  Activity,
  Layers,
  Sparkles,
  UserCheck,
  Shield,
  Briefcase,
  Terminal,
  Cpu,
  Database,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

const DESIGNATION_PRESETS = [
  { id: 'backend', title: 'Senior Backend Engineer', team: 'Backend', icon: <Terminal size={15} /> },
  { id: 'frontend', title: 'Lead Frontend UI Architect', team: 'Frontend', icon: <Layers size={15} /> },
  { id: 'sre', title: 'Staff Site Reliability Engineer', team: 'DevOps', icon: <Cpu size={15} /> },
  { id: 'data', title: 'Senior Data Platform Engineer', team: 'Data Platform', icon: <Database size={15} /> },
  { id: 'security', title: 'Cloud Security Specialist', team: 'Security', icon: <Shield size={15} /> },
  { id: 'mobile', title: 'Senior Mobile Engineer', team: 'Mobile', icon: <Smartphone size={15} /> },
];

const PRESET_EMPLOYEES = [
  { name: 'Alex Rivera', email: 'alex.rivera@example.com', desig: 'Senior Platform Engineer', team: 'Backend' },
  { name: 'Priya Patel', email: 'priya.patel@example.com', desig: 'Staff Site Reliability Engineer', team: 'DevOps' },
  { name: 'Marcus Vance', email: 'marcus.vance@example.com', desig: 'Lead Design System Engineer', team: 'Frontend' },
];

export const App: React.FC = () => {
  const { user, developerId, loading, isAuthenticated, isEmployee, login, employeeLogin, logout, hasRole } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<number | null>(null);

  // Login Mode Switcher ('admin' or 'employee')
  const [loginMode, setLoginMode] = useState<'admin' | 'employee'>('employee');

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('admin@seqa.dev');
  const [adminPassword, setAdminPassword] = useState('AdminPass123!');

  // Employee Login State
  const [selectedDesignation, setSelectedDesignation] = useState(DESIGNATION_PRESETS[0]);
  const [employeeEmail, setEmployeeEmail] = useState(PRESET_EMPLOYEES[0].email);
  const [employeeName, setEmployeeName] = useState(PRESET_EMPLOYEES[0].name);

  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      await login(adminEmail, adminPassword);
      setCurrentView('dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthenticating(false);
    }
  };

  // Handle Employee Login
  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      await employeeLogin({
        email: employeeEmail,
        full_name: employeeName,
        designation: selectedDesignation.title,
        team: selectedDesignation.team,
      });
      setCurrentView('employee-hub');
    } catch (err: any) {
      setAuthError(err.message || 'Employee login failed');
    } finally {
      setAuthenticating(false);
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

  if (loading && !user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <Activity className="spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  // Login Gate
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 20%, var(--primary-glow) 0%, transparent 65%), var(--bg-app)', padding: 20 }}>
        <div className="card modal-content" style={{ maxWidth: 520, width: '100%' }}>
          {/* Top Theme Quick Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <ThemeSelector />
          </div>

          {/* Logo & Rebranded Title */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="brand-logo-badge" style={{ width: 50, height: 50, margin: '0 auto 12px' }}>
              <Layers size={28} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              NEXUS PROVISION
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Enterprise Developer Onboarding & Cloud Provisioning Orchestration
            </p>
          </div>

          {/* Segmented Mode Switcher: Admin Login vs Employee Login */}
          <div className="login-mode-switcher">
            <button
              type="button"
              className={`login-mode-tab ${loginMode === 'employee' ? 'active' : ''}`}
              onClick={() => { setLoginMode('employee'); setAuthError(null); }}
            >
              <UserCheck size={16} /> Employee / Developer Sign-In
            </button>
            <button
              type="button"
              className={`login-mode-tab ${loginMode === 'admin' ? 'active' : ''}`}
              onClick={() => { setLoginMode('admin'); setAuthError(null); }}
            >
              <Shield size={16} /> Administrator / IT Sign-In
            </button>
          </div>

          {authError && (
            <div style={{ background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              {authError}
            </div>
          )}

          {/* Tab 1: Employee Portal Sign-In with Designation Sub-Options */}
          {loginMode === 'employee' && (
            <form onSubmit={handleEmployeeLogin}>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={14} color="var(--primary)" /> 1. Choose Your Engineering Designation / Role
                </label>
                <div className="designation-grid">
                  {DESIGNATION_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className={`designation-card ${selectedDesignation.id === preset.id ? 'selected' : ''}`}
                      onClick={() => setSelectedDesignation(preset)}
                    >
                      {preset.icon}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preset.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-option 2: Pick an existing demo engineer or custom */}
              <div className="form-group">
                <label className="form-label">2. Select Onboarding Account</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {PRESET_EMPLOYEES.map((emp) => (
                    <button
                      key={emp.email}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.75rem',
                        borderColor: employeeEmail === emp.email ? 'var(--primary)' : 'var(--border-subtle)',
                        background: employeeEmail === emp.email ? 'var(--bg-tag)' : 'transparent',
                      }}
                      onClick={() => {
                        setEmployeeEmail(emp.email);
                        setEmployeeName(emp.name);
                        const match = DESIGNATION_PRESETS.find((p) => p.team === emp.team);
                        if (match) setSelectedDesignation(match);
                      }}
                    >
                      {emp.name} ({emp.desig.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 14, padding: 12 }} disabled={authenticating}>
                {authenticating ? 'Entering Hub...' : `Launch Onboarding Workspace as ${selectedDesignation.title}`}
              </button>
            </form>
          )}

          {/* Tab 2: Administrator / IT Sign-In */}
          {loginMode === 'admin' && (
            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <label className="form-label">Administrator Work Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    className="form-input"
                    style={{ width: '100%', paddingLeft: 38 }}
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
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
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 14, padding: 12 }} disabled={authenticating}>
                {authenticating ? 'Authenticating...' : 'Sign In as Administrator'}
              </button>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pre-seeded Demo Accounts:</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => { setAdminEmail('admin@seqa.dev'); setAdminPassword('AdminPass123!'); }}
                  >
                    Admin (admin@seqa.dev)
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => { setAdminEmail('manager@seqa.dev'); setAdminPassword('ManagerPass123!'); }}
                  >
                    Manager (manager@seqa.dev)
                  </button>
                </div>
              </div>
            </form>
          )}
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
            <div className="brand-title">NexusProvision</div>
            <div className="brand-subtitle">Orchestration Platform</div>
          </div>
        </div>

        <nav className="nav-menu">
          {isEmployee && developerId ? (
            <div
              className={`nav-item ${currentView === 'employee-hub' ? 'active' : ''}`}
              onClick={() => handleNavigate('employee-hub')}
            >
              <UserCheck size={18} />
              <span>My Onboarding Hub</span>
            </div>
          ) : null}

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
            <span>Engineers Cohort</span>
          </div>

          <div
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('settings')}
          >
            <SettingsIcon size={18} />
            <span>Governance & Catalog</span>
          </div>
        </nav>

        {/* User profile strip */}
        <div className="user-profile-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="user-avatar-circle">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
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
            <LogOut size={16} color="var(--text-muted)" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>NexusProvision /</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {currentView.replace('-', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Live Theme Switcher */}
            <ThemeSelector />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}>
              <ShieldCheck size={14} />
              <span>SOC2 Audit Active</span>
            </div>
          </div>
        </header>

        <main className="page-content-area">
          {currentView === 'employee-hub' && developerId && (
            <EmployeePortal
              developerId={developerId}
              onSwitchToAdmin={() => handleNavigate('dashboard')}
              canSwitchToAdmin={canManage}
            />
          )}

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
