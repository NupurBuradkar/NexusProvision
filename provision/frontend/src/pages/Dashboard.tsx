import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../types';
import { api } from '../api/client';
import { StatusTag } from '../components/StatusTag';
import {
  Users,
  CheckCircle2,
  Key,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string, devId?: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity className="spin" size={24} color="#6366f1" /> Loading Provisioning Telemetry...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'var(--color-danger-bg)' }}>
        <h3 style={{ color: '#fca5a5', marginBottom: 8 }}>Failed to load dashboard metrics</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={fetchStats}>
          Retry
        </button>
      </div>
    );
  }

  const kpis = stats?.kpis;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '3px 8px', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} /> SOC2 Ready Engine
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            Developer Provisioning Command Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 650, marginTop: 4 }}>
            Real-time orchestration overview of active software engineer onboardings, cloud infrastructure grants, and automated GitHub repositories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('settings')}>
            <ShieldCheck size={16} /> Audit & Systems
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('developers')}>
            <Users size={16} /> View All Engineers
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <span>Active Onboardings</span>
            <div className="stat-icon-wrapper" style={{ color: '#818cf8' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis?.active_onboardings ?? 0}</div>
          <div className="stat-subtext">
            Out of {kpis?.total_developers ?? 0} total registered engineers
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span>Checklist Velocity</span>
            <div className="stat-icon-wrapper" style={{ color: '#34d399' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis?.checklist_completion_rate ?? 0}%</div>
          <div className="stat-subtext">
            Global task completion across active cohorts
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span>Pending Entitlements</span>
            <div className="stat-icon-wrapper" style={{ color: '#fbbf24' }}>
              <Key size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis?.pending_access_requests ?? 0}</div>
          <div className="stat-subtext">
            {kpis?.active_access_grants ?? 0} systems actively provisioned
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span>Repositories Provisioned</span>
            <div className="stat-icon-wrapper" style={{ color: '#c084fc' }}>
              <GitBranch size={18} />
            </div>
          </div>
          <div className="stat-value">{kpis?.total_repos_provisioned ?? 0}</div>
          <div className="stat-subtext">
            {kpis?.pending_repos ?? 0} pending automated creation
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Team Velocity Breakdown & Recent Audit Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Team Distribution */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#60a5fa" />
              Onboarding Cohorts by Team
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department breakdown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats?.team_breakdown && Object.keys(stats.team_breakdown).length > 0 ? (
              Object.entries(stats.team_breakdown).map(([team, count]) => (
                <div key={team}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{team} Team</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} engineers</span>
                  </div>
                  <div className="progress-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, (count / (kpis?.total_developers || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No team data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Audit Stream */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="#34d399" />
              Live Compliance Audit Feed
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              onClick={() => onNavigate('settings')}
            >
              Full Log <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {stats?.recent_audit_logs && stats.recent_audit_logs.length > 0 ? (
              stats.recent_audit_logs.slice(0, 7).map((log) => (
                <div key={log.id} className="audit-entry">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="code-badge">{log.action}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.8rem' }}>
                        {log.target_type} #{log.target_id || ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      By {log.actor_email} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No audit events logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
