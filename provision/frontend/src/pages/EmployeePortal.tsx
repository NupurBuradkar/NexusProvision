import React, { useState, useEffect, useCallback } from 'react';
import { Developer, DeveloperProgressSummary } from '../types';
import { api } from '../api/client';
import { ChecklistPanel } from '../components/ChecklistPanel';
import { AccessPanel } from '../components/AccessPanel';
import { RepoPanel } from '../components/RepoPanel';
import { StatusTag } from '../components/StatusTag';
import {
  ShieldCheck,
  Key,
  GitBranch,
  Mail,
  Github,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Rocket,
  ArrowRight,
} from 'lucide-react';

interface EmployeePortalProps {
  developerId: number;
  onSwitchToAdmin?: () => void;
  canSwitchToAdmin?: boolean;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  developerId,
  onSwitchToAdmin,
  canSwitchToAdmin,
}) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [progress, setProgress] = useState<DeveloperProgressSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'access' | 'repos'>('checklist');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [devData, progData] = await Promise.all([
        api.developers.get(developerId),
        api.developers.getProgress(developerId),
      ]);
      setDeveloper(devData);
      setProgress(progData);
    } catch (err: any) {
      console.error('Failed to load employee data:', err);
    } finally {
      setLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !developer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <RefreshCw className="spin" size={24} color="var(--primary)" />
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <h3>Onboarding Profile Initializing...</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Setting up your personalized engineering workspace.
        </p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={loadData}>
          Refresh Workspace
        </button>
      </div>
    );
  }

  const isCompleted = progress?.overall_progress_percentage === 100;

  return (
    <div className="employee-portal">
      {/* Welcome Hero Banner */}
      <div className="employee-header-banner">
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div className="user-avatar-circle" style={{ width: 62, height: 62, fontSize: '1.6rem' }}>
            {developer.full_name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', background: 'var(--bg-tag)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Rocket size={12} /> Employee Onboarding Hub
              </span>
              <StatusTag status={developer.status} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, marginTop: 4 }}>
              Welcome, {developer.full_name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {developer.role_title}
              </span>
              <span>•</span>
              <span className="code-badge">{developer.team} Team</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> {developer.email}
              </span>
              {developer.github_username && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)' }}>
                  <Github size={14} /> @{developer.github_username}
                </span>
              )}
            </div>
          </div>
        </div>

        {canSwitchToAdmin && onSwitchToAdmin && (
          <button className="btn btn-secondary btn-sm" onClick={onSwitchToAdmin}>
            Switch to Management View <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Progress Metric Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Your Onboarding Completion Readiness
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Complete the checklist tasks and verify system permissions below to graduate to fully provisioned.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: isCompleted ? 'var(--color-success)' : 'var(--primary)' }}>
              {progress?.overall_progress_percentage ?? 0}%
            </span>
          </div>
        </div>

        <div className="progress-container" style={{ height: 10 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress?.overall_progress_percentage ?? 0}%`,
              background: isCompleted ? 'var(--gradient-status-active)' : 'var(--gradient-primary)',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="var(--color-success)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {progress?.completed_tasks ?? 0} of {progress?.total_tasks ?? 0} Tasks Done
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Checklist milestones</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={18} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {progress?.active_systems ?? 0} Active Systems
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cloud & SaaS entitlements</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitBranch size={18} color="var(--color-info)" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {developer.repo_requests?.length ?? 0} Repositories
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Provisioned project repositories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('checklist')}
        >
          <ShieldCheck size={16} /> My Checklist ({developer.checklist_tasks?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'access' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('access')}
        >
          <Key size={16} /> My Cloud Systems ({developer.access_grants?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'repos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('repos')}
        >
          <GitBranch size={16} /> My Repositories ({developer.repo_requests?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'checklist' && (
        <ChecklistPanel
          developerId={developer.id}
          tasks={developer.checklist_tasks || []}
          onTaskUpdated={loadData}
        />
      )}

      {activeTab === 'access' && (
        <AccessPanel
          developerId={developer.id}
          grants={developer.access_grants || []}
          onGrantUpdated={loadData}
          canManage={true}
        />
      )}

      {activeTab === 'repos' && (
        <RepoPanel
          developerId={developer.id}
          developerGithubUsername={developer.github_username}
          repos={developer.repo_requests || []}
          onRepoUpdated={loadData}
          canManage={true}
        />
      )}
    </div>
  );
};
