// ============================================================
// App.jsx — Root component, wires everything together
// ============================================================
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSettings, useTasks, useSessions } from './useStore';
import { useTimer } from './useTimer';
import { useAlarm, requestNotificationPermission, sendNotification } from './useAlarm';

import TimerPage from './components/TimerPage';
import TasksPage from './components/TasksPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import FloatWidget from './components/FloatWidget';

const TABS = [
  { id: 'timer', label: 'Timer' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

// ── Inline Toast system ──────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('timer');
  const [minimized, setMinimized] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [settings, setAllSettings] = useSettings();
  const { tasks, addTask, updateTask, deleteTask, incrementSession } = useTasks();
  const { sessions, addSession, clearAll, todayFocusMinutes, todayCount } = useSessions();
  const alarm = useAlarm();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const showToast = useCallback((msg) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const updateSettings = useCallback((patch) => {
    setAllSettings(prev => ({ ...prev, ...patch }));
  }, [setAllSettings]);

  // ── Session complete callback ────────────────────────────────
  const onSessionComplete = useCallback((completedMode, nextMode) => {
    const durationMinutes = completedMode === 'focus'
      ? settings.focusDuration
      : completedMode === 'short'
        ? settings.shortBreak
        : settings.longBreak;

    // Record session
    addSession({
      mode: completedMode,
      durationMinutes,
      taskId: selectedTaskId || null,
    });

    // Increment task session count
    if (completedMode === 'focus' && selectedTaskId) {
      incrementSession(selectedTaskId);
      // Auto-set to in progress if pending
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task && task.status === 'pending') {
        updateTask(selectedTaskId, { status: 'inprogress' });
      }
    }

    // Alarm
    alarm.play(settings);

    // Browser notification
    if (settings.notificationsEnabled) {
      const title = completedMode === 'focus'
        ? '🍅 Focus session complete!'
        : '⏰ Break over!';
      const body = nextMode === 'focus'
        ? 'Time to focus!'
        : nextMode === 'short'
          ? 'Take a short break ☕'
          : 'Take a long break 🌙';
      sendNotification(title, body);
    }

    // Toast
    const msg = completedMode === 'focus'
      ? '🍅 Focus session complete! Great work!'
      : completedMode === 'short'
        ? '☕ Short break done — back to focus!'
        : '🌙 Long break over — ready to grind!';
    showToast(msg);
  }, [settings, selectedTaskId, alarm, addSession, incrementSession, updateTask, tasks, showToast]);

  // ── Timer ────────────────────────────────────────────────────
  const timerState = useTimer({ settings, onSessionComplete });

  const handleToggle = useCallback(() => {
    if (alarm.isPlaying) alarm.stop();
    timerState.running ? timerState.pause() : timerState.start();
  }, [timerState, alarm]);

  return (
    <div className="app-layout">
      {/* Nav */}
      <nav className="app-nav">
        <div className="nav-logo">
          <div className="nav-logo-dot" />
          Polmo
        </div>

        <div className="nav-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="nav-actions">
          {/* Timer status indicator */}
          {timerState.running && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem',
              color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent-focus)',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              {timerState.formatted}
            </div>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setMinimized(m => !m)}
            title={minimized ? 'Restore app view' : 'Float timer widget'}
          >
            {minimized ? '⤢ Restore' : '⊟ Float'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      {!minimized && (
        <main className="app-main">
          {tab === 'timer' && (
            <TimerPage
              timerState={timerState}
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onMinimize={() => setMinimized(true)}
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          )}
          {tab === 'tasks' && (
            <TasksPage
              tasks={tasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          )}
          {tab === 'history' && (
            <HistoryPage
              sessions={sessions}
              tasks={tasks}
              todayFocusMinutes={todayFocusMinutes}
              todayCount={todayCount}
              clearAll={clearAll}
            />
          )}
          {tab === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdate={updateSettings}
            />
          )}
        </main>
      )}

      {/* Floating widget — shows when minimized OR always on top */}
      {minimized && (
        <FloatWidget
          timerState={timerState}
          onRestore={() => setMinimized(false)}
          onToggle={handleToggle}
        />
      )}

      {/* Stop Alarm Banner */}
      {alarm.isPlaying && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: 'var(--accent-focus)', color: '#fff',
          padding: '12px 24px', borderRadius: 100, boxShadow: '0 4px 12px rgba(229,90,90,0.4)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: '1.2rem' }}>🔔</span>
          <span style={{ fontWeight: 600 }}>Alarm Ringing</span>
          <button
            className="btn btn-sm"
            style={{ background: '#fff', color: 'var(--accent-focus)', marginLeft: 8, border: 'none', fontWeight: 600 }}
            onClick={() => alarm.stop()}
          >
            Stop
          </button>
        </div>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
