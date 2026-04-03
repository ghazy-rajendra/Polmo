// ============================================================
// HistoryPage.jsx — Session history & statistics
// ============================================================
import React, { useState } from 'react';

function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

const DOT_CLS = { focus: 'dot-focus', short: 'dot-short', long: 'dot-long' };

export default function HistoryPage({ sessions, tasks, todayFocusMinutes, todayCount, clearAll }) {
    const [filterMode, setFilterMode] = useState('all');

    const filtered = filterMode === 'all'
        ? sessions
        : sessions.filter(s => s.mode === filterMode);

    // Group by day
    const groups = {};
    filtered.forEach(s => {
        const key = new Date(s.timestamp).toDateString();
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
    });
    const days = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    // Get task name helper
    const taskName = (id) => {
        const t = tasks.find(x => x.id === id);
        return t ? t.name : id ? 'Deleted task' : '—';
    };

    // Overall stats
    const totalFocus = sessions.filter(s => s.mode === 'focus').reduce((a, s) => a + (s.durationMinutes || 0), 0);
    const totalSess = sessions.filter(s => s.mode === 'focus').length;
    const weekFocus = sessions
        .filter(s => s.mode === 'focus' && Date.now() - s.timestamp < 7 * 86400000)
        .reduce((a, s) => a + (s.durationMinutes || 0), 0);
    const streak = (() => {
        let s = 0;
        const d = new Date();
        while (true) {
            const key = d.toDateString();
            const hasFocus = sessions.some(x => x.mode === 'focus' && new Date(x.timestamp).toDateString() === key);
            if (!hasFocus) break;
            s++;
            d.setDate(d.getDate() - 1);
        }
        return s;
    })();

    return (
        <div>
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Today Focus', value: `${todayFocusMinutes}m`, accent: 'var(--accent-focus)' },
                    { label: 'Today Sessions', value: todayCount, accent: 'var(--accent-focus)' },
                    { label: 'This Week', value: `${weekFocus}m` },
                    { label: 'Total Focus', value: `${Math.floor(totalFocus / 60)}h ${totalFocus % 60}m` },
                    { label: 'Total Sessions', value: totalSess },
                    { label: '🔥 Day Streak', value: streak, accent: 'var(--warning)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-value" style={{ color: s.accent || 'var(--text-primary)', fontSize: s.value?.toString().length > 5 ? '1.4rem' : '2rem' }}>
                            {s.value}
                        </div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="flex gap-2">
                    {['all', 'focus', 'short', 'long'].map(m => (
                        <button
                            key={m}
                            className={`btn btn-sm ${filterMode === m ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterMode(m)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {m === 'all' ? 'All' : m === 'focus' ? '🍅 Focus' : m === 'short' ? '☕ Short' : '🌙 Long'}
                        </button>
                    ))}
                </div>
                {sessions.length > 0 && (
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => { if (confirm('Clear all session history?')) clearAll(); }}
                    >
                        🗑 Clear All
                    </button>
                )}
            </div>

            {/* Log */}
            {days.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">⏱</div>
                        <div className="empty-title">No sessions yet</div>
                        <div className="empty-desc">Complete your first Pomodoro to see your history here!</div>
                    </div>
                </div>
            ) : (
                <div className="session-log">
                    {days.map(day => (
                        <div key={day}>
                            <div className="day-group-header">
                                {fmtDate(new Date(day).getTime())}
                                {' '}
                                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                                    — {groups[day].filter(s => s.mode === 'focus').reduce((a, s) => a + (s.durationMinutes || 0), 0)}m focus
                                </span>
                            </div>
                            {groups[day].map(s => (
                                <div key={s.id} className="session-entry">
                                    <div className={`session-entry-dot ${DOT_CLS[s.mode] || 'dot-focus'}`} />
                                    <div className="session-entry-time">{fmtTime(s.timestamp)}</div>
                                    <div className="session-entry-task" title={taskName(s.taskId)}>
                                        {s.mode === 'focus' ? '🍅' : s.mode === 'short' ? '☕' : '🌙'}
                                        {' '}{taskName(s.taskId)}
                                    </div>
                                    <div className="session-entry-dur">{s.durationMinutes}m</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
