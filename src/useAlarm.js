// ============================================================
// useAlarm.js — Web Audio alarm + custom file upload
// ============================================================
import { useRef, useCallback, useState } from 'react';

// Generate a tone using Web Audio API
function createTone(audioCtx, type) {
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0, audioCtx.currentTime);
    master.connect(audioCtx.destination);

    if (type === 'bell') {
        // Classic bell: sine wave with exponential decay + overtone
        [1, 2, 3].forEach((mult, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880 * mult;
            g.gain.setValueAtTime(0.6 / (i + 1), audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);
            osc.connect(g);
            g.connect(master);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 1.6);
        });
        master.gain.setValueAtTime(1, audioCtx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.6);
        return 1700;

    } else if (type === 'digital') {
        // Digital beep sequence
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = 880;
            const t = audioCtx.currentTime + i * 0.25;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.5, t + 0.01);
            g.gain.setValueAtTime(0.5, t + 0.15);
            g.gain.linearRampToValueAtTime(0, t + 0.2);
            osc.connect(g);
            g.connect(master);
            osc.start(t);
            osc.stop(t + 0.22);
        }
        master.gain.setValueAtTime(1, audioCtx.currentTime);
        return 900;

    } else if (type === 'gentle') {
        // Soft ascending chime
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = audioCtx.currentTime + i * 0.18;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.4, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
            osc.connect(g);
            g.connect(master);
            osc.start(t);
            osc.stop(t + 0.65);
        });
        master.gain.setValueAtTime(1, audioCtx.currentTime);
        return 1000;
    }
    return 500;
}

export function useAlarm() {
    const audioCtxRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const activeNodesRef = useRef([]);
    const loopTidRef = useRef(null);

    const stop = useCallback(() => {
        setIsPlaying(false);
        if (loopTidRef.current) {
            clearInterval(loopTidRef.current);
            loopTidRef.current = null;
        }
        activeNodesRef.current.forEach(n => {
            try { n.stop(); } catch { }
            try { n.disconnect(); } catch { }
        });
        activeNodesRef.current = [];
    }, []);

    const ensureCtx = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    // Play the selected alarm at given volume
    const play = useCallback((settings) => {
        stop(); // stop any currently playing alarm

        const { alarm, alarmVolume, customAlarmUrl, alarmRepeat } = settings;
        const ctx = ensureCtx();
        if (ctx.state === 'suspended') ctx.resume();

        setIsPlaying(true);

        if (alarm === 'custom' && customAlarmUrl) {
            fetch(customAlarmUrl)
                .then(r => r.arrayBuffer())
                .then(buf => ctx.decodeAudioData(buf))
                .then(decoded => {
                    const src = ctx.createBufferSource();
                    const g = ctx.createGain();
                    src.buffer = decoded;
                    g.gain.value = alarmVolume;
                    if (alarmRepeat) src.loop = true;
                    src.connect(g);
                    g.connect(ctx.destination);
                    src.start();
                    activeNodesRef.current.push(src, g);

                    // Natural disconnect after some time if not repeating
                    if (!alarmRepeat) {
                        src.onended = () => setIsPlaying(false);
                    }
                })
                .catch(() => {
                    // Fallback to bell if custom fails
                    triggerBuiltinLoop(ctx, 'bell', alarmVolume, alarmRepeat);
                });
        } else {
            triggerBuiltinLoop(ctx, alarm, alarmVolume, alarmRepeat);
        }
    }, [stop]);

    const triggerBuiltinLoop = useCallback((ctx, type, volume, repeat) => {
        const schedule = () => {
            const nodes = playBuiltin(ctx, type, volume);
            activeNodesRef.current.push(...nodes);
        };
        schedule();

        if (repeat) {
            loopTidRef.current = setInterval(() => schedule(), 2500);
        } else {
            setTimeout(() => setIsPlaying(false), 2000);
        }
    }, []);

    const playBuiltin = (ctx, type, volume) => {
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.connect(ctx.destination);
        const nodes = [master];

        if (type === 'bell') {
            [1, 2, 3].forEach((mult, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                nodes.push(osc, g);
                osc.type = 'sine';
                osc.frequency.value = 880 * mult;
                g.gain.setValueAtTime(0.6 / (i + 1), ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
                osc.connect(g);
                g.connect(master);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 1.6);
            });
            master.gain.setValueAtTime(volume, ctx.currentTime);
            master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

        } else if (type === 'digital') {
            for (let i = 0; i < 3; i++) {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                nodes.push(osc, g);
                osc.type = 'square';
                osc.frequency.value = 880;
                const t = ctx.currentTime + i * 0.28;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(volume * 0.5, t + 0.01);
                g.gain.setValueAtTime(volume * 0.5, t + 0.18);
                g.gain.linearRampToValueAtTime(0, t + 0.22);
                osc.connect(g);
                g.connect(master);
                osc.start(t);
                osc.stop(t + 0.25);
            }
            master.gain.setValueAtTime(1, ctx.currentTime);

        } else if (type === 'gentle') {
            const freqs = [523, 659, 784, 1047];
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                nodes.push(osc, g);
                osc.type = 'sine';
                osc.frequency.value = freq;
                const t = ctx.currentTime + i * 0.18;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(volume * 0.4, t + 0.05);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
                osc.connect(g);
                g.connect(master);
                osc.start(t);
                osc.stop(t + 0.65);
            });
            master.gain.setValueAtTime(1, ctx.currentTime);
        }
        return nodes;
    };

    // Preview a tone type
    const preview = useCallback((type, volume = 0.6) => {
        stop();
        const ctx = ensureCtx();
        if (ctx.state === 'suspended') ctx.resume();
        playBuiltin(ctx, type, volume);
    }, [stop]);

    return { play, preview, stop, isPlaying };
}

// ============================================================
// useNotifications.js inlined here
// ============================================================
export function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

export function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
    }
}
