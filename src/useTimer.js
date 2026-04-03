// ============================================================
// useTimer.js — Pomodoro timer engine
// Background-persistent: menggunakan localStorage + setInterval fallback
// agar timer tetap akurat walau tab tidak aktif / berpindah halaman
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'polmo_timer_state';

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { }
}

export function useTimer({ settings, onSessionComplete }) {
    // ── Restore persisted state, or use defaults ─────────────
    const persisted = loadState();
    const isValidPersisted =
        persisted &&
        persisted.running &&
        persisted.endTime &&
        persisted.endTime > Date.now();

    const [mode, setMode] = useState(isValidPersisted ? persisted.mode : 'focus');
    const [sessionCount, setSessionCount] = useState(isValidPersisted ? (persisted.sessionCount ?? 0) : 0);
    const [totalSessions, setTotalSessions] = useState(isValidPersisted ? (persisted.totalSessions ?? 0) : 0);

    const initialTimeLeft = isValidPersisted
        ? Math.max(0, Math.round((persisted.endTime - Date.now()) / 1000))
        : settings.focusDuration * 60;

    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
    const [running, setRunning] = useState(isValidPersisted);

    const endTimeRef = useRef(isValidPersisted ? persisted.endTime : null);
    const rafRef = useRef(null);
    const intervalRef = useRef(null);
    const modeRef = useRef(mode);
    const sessionCountRef = useRef(sessionCount);
    const totalSessionsRef = useRef(totalSessions);
    const settingsRef = useRef(settings);
    const onCompleteRef = useRef(onSessionComplete);

    // Keep refs in sync
    modeRef.current = mode;
    sessionCountRef.current = sessionCount;
    totalSessionsRef.current = totalSessions;
    settingsRef.current = settings;
    onCompleteRef.current = onSessionComplete;

    // Duration for a given mode in seconds
    const durationFor = useCallback((m, s) => {
        if (m === 'focus') return s.focusDuration * 60;
        if (m === 'short') return s.shortBreak * 60;
        return s.longBreak * 60;
    }, []);

    // ── handleComplete: dipisah dari tick agar bisa dipanggil ulang ──
    const handleComplete = useCallback(() => {
        endTimeRef.current = null;
        setRunning(false);
        clearState();

        const completedMode = modeRef.current;
        const s = settingsRef.current;
        const curCount = sessionCountRef.current;

        let nextMode;
        if (completedMode === 'focus') {
            const newCount = curCount + 1;
            if (newCount % s.longBreakAfter === 0) {
                nextMode = 'long';
            } else {
                nextMode = 'short';
            }
            setSessionCount(newCount);
            sessionCountRef.current = newCount;
            setTotalSessions(prev => {
                totalSessionsRef.current = prev + 1;
                return prev + 1;
            });
        } else {
            nextMode = 'focus';
        }

        onCompleteRef.current(completedMode, nextMode);

        if (s.autoNext) {
            const nextDur = durationFor(nextMode, s);
            setMode(nextMode);
            modeRef.current = nextMode;
            setTimeLeft(nextDur);
            endTimeRef.current = Date.now() + nextDur * 1000;
            setRunning(true);
            // saveState akan dipanggil oleh effect
        } else {
            setMode(nextMode);
            modeRef.current = nextMode;
            setTimeLeft(durationFor(nextMode, s));
        }
    }, [durationFor]);

    // ── Tick (rAF — presisi tinggi saat tab aktif) ────────────
    const tick = useCallback(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            handleComplete();
            return;
        }

        rafRef.current = requestAnimationFrame(tick);
    }, [handleComplete]);

    // ── Interval fallback (1 detik, jalan terus di background) ─
    const startInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (!endTimeRef.current) return;
            const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                handleComplete();
            }
        }, 1000);
    }, [handleComplete]);

    // ── visibilitychange: sync ulang setelah tab kembali ─────
    useEffect(() => {
        const onVisible = () => {
            if (!endTimeRef.current) return;
            const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                if (intervalRef.current) clearInterval(intervalRef.current);
                handleComplete();
                return;
            }
            // Restart rAF saat tab kembali aktif
            if (document.visibilityState === 'visible') {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [tick, handleComplete]);

    // ── Mulai tick jika state dipulihkan dari localStorage ───
    useEffect(() => {
        if (isValidPersisted) {
            rafRef.current = requestAnimationFrame(tick);
            startInterval();
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line
    }, []);

    // ── Simpan state ke localStorage setiap kali berubah ────
    useEffect(() => {
        if (running && endTimeRef.current) {
            saveState({
                running: true,
                endTime: endTimeRef.current,
                mode: modeRef.current,
                sessionCount: sessionCountRef.current,
                totalSessions: totalSessionsRef.current,
            });
        } else if (!running) {
            clearState();
        }
    }, [running, timeLeft]);

    // ── Update browser title ──────────────────────────────────
    useEffect(() => {
        if (running) {
            const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const s = (timeLeft % 60).toString().padStart(2, '0');
            document.title = `${m}:${s} — ${modeRef.current === 'focus' ? '🍅 Focus' : '☕ Break'} | Polmo`;
        } else {
            document.title = 'Polmo — Pomodoro Focus Timer';
        }
    }, [timeLeft, running]);

    // ── Reset time saat settings berubah (bukan saat running) ─
    useEffect(() => {
        if (!running) {
            setTimeLeft(durationFor(mode, settings));
        }
        // eslint-disable-next-line
    }, [settings.focusDuration, settings.shortBreak, settings.longBreak]);

    // ── Controls ──────────────────────────────────────────────
    const start = useCallback(() => {
        if (running) return;
        endTimeRef.current = Date.now() + timeLeft * 1000;
        setRunning(true);
        rafRef.current = requestAnimationFrame(tick);
        startInterval();
    }, [running, timeLeft, tick, startInterval]);

    const pause = useCallback(() => {
        if (!running) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        endTimeRef.current = null;
        clearState();
    }, [running]);

    const reset = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        endTimeRef.current = null;
        clearState();
        setTimeLeft(durationFor(mode, settings));
    }, [mode, settings, durationFor]);

    const switchMode = useCallback((newMode) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        endTimeRef.current = null;
        clearState();
        setMode(newMode);
        setTimeLeft(durationFor(newMode, settings));
    }, [settings, durationFor]);

    // ── Derived values ────────────────────────────────────────
    const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const ss = (timeLeft % 60).toString().padStart(2, '0');
    const formatted = `${mm}:${ss}`;

    const totalDur = durationFor(mode, settings);
    const progress = 1 - (timeLeft / totalDur);

    return {
        mode, sessionCount, timeLeft, running, formatted, progress, totalSessions,
        start, pause, reset, switchMode,
    };
}
