// ============================================================
// SettingsPage.jsx — All app settings
// ============================================================
import React, { useRef } from 'react';
import { useAlarm } from '../useAlarm';

const ALARM_OPTIONS = [
    { id: 'bell', label: 'Bell', emoji: '🔔' },
    { id: 'digital', label: 'Digital', emoji: '📟' },
    { id: 'gentle', label: 'Gentle', emoji: '🎶' },
    { id: 'custom', label: 'Custom', emoji: '📂' },
];

export default function SettingsPage({ settings, onUpdate }) {
    const { play } = useAlarm();
    const fileRef = useRef(null);

    const set = (key) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        onUpdate({ [key]: val });
    };

    const setNum = (key) => (e) => {
        const n = parseInt(e.target.value, 10);
        if (!isNaN(n) && n > 0) onUpdate({ [key]: n });
    };

    const handleCustomUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Ensure file isn't too large for localStorage (limit 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File is too large! Please choose an audio file under 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            onUpdate({ alarm: 'custom', customAlarmUrl: event.target.result, customAlarmName: file.name });
        };
        reader.readAsDataURL(file);
    };

    const handleNotifToggle = (e) => {
        const enabled = e.target.checked;
        if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission().then(p => {
                onUpdate({ notificationsEnabled: p === 'granted' });
            });
        } else {
            onUpdate({ notificationsEnabled: enabled });
        }
    };

    return (
        <div>
            <div className="section-header" style={{ marginBottom: 20 }}>
                <span className="section-title">Settings</span>
            </div>

            <div className="settings-grid">

                {/* Timer Durations */}
                <div className="card">
                    <div className="settings-section-title">⏱ Timer Durations</div>
                    {[
                        { key: 'focusDuration', label: 'Focus', desc: 'minutes of deep work' },
                        { key: 'shortBreak', label: 'Short Break', desc: 'minutes' },
                        { key: 'longBreak', label: 'Long Break', desc: 'minutes' },
                        { key: 'longBreakAfter', label: 'Long break after', desc: 'focus sessions' },
                    ].map(({ key, label, desc }) => (
                        <div key={key} className="toggle-row">
                            <div>
                                <div className="toggle-label">{label}</div>
                                <div className="toggle-desc">{desc}</div>
                            </div>
                            <div className="duration-input-wrap">
                                <input
                                    className="duration-input"
                                    type="number"
                                    min={1}
                                    max={key === 'longBreakAfter' ? 10 : 90}
                                    value={settings[key] ?? ''}
                                    onChange={setNum(key)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Behavior */}
                <div className="card">
                    <div className="settings-section-title">⚙️ Behavior</div>
                    <div className="toggle-row">
                        <div>
                            <div className="toggle-label">Repeat Alarm</div>
                            <div className="toggle-desc">Keep ringing until dismissed</div>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={!!settings.alarmRepeat} onChange={set('alarmRepeat')} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                    <div className="toggle-row">
                        <div>
                            <div className="toggle-label">Auto-Next Session</div>
                            <div className="toggle-desc">Automatically start next phase</div>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={!!settings.autoNext} onChange={set('autoNext')} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                    <div className="toggle-row">
                        <div>
                            <div className="toggle-label">Browser Notifications</div>
                            <div className="toggle-desc">Get a popup when a session ends</div>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={!!settings.notificationsEnabled} onChange={handleNotifToggle} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>

                {/* Alarm */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="settings-section-title">🔔 Alarm Sound</div>

                    <div className="alarm-options">
                        {ALARM_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                className={`alarm-option ${settings.alarm === opt.id ? 'selected' : ''}`}
                                onClick={() => {
                                    onUpdate({ alarm: opt.id });
                                    if (opt.id !== 'custom') play({ ...settings, alarm: opt.id, alarmRepeat: false });
                                    if (opt.id === 'custom' && !settings.customAlarmUrl) fileRef.current?.click();
                                }}
                            >
                                <span className="alarm-icon">{opt.emoji}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleCustomUpload} />

                    {settings.alarm === 'custom' && (
                        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', marginTop: 8 }}>
                            {settings.customAlarmUrl ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: 'var(--success)', marginRight: 6 }}>✓</span>
                                        <strong>{settings.customAlarmName || 'custom_audio.mp3'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                                            Change
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-focus)' }} onClick={() => onUpdate({ alarm: 'bell', customAlarmUrl: null, customAlarmName: null })}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.78rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>⚠ No custom file loaded.</span>
                                    <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
                                        Upload Audio
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview button */}
                    {(settings.alarm !== 'custom' || settings.customAlarmUrl) && (
                        <div style={{ marginBottom: 14 }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => play({ ...settings, alarmRepeat: false })}
                            >
                                ▶ Preview {settings.alarm === 'custom' ? 'Custom' : settings.alarm} sound
                            </button>
                        </div>
                    )}

                    {/* Volume */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span className="form-label">Volume</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {Math.round((settings.alarmVolume ?? 0.7) * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            className="volume-slider"
                            min={0} max={1} step={0.05}
                            value={settings.alarmVolume ?? 0.7}
                            onChange={(e) => onUpdate({ alarmVolume: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                {/* About */}
                <div className="card">
                    <div className="settings-section-title">ℹ️ About Polmo</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        <b>Polmo</b> is a Pomodoro focus timer with task tracking.<br />
                        No accounts, no AI, no cloud — all data is stored locally in your browser.<br />
                        <br />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>v1.0.0 — Built with React + Vite</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
