// ============================================================
// TimerPage.jsx — Main timer view
// ============================================================
import React, { useState } from 'react';
import TimerRing from './TimerRing';

const MODE_LABELS = {
    focus: { label: 'Focus', emoji: '🍅' },
    short: { label: 'Short Break', emoji: '☕' },
    long: { label: 'Long Break', emoji: '🌙' },
};

export default function TimerPage({
    timerState,
    tasks,
    selectedTaskId,
    onSelectTask,
    onMinimize,
    settings,
    onUpdateSettings,
}) {
    const {
        mode, sessionCount, formatted, progress, running, totalSessions,
        start, pause, reset, switchMode,
    } = timerState;

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const { longBreakAfter } = settings;

    const handleToggle = () => (running ? pause() : start());

    return (
        <div className="timer-page">
            {/* Main timer column */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: 36 }}>

                {/* Mode pills */}
                <div className="mode-selector">
                    {['focus', 'short', 'long'].map(m => (
                        <button
                            key={m}
                            className={`mode-pill ${mode === m ? 'active' : ''}`}
                            data-mode={m}
                            onClick={() => switchMode(m)}
                        >
                            {MODE_LABELS[m].emoji} {MODE_LABELS[m].label}
                        </button>
                    ))}
                </div>

                {/* Ring */}
                <div className="ring-wrap">
                    <TimerRing progress={progress} mode={mode}>
                        <div style={{ transform: 'none', position: 'static', textAlign: 'center' }}>
                            <div className="timer-display">{formatted}</div>
                            <div className="timer-phase-label">{MODE_LABELS[mode].emoji} {MODE_LABELS[mode].label}</div>
                            {/* Session dots */}
                            <div className="session-dots" style={{ marginTop: 10 }}>
                                {Array.from({ length: longBreakAfter }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`session-dot ${i < (sessionCount % longBreakAfter) ? 'filled' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </TimerRing>
                </div>

                {/* Controls */}
                <div className="timer-controls">
                    <button className="btn btn-secondary btn-icon" onClick={reset} title="Reset">↺</button>
                    <button
                        className="btn btn-primary btn-lg"
                        data-mode={mode}
                        onClick={handleToggle}
                        style={{ minWidth: 130 }}
                    >
                        {running
                            ? <><span>⏸</span> Pause</>
                            : <><span>▶</span> {timerState.timeLeft === (mode === 'focus' ? settings.focusDuration : mode === 'short' ? settings.shortBreak : settings.longBreak) * 60 ? 'Start' : 'Resume'}</>
                        }
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={onMinimize} title="Minimize to float">⊟</button>
                </div>

                {/* Stats row */}
                <div className="flex gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>🍅 {totalSessions} sessions total</span>
                    <span>•</span>
                    <span>Cycle: {sessionCount % longBreakAfter}/{longBreakAfter}</span>
                </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Selected task */}
                <div className="card">
                    <div className="sidebar-section-title">Current Task</div>
                    {selectedTask ? (
                        <div>
                            <div className="selected-task-badge" style={{ maxWidth: '100%', marginBottom: 10 }}>
                                <span>🍅</span>
                                <span>{selectedTask.name}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {selectedTask.sessionsCompleted || 0} / {selectedTask.estimatedPomodoros || '?'} sessions done
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted" style={{ fontSize: '0.82rem' }}>No task selected. Pick one below.</div>
                    )}
                </div>

                {/* Task picker */}
                <div className="card" style={{ maxHeight: 340, overflowY: 'auto' }}>
                    <div className="sidebar-section-title">Pick a Task</div>
                    {pendingTasks.length === 0 ? (
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>No pending tasks. Add some in the Tasks tab!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {pendingTasks.map(task => (
                                <button
                                    key={task.id}
                                    className={`task-item ${selectedTaskId === task.id ? 'selected' : ''}`}
                                    style={{ cursor: 'pointer', textAlign: 'left', border: 'none' }}
                                    onClick={() => onSelectTask(task.id === selectedTaskId ? null : task.id)}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="task-name" style={{ fontSize: '0.82rem' }}>{task.name}</div>
                                        <div className="task-meta">
                                            <span className="task-pomodoros">
                                                🍅 {task.sessionsCompleted || 0}/{task.estimatedPomodoros || '?'}
                                            </span>
                                            {task.deadline && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    📅 {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedTaskId === task.id && <span style={{ color: 'var(--accent-focus)', fontSize: '0.8rem' }}>✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Auto-next toggle */}
                <div className="card">
                    <div className="toggle-row">
                        <div>
                            <div className="toggle-label">Auto-Next</div>
                            <div className="toggle-desc">Skip to next phase automatically</div>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.autoNext}
                                onChange={e => onUpdateSettings({ autoNext: e.target.checked })}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
