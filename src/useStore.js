// ============================================================
// useStore.js — Central state store (localStorage-backed)
// ============================================================
import { useState, useEffect, useCallback } from 'react';

function load(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

// ── Default settings ──────────────────────────────────────────
const DEFAULT_SETTINGS = {
  focusDuration: 25,  // minutes
  shortBreak: 5,
  longBreak: 20,
  longBreakAfter: 4,  // sessions before long break
  autoNext: false,
  alarm: 'bell',  // 'bell' | 'digital' | 'gentle' | 'custom'
  alarmVolume: 0.7,
  customAlarmUrl: null,
  customAlarmName: null,
  alarmRepeat: false,
  notificationsEnabled: true,
};

// ── usePersist ────────────────────────────────────────────────
export function usePersist(key, fallback) {
  const [val, setVal] = useState(() => load(key, fallback));
  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      save(key, next);
      return next;
    });
  }, [key]);
  return [val, set];
}

// ── useSettings ───────────────────────────────────────────────
export function useSettings() {
  return usePersist('polmo_settings', DEFAULT_SETTINGS);
}

// ── useTasks ──────────────────────────────────────────────────
export function useTasks() {
  const [tasks, setTasks] = usePersist('polmo_tasks', []);

  const addTask = useCallback((data) => {
    const task = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      status: 'pending',
      sessionsCompleted: 0,
      ...data,
    };
    setTasks(prev => [task, ...prev]);
    return task.id;
  }, [setTasks]);

  const updateTask = useCallback((id, patch) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  const incrementSession = useCallback((id) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, sessionsCompleted: (t.sessionsCompleted || 0) + 1 } : t
    ));
  }, [setTasks]);

  return { tasks, addTask, updateTask, deleteTask, incrementSession };
}

// ── useSessions ───────────────────────────────────────────────
export function useSessions() {
  const [sessions, setSessions] = usePersist('polmo_sessions', []);

  const addSession = useCallback((data) => {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...data,
    };
    setSessions(prev => [entry, ...prev]);
  }, [setSessions]);

  const clearAll = useCallback(() => setSessions([]), [setSessions]);

  const todaySessions = sessions.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayFocusMinutes = todaySessions
    .filter(s => s.mode === 'focus')
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const todayCount = todaySessions.filter(s => s.mode === 'focus').length;

  return { sessions, addSession, clearAll, todaySessions, todayFocusMinutes, todayCount };
}
