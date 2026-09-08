import React, { useState, useEffect, useCallback } from 'react';
import { Developer, DeveloperProgressSummary } from '../types';
import { api } from '../api/client';
import { ChecklistPanel } from '../components/ChecklistPanel';
import { AccessPanel } from '../components/AccessPanel';
import { RepoPanel } from '../components/RepoPanel';
import { StatusTag } from '../components/StatusTag';
import {
  ArrowLeft,
  Calendar,
  Mail,
  ShieldCheck,
  Key,
  GitBranch,
  Github,
  CheckCircle2,
  RefreshCw,
  Edit,
} from 'lucide-react';

interface DeveloperDetailProps {
  developerId: number;
  onBack: () => void;
  canManage: boolean;
}

export const DeveloperDetail: React.FC<DeveloperDetailProps> = ({
  developerId,
  onBack,
  canManage,
}) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [progress, setProgress] = useState<DeveloperProgressSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'access' | 'repos'>('checklist');
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: string) => {
    if (!developer) return;
    setUpdatingStatus(true);
    try {
      await api.developers.update(developer.id, { status: newStatus as any });
      loadData();
    } catch (err: any) {
      alert(`Status change failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading && !developer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <RefreshCw className="spin" size={24} color="#6366f1" />
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <h3 style={{ color: '#fca5a5' }}>Developer Not Found</h3>
        <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={onBack}>
          <ArrowLeft size={16} /> Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="developer-detail-page">
      {/* Back Button */}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 16 }}
        onClick={onBack}
      >
        <ArrowLeft size={14} /> Back to Cohort Directory
      </button>

      {/* Developer Hero Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="user-avatar-circle" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
              {developer.full_name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                  {developer.full_name}
                </h2>
                <StatusTag status={developer.status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{developer.role_title}</span>
                <span>•</span>
                <span className="code-badge">{developer.team} Team</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} /> {developer.email}
                </span>
                {developer.github_username && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#818cf8' }}>
                    <Github size={14} /> @{developer.github_username}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Lifecycle Status Switcher */}
          {canManage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lifecycle Status:</label>
              <select
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                disabled={updatingStatus}
                value={developer.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="pre_boarding">Pre-boarding</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed / Fully Provisioned</option>
                <option value="offboarded">Offboarded</option>
              </select>
            </div>
          )}
        </div>

        {/* Aggregate Progress Strip */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Overall Provisioning Score (Weighted: 60% Tasks, 40% Entitlements)
            </span>
            <span style={{ fontWeight: 700, color: (progress?.overall_progress_percentage || 0) === 100 ? '#10b981' : '#818cf8', fontSize: '1rem' }}>
              {progress?.overall_progress_percentage ?? 0}%
            </span>
          </div>
          <div className="progress-container" style={{ height: 10 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${progress?.overall_progress_percentage ?? 0}%`,
                background: (progress?.overall_progress_percentage || 0) === 100 ? 'var(--gradient-status-active)' : 'var(--gradient-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('checklist')}
        >
          <ShieldCheck size={16} /> Checklist Tasks ({developer.checklist_tasks?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'access' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('access')}
        >
          <Key size={16} /> Cloud Entitlements ({developer.access_grants?.length || 0})
        </button>
        <button
          className={`btn ${activeTab === 'repos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('repos')}
        >
          <GitBranch size={16} /> GitHub Repositories ({developer.repo_requests?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
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
          canManage={canManage}
        />
      )}

      {activeTab === 'repos' && (
        <RepoPanel
          developerId={developer.id}
          developerGithubUsername={developer.github_username}
          repos={developer.repo_requests || []}
          onRepoUpdated={loadData}
          canManage={canManage}
        />
      )}
    </div>
  );
};
