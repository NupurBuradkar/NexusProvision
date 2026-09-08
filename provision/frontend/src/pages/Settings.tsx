import React, { useState, useEffect } from 'react';
import { ChecklistTemplateItem, AccessSystem, AuditLog } from '../types';
import { api } from '../api/client';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Key,
  Activity,
  Plus,
  Trash2,
  Cloud,
  FileText,
} from 'lucide-react';

interface SettingsProps {
  isAdmin: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ isAdmin }) => {
  const [subTab, setSubTab] = useState<'templates' | 'systems' | 'audit'>('templates');

  // Templates
  const [templates, setTemplates] = useState<ChecklistTemplateItem[]>([]);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCat, setNewTemplateCat] = useState('Security');
  const [newTemplateTeam, setNewTemplateTeam] = useState('');

  // Systems
  const [systems, setSystems] = useState<AccessSystem[]>([]);
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemCat, setNewSystemCat] = useState('Cloud Infrastructure');

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTabData();
  }, [subTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (subTab === 'templates') {
        const data = await api.checklist.getTemplates();
        setTemplates(data);
      } else if (subTab === 'systems') {
        const data = await api.access.getSystems();
        setSystems(data);
      } else if (subTab === 'audit') {
        const data = await api.dashboard.getAuditLogs(100);
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) return;
    try {
      await api.checklist.createTemplate({
        title: newTemplateTitle.trim(),
        category: newTemplateCat,
        team: newTemplateTeam.trim() || undefined,
        is_required: true,
        sort_order: templates.length + 1,
      });
      setNewTemplateTitle('');
      loadTabData();
    } catch (err: any) {
      alert(`Failed to create template: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Remove this template item from default onboarding checklists?')) return;
    try {
      await api.checklist.deleteTemplate(id);
      loadTabData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystemName.trim()) return;
    try {
      await api.access.createSystem({
        name: newSystemName.trim(),
        category: newSystemCat,
        icon_key: 'cloud',
      });
      setNewSystemName('');
      loadTabData();
    } catch (err: any) {
      alert(`Failed to add system: ${err.message}`);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SettingsIcon size={24} color="#818cf8" />
          Platform Governance & Catalog
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Configure enterprise templates, cloud system catalogs, and inspect immutable SOC2 audit records.
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          className={`btn ${subTab === 'templates' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('templates')}
        >
          <FileText size={16} /> Checklist Templates
        </button>
        <button
          className={`btn ${subTab === 'systems' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('systems')}
        >
          <Cloud size={16} /> Systems Catalog
        </button>
        <button
          className={`btn ${subTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('audit')}
        >
          <Activity size={16} /> SOC2 Compliance Audit Log
        </button>
      </div>

      {/* Tab 1: Checklist Templates */}
      {subTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr', gap: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Task Title</th>
                  <th>Category</th>
                  <th>Team Scope</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {templates.map((tmpl) => (
                  <tr key={tmpl.id}>
                    <td style={{ width: 60, color: 'var(--text-muted)' }}>#{tmpl.sort_order}</td>
                    <td style={{ fontWeight: 600 }}>{tmpl.title}</td>
                    <td>
                      <span className="code-badge">{tmpl.category}</span>
                    </td>
                    <td>
                      <span style={{ color: tmpl.team ? '#818cf8' : 'var(--text-secondary)' }}>
                        {tmpl.team || 'All Teams'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteTemplate(tmpl.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="#6366f1" />
                Add Template Item
              </h3>
              <form onSubmit={handleCreateTemplate}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Install Terraform & AWS CLI"
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newTemplateCat}
                    onChange={(e) => setNewTemplateCat(e.target.value)}
                  >
                    <option value="Security">Security</option>
                    <option value="Hardware">Hardware & OS</option>
                    <option value="Dev Environment">Dev Environment</option>
                    <option value="Compliance">Compliance & HR</option>
                    <option value="Team Knowledge">Team Knowledge</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Team Scope (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Backend (blank = all teams)"
                    value={newTemplateTeam}
                    onChange={(e) => setNewTemplateTeam(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}>
                  Save Template Item
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Systems Catalog */}
      {subTab === 'systems' && (
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr', gap: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Platform / Service</th>
                  <th>Category</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((sys) => (
                  <tr key={sys.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{sys.name}</div>
                    </td>
                    <td>
                      <span className="code-badge">{sys.category}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {sys.description || 'System access target'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="#3b82f6" />
                Add System Target
              </h3>
              <form onSubmit={handleCreateSystem}>
                <div className="form-group">
                  <label className="form-label">System Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Snowflake Data Warehouse"
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newSystemCat}
                    onChange={(e) => setNewSystemCat(e.target.value)}
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Observability">Observability</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Communication">Communication</option>
                    <option value="Security & Secrets">Security & Secrets</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}>
                  Register System
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: SOC2 Compliance Audit Log */}
      {subTab === 'audit' && (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Actor Email</th>
                <th>Action</th>
                <th>Target Resource</th>
                <th>Details Diff</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.actor_email}</td>
                  <td>
                    <span className="code-badge">{log.action}</span>
                  </td>
                  <td>
                    <span style={{ color: '#93c5fd' }}>
                      {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
