// ============================================================
// TaskModal.jsx — Add / Edit task modal
// ============================================================
import React, { useState, useEffect } from 'react';

const EMPTY = {
    name: '',
    description: '',
    deadline: '',
    estimatedPomodoros: 2,
    status: 'pending',
};

export default function TaskModal({ task, onSave, onClose }) {
    const [form, setForm] = useState(EMPTY);
    const isEdit = !!task;

    useEffect(() => {
        if (task) setForm({
            name: task.name || '',
            description: task.description || '',
            deadline: task.deadline || '',
            estimatedPomodoros: task.estimatedPomodoros || 2,
            status: task.status || 'pending',
        });
        else setForm(EMPTY);
    }, [task]);

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave({ ...form, estimatedPomodoros: Number(form.estimatedPomodoros) || 1 });
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <span className="modal-title">{isEdit ? 'Edit Task' : '+ New Task'}</span>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <form className="task-form" onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Task Name *</label>
                        <input
                            className="form-input"
                            placeholder="What are you working on?"
                            value={form.name}
                            onChange={set('name')}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Optional notes..."
                            value={form.description}
                            onChange={set('description')}
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Deadline</label>
                            <input
                                className="form-input"
                                type="date"
                                value={form.deadline}
                                onChange={set('deadline')}
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>

                        <div className="form-group" style={{ width: 120 }}>
                            <label className="form-label">🍅 Estimate</label>
                            <input
                                className="form-input"
                                type="number"
                                min={1} max={20}
                                value={form.estimatedPomodoros}
                                onChange={set('estimatedPomodoros')}
                            />
                        </div>
                    </div>

                    {isEdit && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={set('status')}>
                                <option value="pending">Pending</option>
                                <option value="inprogress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Add Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
