// ============================================================
// TimerRing.jsx — SVG progress ring
// ============================================================
import React from 'react';

const R = 125;
const CIRCUMFERENCE = 2 * Math.PI * R;

const ACCENT = {
    focus: { stroke: '#e55a5a', glow: 'rgba(229,90,90,0.3)' },
    short: { stroke: '#34d399', glow: 'rgba(52,211,153,0.3)' },
    long: { stroke: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
};

export default function TimerRing({ progress, mode, size = 280, children }) {
    const strokeW = 10;
    const cx = size / 2, cy = size / 2;
    const r = (size - strokeW * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(1, Math.max(0, progress)));
    const accent = ACCENT[mode] || ACCENT.focus;

    return (
        <div className="ring-container" style={{ width: size, height: size }}>
            <svg
                className="ring-svg"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ filter: `drop-shadow(0 0 14px ${accent.glow})` }}
            >
                {/* Defs for glow */}
                <defs>
                    <filter id={`glow-${mode}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Track */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeW}
                />

                {/* Progress */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={accent.stroke}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
                    filter={`url(#glow-${mode})`}
                />
            </svg>

            {/* Center content */}
            <div className="ring-center" style={{ transform: 'translate(-50%, -50%)' }}>
                {children}
            </div>
        </div>
    );
}
