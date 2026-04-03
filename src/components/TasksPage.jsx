// ============================================================
// TasksPage.jsx — Full task management
// ============================================================
import React, { useState } from 'react';
import TaskModal from './TaskModal';

const STATUS_MAP = {
    pending: { label: 'Pending', cls: 'badge-pending' },
    inprogress: { label: 'In Progress', cls: 'badge-inprogress' },
    completed: { label: 'Completed', cls: 'badge-completed' },
};

export default function TasksPage({
    tasks, addTask, updateTask, deleteTask,
    selectedTaskId, onSelectTask,
}) {
    const [modal, setModal] = useState(null); // null | 'add' | task
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = tasks.filter(t => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const handleSave = (data) => {
        if (modal === 'add') {
            addTask(data);
        } else {
            updateTask(modal.id, data);
        }
        setModal(null);
    };

    const toggleDone = (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        updateTask(task.id, { status: newStatus });
    };

    const handleSelect = (id) => {
        onSelectTask(id === selectedTaskId ? null : id);
    };

    const deadlineColor = (d) => {
        if (!d) return null;
        const diff = new Date(d) - new Date();
        if (diff < 0) return 'var(--danger)';
        if (diff < 86400000) return 'var(--warning)';
        return 'var(--text-muted)';
    };

    // Stats
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'completed').length;
    const inprog = tasks.filter(t => t.status === 'inprogress').length;
    const totSess = tasks.reduce((a, t) => a + (t.sessionsCompleted || 0), 0);

    return (
        <div>
            {/* Quick stats */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Tasks', value: total },
                    { label: 'Completed', value: done, accent: 'var(--success)' },
                    { label: 'In Progress', value: inprog, accent: 'var(--accent-focus)' },
                    { label: 'Pomodoros Done', value: totSess },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-value" style={{ color: s.accent || 'var(--text-primary)' }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="tasks-page">
                {/* Task list */}
                <div>
                    {/* Header + controls */}
                    <div className="section-header">
                        <span className="section-title">Tasks</span>
                        <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ New Task</button>
                    </div>

                    {/* Search + filter */}
                    <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                        <input
                            className="form-input"
                            placeholder="🔍 Search tasks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: 160 }}
                        />
                        {['all', 'pending', 'inprogress', 'completed'].map(f => (
                            <button
                                key={f}
                                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter(f)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {f === 'all' ? 'All' : STATUS_MAP[f]?.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {filtered.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">No tasks found</div>
                                <div className="empty-desc">Add a new task or adjust your filter.</div>
                            </div>
                        </div>
                    ) : (
                        <div className="task-list">
                            {filtered.map(task => (
                                <div
                                    key={task.id}
                                    className={`task-item ${selectedTaskId === task.id ? 'selected' : ''} ${task.status === 'completed' ? 'completed' : ''}`}
                                    onClick={() => handleSelect(task.id)}
                                >
                                    {/* Checkbox */}
                                    <div
                                        className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                                        onClick={e => { e.stopPropagation(); toggleDone(task); }}
                                        title="Toggle complete"
                                    >
                                        {task.status === 'completed' && <span style={{ color: '#fff', fontSize: '0.65rem' }}>✓</span>}
                                    </div>

                                    {/* Body */}
                                    <div className="task-body">
                                        <div className={`task-name ${task.status === 'completed' ? 'completed' : ''}`}>
                                            {task.name}
                                        </div>
                                        {task.description && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {task.description}
                                            </div>
                                        )}
                                        <div className="task-meta">
                                            <span className={`task-badge ${STATUS_MAP[task.status]?.cls}`}>
                                                {STATUS_MAP[task.status]?.label}
                                            </span>
                                            <span className="task-pomodoros">
                                                🍅 {task.sessionsCompleted || 0}/{task.estimatedPomodoros || '?'}
                                            </span>
                                            {task.deadline && (
                                                <span style={{ fontSize: '0.7rem', color: deadlineColor(task.deadline) }}>
                                                    📅 {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                            {selectedTaskId === task.id && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--accent-focus)', fontWeight: 600 }}>● Active</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="task-actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            className="btn btn-ghost btn-icon btn-sm"
                                            onClick={() => setModal(task)}
                                            title="Edit"
                                        >✎</button>
                                        <button
                                            className="btn btn-danger btn-icon btn-sm"
                                            onClick={() => { if (confirm('Delete this task?')) deleteTask(task.id); }}
                                            title="Delete"
                                        >✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Side panel — selected task detail */}
                <div>
                    {selectedTaskId && tasks.find(t => t.id === selectedTaskId) ? (
                        <div className="card" style={{ position: 'sticky', top: 80 }}>
                            {(() => {
                                const t = tasks.find(x => x.id === selectedTaskId);
                                const progress = Math.min(1, (t.sessionsCompleted || 0) / Math.max(1, t.estimatedPomodoros || 1));
                                return (
                                    <>
                                        <div className="sidebar-section-title">Selected Task</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{t.name}</div>
                                        {t.description && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>{t.description}</div>
                                        )}

                                        {/* Progress bar */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                                <span>Progress</span>
                                                <span>{t.sessionsCompleted || 0}/{t.estimatedPomodoros || '?'} 🍅</span>
                                            </div>
                                            <div style={{ height: 6, background: 'var(--bg-base)', borderRadius: '9999px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${progress * 100}%`,
                                                    background: 'var(--accent-focus)',
                                                    borderRadius: '9999px',
                                                    transition: 'width 0.5s ease',
                                                    boxShadow: '0 0 8px var(--accent-focus-glow)',
                                                }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {t.deadline && <div>📅 Due: {new Date(t.deadline).toLocaleDateString()}</div>}
                                            <div>📌 Status: <span style={{ color: 'var(--text-secondary)' }}>{STATUS_MAP[t.status]?.label}</span></div>
                                            <div>🕐 Created: {new Date(t.createdAt).toLocaleDateString()}</div>
                                        </div>

                                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm w-full" onClick={() => setModal(t)}>✎ Edit</button>
                                            <button
                                                className="btn btn-sm w-full"
                                                style={{
                                                    background: t.status !== 'completed' ? 'hsla(145,63%,48%,0.15)' : 'hsla(0,78%,60%,0.1)',
                                                    color: t.status !== 'completed' ? 'var(--success)' : 'var(--text-muted)',
                                                    border: '1px solid', borderColor: t.status !== 'completed' ? 'hsla(145,63%,48%,0.3)' : 'var(--border)'
                                                }}
                                                onClick={() => toggleDone(t)}
                                            >
                                                {t.status === 'completed' ? '↩ Reopen' : '✓ Complete'}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="card">
                            <div className="empty-state" style={{ padding: '32px 16px' }}>
                                <div className="empty-icon">👆</div>
                                <div className="empty-title">Select a task</div>
                                <div className="empty-desc">Click any task to see its details and link it to the timer.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {modal && (
                <TaskModal
                    task={modal === 'add' ? null : modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
