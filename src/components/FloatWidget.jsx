// ============================================================
// FloatWidget.jsx — Draggable minimized overlay widget
// ============================================================
import React, { useRef, useState, useEffect } from 'react';

const ACCENT = {
    focus: { stroke: '#e55a5a', track: '#2a1414' },
    short: { stroke: '#34d399', track: '#142a20' },
    long: { stroke: '#a78bfa', track: '#1e1430' },
};

export default function FloatWidget({ timerState, onRestore, onToggle }) {
    const { mode, formatted, progress, running } = timerState;
    const accent = ACCENT[mode] || ACCENT.focus;

    const ref = useRef(null);
    const drag = useRef({ active: false, ox: 0, oy: 0, ex: 0, ey: 0 });
    const [pos, setPos] = useState({ right: 24, bottom: 24 });

    // SVG ring
    const size = 48;
    const sw = 4;
    const r = (size - sw * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(1, Math.max(0, progress)));

    const handleMouseDown = (e) => {
        if (e.target.closest('.float-btn')) return;
        drag.current = {
            active: true,
            ox: e.clientX,
            oy: e.clientY,
            ex: ref.current.getBoundingClientRect().left,
            ey: ref.current.getBoundingClientRect().top,
        };
        e.preventDefault();
    };

    useEffect(() => {
        const move = (e) => {
            if (!drag.current.active) return;
            const dx = e.clientX - drag.current.ox;
            const dy = e.clientY - drag.current.oy;
            const newX = drag.current.ex + dx;
            const newY = drag.current.ey + dy;
            const el = ref.current;
            if (!el) return;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const bx = Math.max(8, Math.min(vw - el.offsetWidth - 8, newX));
            const by = Math.max(8, Math.min(vh - el.offsetHeight - 8, newY));
            el.style.left = bx + 'px';
            el.style.top = by + 'px';
            el.style.bottom = 'auto';
            el.style.right = 'auto';
        };
        const up = () => { drag.current.active = false; };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, []);

    const modeLabel = mode === 'focus' ? '🍅 Focus' : mode === 'short' ? '☕ Short Break' : '🌙 Long Break';

    return (
        <div
            ref={ref}
            className="float-widget"
            onMouseDown={handleMouseDown}
            style={{ right: pos.right, bottom: pos.bottom }}
        >
            {/* Mini ring */}
            <div className="float-ring">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent.track} strokeWidth={sw} />
                    <circle
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={accent.stroke} strokeWidth={sw} strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.95s linear' }}
                    />
                </svg>
                {/* center dot */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: running ? accent.stroke : 'var(--text-muted)',
                    boxShadow: running ? `0 0 8px ${accent.stroke}` : 'none',
                    transition: 'all 0.3s',
                }} />
            </div>

            {/* Info */}
            <div className="float-info">
                <div className="float-time">{formatted}</div>
                <div className="float-label">{modeLabel}</div>
            </div>

            {/* Actions */}
            <div className="float-actions">
                <button className="float-btn" title={running ? 'Pause' : 'Start'} onClick={onToggle}>
                    {running ? '⏸' : '▶'}
                </button>
                <button className="float-btn" title="Open app" onClick={onRestore}>
                    ⤢
                </button>
            </div>
        </div>
    );
}
