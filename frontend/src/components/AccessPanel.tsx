import React, { useState, useEffect } from 'react';
import { AccessGrant, AccessSystem } from '../types';
import { api } from '../api/client';
import { StatusTag } from './StatusTag';
import { Key, Plus, CheckCircle, XCircle, Shield, Cloud, Terminal } from 'lucide-react';

interface AccessPanelProps {
  developerId: number;
  grants: AccessGrant[];
  onGrantUpdated: () => void;
  canManage: boolean;
}

export const AccessPanel: React.FC<AccessPanelProps> = ({
  developerId,
  grants,
  onGrantUpdated,
  canManage,
}) => {
  const [systems, setSystems] = useState<AccessSystem[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedSystemId, setSelectedSystemId] = useState<number | ''>('');
  const [accessLevel, setAccessLevel] = useState<string>('read');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    api.access.getSystems().then(setSystems).catch(console.error);
  }, []);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSystemId) return;

    setLoading(true);
    try {
      await api.access.createGrant({
        developer_id: developerId,
        system_id: Number(selectedSystemId),
        access_level: accessLevel,
        status: 'active',
        notes: notes || 'Direct portal entitlement grant',
      });
      setShowModal(false);
      setSelectedSystemId('');
      setNotes('');
      onGrantUpdated();
    } catch (err: any) {
      alert(`Failed to grant access: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (grantId: number, status: 'active' | 'revoked') => {
    try {
      await api.access.updateGrant(grantId, { status });
      onGrantUpdated();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="access-panel">
      {/* Top Header Card */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={20} color="#3b82f6" />
            System & Cloud Entitlements
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            SOC2-compliant access management for cloud infrastructure and SaaS systems.
          </p>
        </div>

        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Grant New Access
          </button>
        )}
      </div>

      {/* Entitlements Table */}
      <div className="table-container card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>System / Platform</th>
              <th>Category</th>
              <th>Access Level</th>
              <th>Status</th>
              <th>Audit Trail</th>
              {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {grants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No systems provisioned for this developer yet.
                </td>
              </tr>
            ) : (
              grants.map((grant) => (
                <tr key={grant.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                        <Cloud size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {grant.system?.name || `System #${grant.system_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {grant.notes || 'Default team entitlement'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="code-badge">{grant.system?.category || 'Cloud'}</span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#93c5fd' }}>
                      {grant.access_level}
                    </span>
                  </td>
                  <td>
                    <StatusTag status={grant.status} />
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {grant.status === 'active' && grant.granted_at ? (
                        <span>Granted {new Date(grant.granted_at).toLocaleDateString()}</span>
                      ) : grant.status === 'revoked' && grant.revoked_at ? (
                        <span style={{ color: '#ef4444' }}>Revoked {new Date(grant.revoked_at).toLocaleDateString()}</span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>Awaiting Approval</span>
                      )}
                    </div>
                  </td>
                  {canManage && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {grant.status !== 'active' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Approve / Activate"
                            onClick={() => handleUpdateStatus(grant.id, 'active')}
                          >
                            <CheckCircle size={14} color="#10b981" /> Approve
                          </button>
                        )}
                        {grant.status !== 'revoked' && (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Revoke Access"
                            onClick={() => handleUpdateStatus(grant.id, 'revoked')}
                          >
                            <XCircle size={14} /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grant Access Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} color="#6366f1" />
              Grant System Entitlement
            </h3>

            <form onSubmit={handleGrantAccess}>
              <div className="form-group">
                <label className="form-label">System Platform</label>
                <select
                  className="form-select"
                  value={selectedSystemId}
                  onChange={(e) => setSelectedSystemId(Number(e.target.value))}
                  required
                >
                  <option value="">Select target system...</option>
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Permission Level</label>
                <select
                  className="form-select"
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                >
                  <option value="read">Read-Only / Viewer</option>
                  <option value="write">Write / Developer</option>
                  <option value="admin">Administrator / Lead</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Business Justification / Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Needs staging access for payments integration"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || !selectedSystemId}>
                  {loading ? 'Provisioning...' : 'Confirm & Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
