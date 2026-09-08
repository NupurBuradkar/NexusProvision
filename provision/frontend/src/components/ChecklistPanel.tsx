import React, { useState } from 'react';
import { DeveloperChecklistStatus } from '../types';
import { api } from '../api/client';
import { CheckCircle2, Clock, MessageSquare, Filter, ShieldCheck } from 'lucide-react';

interface ChecklistPanelProps {
  tasks: DeveloperChecklistStatus[];
  developerId: number;
  onTaskUpdated: () => void;
}

export const ChecklistPanel: React.FC<ChecklistPanelProps> = ({
  tasks,
  onTaskUpdated,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = async (task: DeveloperChecklistStatus) => {
    try {
      setLoadingTaskId(task.id);
      await api.checklist.toggleTask(task.id, !task.is_completed);
      onTaskUpdated();
    } catch (err) {
      alert(`Failed to update task: ${err}`);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleSaveNotes = async (task: DeveloperChecklistStatus) => {
    try {
      await api.checklist.toggleTask(task.id, task.is_completed, noteText);
      setEditingNotesId(null);
      onTaskUpdated();
    } catch (err) {
      alert(`Failed to save note: ${err}`);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.is_completed;
    if (filter === 'pending') return !t.is_completed;
    return true;
  });

  // Group by category
  const categories = Array.from(new Set(tasks.map((t) => t.category || 'General')));

  return (
    <div className="checklist-panel">
      {/* Header with Progress Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="#818cf8" />
              Onboarding Checklist
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Track hardware, security, compliance, and developer environment milestones.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: percentage === 100 ? '#10b981' : '#818cf8' }}>
              {percentage}%
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 6 }}>
              ({completedCount}/{totalCount} completed)
            </span>
          </div>
        </div>

        <div className="progress-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${percentage}%`,
              background: percentage === 100 ? 'var(--gradient-status-active)' : 'var(--gradient-primary)',
            }}
          />
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Tasks ({totalCount})
          </button>
          <button
            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('pending')}
          >
            Incomplete ({totalCount - completedCount})
          </button>
          <button
            className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Categories and Task Lists */}
      {categories.map((category) => {
        const categoryTasks = filteredTasks.filter((t) => (t.category || 'General') === category);
        if (categoryTasks.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 10 }}>
              {category}
            </h4>

            {categoryTasks.map((task) => (
              <div
                key={task.id}
                className="checklist-item"
                style={{
                  opacity: loadingTaskId === task.id ? 0.6 : 1,
                  borderColor: task.is_completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)',
                }}
              >
                <input
                  type="checkbox"
                  className="checklist-checkbox"
                  checked={task.is_completed}
                  disabled={loadingTaskId === task.id}
                  onChange={() => handleToggle(task)}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        textDecoration: task.is_completed ? 'line-through' : 'none',
                        color: task.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                    >
                      {task.title}
                    </span>

                    {task.is_completed ? (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} />
                        Done {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} />
                        Pending
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Notes Section */}
                  {task.notes && editingNotesId !== task.id && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 6, color: '#cbd5e1' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Note:</span> {task.notes}
                    </div>
                  )}

                  {editingNotesId === task.id ? (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                        value={noteText}
                        placeholder="Add execution note..."
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveNotes(task)}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingNotesId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 8, padding: '2px 8px', fontSize: '0.72rem' }}
                      onClick={() => {
                        setEditingNotesId(task.id);
                        setNoteText(task.notes || '');
                      }}
                    >
                      <MessageSquare size={12} /> {task.notes ? 'Edit Note' : 'Add Note'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
