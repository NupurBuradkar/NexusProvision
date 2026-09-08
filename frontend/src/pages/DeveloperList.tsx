import React, { useState, useEffect } from 'react';
import { Developer } from '../types';
import { api } from '../api/client';
import { StatusTag } from '../components/StatusTag';
import {
  Users,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Trash2,
  ChevronRight,
  GitBranch,
  Key,
} from 'lucide-react';

interface DeveloperListProps {
  onSelectDeveloper: (id: number) => void;
  canManage: boolean;
  isAdmin: boolean;
}

export const DeveloperList: React.FC<DeveloperListProps> = ({
  onSelectDeveloper,
  canManage,
  isAdmin,
}) => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State for Onboarding Wizard
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    github_username: '',
    team: 'Backend',
    role_title: 'Senior Software Engineer',
    seniority: 'Senior',
    status: 'in_progress',
    auto_generate_checklist: true,
    auto_grant_default_access: true,
    notes: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const res = await api.developers.list({
        search: search || undefined,
        team: teamFilter || undefined,
        status: statusFilter || undefined,
        pageSize: 50,
      });
      setDevelopers(res.items);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, [teamFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDevelopers();
  };

  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.developers.create(formData as any);
      setShowModal(false);
      setFormData({
        full_name: '',
        email: '',
        github_username: '',
        team: 'Backend',
        role_title: 'Senior Software Engineer',
        seniority: 'Senior',
        status: 'in_progress',
        auto_generate_checklist: true,
        auto_grant_default_access: true,
        notes: '',
      });
      fetchDevelopers();
      onSelectDeveloper(created.id);
    } catch (err: any) {
      alert(`Onboarding creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this developer and all their provisioning records?')) {
      return;
    }
    try {
      await api.developers.delete(id);
      fetchDevelopers();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="developer-list-page">
      {/* Header with Search and New Onboarding Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="#818cf8" />
            Engineering Onboarding Cohort
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Directory of active and graduated software engineers undergoing infrastructure provisioning.
          </p>
        </div>

        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Onboard New Engineer
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: 38 }}
              placeholder="Search by engineer name, email or GitHub handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">All Teams</option>
            <option value="Backend">Backend</option>
            <option value="Frontend">Frontend</option>
            <option value="DevOps">DevOps</option>
            <option value="Data Platform">Data Platform</option>
            <option value="Security">Security</option>
          </select>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="pre_boarding">Pre-boarding</option>
            <option value="completed">Completed</option>
            <option value="offboarded">Offboarded</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Developers Table */}
      <div className="table-container card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Engineer</th>
              <th>Team & Role</th>
              <th>Seniority</th>
              <th>Checklist Progress</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading engineers...
                </td>
              </tr>
            ) : developers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No developers matching the selected filter criteria.
                </td>
              </tr>
            ) : (
              developers.map((dev) => {
                const totalTasks = dev.checklist_tasks?.length || 0;
                const completedTasks = dev.checklist_tasks?.filter((t) => t.is_completed).length || 0;
                const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <tr
                    key={dev.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectDeveloper(dev.id)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="user-avatar-circle" style={{ width: 38, height: 38 }}>
                          {dev.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{dev.full_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {dev.email}
                            {dev.github_username && (
                              <span style={{ color: '#818cf8', marginLeft: 6 }}>
                                @{dev.github_username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{dev.role_title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.team} Team</div>
                    </td>
                    <td>
                      <span className="code-badge">{dev.seniority}</span>
                    </td>
                    <td style={{ minWidth: 160 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{completedTasks}/{totalTasks} tasks</span>
                        <span style={{ fontWeight: 600, color: taskPct === 100 ? '#10b981' : '#818cf8' }}>{taskPct}%</span>
                      </div>
                      <div className="progress-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${taskPct}%`,
                            background: taskPct === 100 ? 'var(--gradient-status-active)' : 'var(--gradient-primary)',
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <StatusTag status={dev.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeveloper(dev.id);
                          }}
                        >
                          Manage <ChevronRight size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Delete Developer"
                            onClick={(e) => handleDelete(e, dev.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Onboarding Wizard Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={22} color="#6366f1" />
              Onboard New Developer
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Registers the engineer into SEQA and automatically provisions default checklist tasks and system access.
            </p>

            <form onSubmit={handleCreateDeveloper}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Jordan Lee"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work Email *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. jordan.lee@company.dev"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">GitHub Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. jlee-code"
                    value={formData.github_username}
                    onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Engineering Team *</label>
                  <select
                    className="form-select"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  >
                    <option value="Backend">Backend Platform</option>
                    <option value="Frontend">Frontend Experience</option>
                    <option value="DevOps">DevOps & SRE</option>
                    <option value="Data Platform">Data Platform</option>
                    <option value="Security">Security & Infra</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Role Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Senior Backend Engineer"
                    value={formData.role_title}
                    onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Seniority Tier</label>
                  <select
                    className="form-select"
                    value={formData.seniority}
                    onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                  >
                    <option value="Junior">Junior Engineer</option>
                    <option value="Mid-level">Mid-level Engineer</option>
                    <option value="Senior">Senior Engineer</option>
                    <option value="Staff">Staff Engineer</option>
                    <option value="Lead">Team Lead / Manager</option>
                  </select>
                </div>
              </div>

              {/* Automation Toggles */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 8, margin: '14px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    id="auto_check"
                    checked={formData.auto_generate_checklist}
                    onChange={(e) => setFormData({ ...formData, auto_generate_checklist: e.target.checked })}
                    style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                  />
                  <label htmlFor="auto_check" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer' }}>
                    Auto-generate role & team onboarding checklist tasks
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="auto_access"
                    checked={formData.auto_grant_default_access}
                    onChange={(e) => setFormData({ ...formData, auto_grant_default_access: e.target.checked })}
                    style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                  />
                  <label htmlFor="auto_access" style={{ fontSize: '0.82rem', color: '#fff', cursor: 'pointer' }}>
                    Auto-request default systems access (AWS, GitHub, Slack, Datadog)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Confirm & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
