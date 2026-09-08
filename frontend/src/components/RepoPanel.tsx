import React, { useState } from 'react';
import { RepoRequest } from '../types';
import { api } from '../api/client';
import { StatusTag } from './StatusTag';
import { GitBranch, Plus, ExternalLink, RefreshCw, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface RepoPanelProps {
  developerId: number;
  developerGithubUsername?: string;
  repos: RepoRequest[];
  onRepoUpdated: () => void;
  canManage: boolean;
}

export const RepoPanel: React.FC<RepoPanelProps> = ({
  developerId,
  developerGithubUsername,
  repos,
  onRepoUpdated,
  canManage,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [repoName, setRepoName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [visibility, setVisibility] = useState<'private' | 'internal' | 'public'>('private');
  const [branchProtection, setBranchProtection] = useState<boolean>(true);
  const [provisioningId, setProvisioningId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setSubmitting(true);
    try {
      await api.repos.request({
        developer_id: developerId,
        name: repoName.trim(),
        description: description.trim(),
        visibility,
        branch_protection_enabled: branchProtection,
      });
      setShowModal(false);
      setRepoName('');
      setDescription('');
      onRepoUpdated();
    } catch (err: any) {
      alert(`Repository request failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerProvision = async (repoId: number) => {
    setProvisioningId(repoId);
    try {
      await api.repos.provision(repoId, true, 'admin');
      onRepoUpdated();
    } catch (err: any) {
      alert(`Provisioning failed: ${err.message}`);
    } finally {
      setProvisioningId(null);
    }
  };

  return (
    <div className="repo-panel">
      {/* Header */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={20} color="#a855f7" />
            GitHub Repository Provisioning
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Automate repository creation, branch protection enforcement, and collaborator team assignments.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Request Repository
        </button>
      </div>

      {/* Repositories List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {repos.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No repositories requested for this engineer yet.
          </div>
        ) : (
          repos.map((repo) => (
            <div key={repo.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{repo.name}</h4>
                  <span className="code-badge" style={{ marginTop: 4, display: 'inline-block' }}>
                    {repo.visibility}
                  </span>
                </div>
                <StatusTag status={repo.status} />
              </div>

              {repo.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {repo.description}
                </p>
              )}

              {/* Badges / Security rules */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.75rem' }}>
                {repo.branch_protection_enabled && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                    <Shield size={12} /> Branch Protection
                  </span>
                )}
                {developerGithubUsername && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#93c5fd', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                    @{developerGithubUsername} (Admin)
                  </span>
                )}
              </div>

              {/* Error state if failed */}
              {repo.status === 'failed' && repo.error_message && (
                <div style={{ fontSize: '0.78rem', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <AlertTriangle size={14} />
                  {repo.error_message}
                </div>
              )}

              {/* Action Bar */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {repo.github_url ? (
                  <a
                    href={repo.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> Open on GitHub
                  </a>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not provisioned</span>
                )}

                {canManage && repo.status !== 'ready' && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={provisioningId === repo.id}
                    onClick={() => handleTriggerProvision(repo.id)}
                  >
                    <RefreshCw size={14} className={provisioningId === repo.id ? 'spin' : ''} />
                    {provisioningId === repo.id ? 'Provisioning...' : 'Provision Now'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitBranch size={20} color="#a855f7" />
              Request New GitHub Repository
            </h3>

            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label className="form-label">Repository Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. auth-service-v2"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Brief summary of repository purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Visibility</label>
                <select
                  className="form-select"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                >
                  <option value="private">Private (Default)</option>
                  <option value="internal">Internal Organization</option>
                  <option value="public">Public Open-Source</option>
                </select>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="bp_toggle"
                  checked={branchProtection}
                  onChange={(e) => setBranchProtection(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                <label htmlFor="bp_toggle" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Enforce Branch Protection (require 1 PR review on main)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
