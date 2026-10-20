import { useState, useEffect } from 'react';
import {
  STAGES,
  STATUS,
  TASK_TYPES,
  TEAM,
  AI_TOOLS,
  STORAGE_KEYS,
  seedTasks,
  seedAnchors,
} from './model';

export { STAGES, STATUS, TEAM };

/**
 * A tiny localStorage hook — survives reloads, no library needed.
 * Pre-populates with initialValue when stored data is absent or empty.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(initialValue) && initialValue.length > 0) {
          return initialValue;
        }
        return parsed;
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private-mode error — silently ignore for hackathon */
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * TaskDetailsModal Component
 * Dedicated read-only view for cleanly reading task details and AI prompt context.
 * Prevents accidental edits, with an "Edit Task" button to transition to edit mode.
 */
function TaskDetailsModal({ isOpen, onClose, onEdit, onDelete, task }) {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isBug = task.type === 'bug';
  const stage = STAGES.find((s) => s.id === task.status);

  const stageAccents = {
    'todo': 'bg-brand-accent',
    'in-progress': 'bg-due-warning',
    'review': 'bg-brand-primary',
    'done': 'bg-type-feature',
  };

  const accentDot = stageAccents[task.status] || 'bg-slate-400';

  const handleDelete = () => {
    if (window.confirm('Delete Task? This cannot be undone.')) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-surface-border bg-surface-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider font-semibold ${
                isBug
                  ? 'bg-[#EC4899]/10 text-type-bug border border-type-bug/30'
                  : 'bg-[#10B981]/10 text-type-feature border border-type-feature/30'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBug ? 'bg-type-bug' : 'bg-type-feature'
                }`}
              />
              {task.type}
            </span>
            <span className="text-xs font-mono text-text-muted bg-surface-page border border-surface-border px-2 py-0.5 rounded">
              #{task.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-border/50 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold font-heading text-text-primary leading-snug">
              {task.title}
            </h2>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-surface-page border border-surface-border/70 text-xs">
            {/* Status */}
            <div>
              <span className="block font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Status
              </span>
              <div className="flex items-center gap-1.5 font-medium text-text-primary">
                <span className={`h-2 w-2 rounded-full ${accentDot}`} />
                <span>{stage?.label || task.status}</span>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <span className="block font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Assignee
              </span>
              <div className="flex items-center gap-1.5 font-medium text-text-primary">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-border text-[9px] font-mono">
                  {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
                </div>
                <span>{task.assignee || 'Unassigned'}</span>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <span className="block font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Due Date
              </span>
              <span className="font-mono text-text-primary">
                {task.dueDate || 'No deadline'}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-2">
              Description
            </h3>
            {task.description ? (
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap bg-surface-page/50 p-3.5 rounded-lg border border-surface-border/50">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-text-muted italic">No description provided.</p>
            )}
          </div>

          {/* AI Context Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
                Prompt Context
              </h3>
              {task.contextTool && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-primary/15 border border-brand-primary/30 text-brand-accent">
                  Tool: {task.contextTool}
                </span>
              )}
            </div>

            {task.context ? (
              <div className="bg-surface-page border border-surface-border rounded-lg p-3.5 font-mono text-xs text-text-primary whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {task.context}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No AI prompt context saved for this task.</p>
            )}

            {task.contextUpdatedAt && (
              <p className="text-[11px] font-mono text-text-muted mt-1.5">
                Context updated: {new Date(task.contextUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Creation Date Footer */}
          <div className="text-[11px] font-mono text-text-muted pt-2 border-t border-surface-border/50">
            Created on {task.createdDate}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-page/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 active:scale-95 transition-all"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-border/50 active:scale-95 transition-all"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium active:scale-95 transition-all shadow-sm shadow-brand-primary/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TaskFormModal Component
 * Handles creating a new task or editing an existing task's fields.
 */
function TaskFormModal({ isOpen, onClose, onSave, onDelete, task }) {
  const isEditing = Boolean(task);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature',
    status: 'todo',
    assignee: '',
    dueDate: '',
    context: '',
    contextTool: '',
  });

  const [error, setError] = useState('');

  // Sync state whenever the modal opens or the active task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'feature',
        status: task.status || 'todo',
        assignee: task.assignee || '',
        dueDate: task.dueDate || '',
        context: task.context || '',
        contextTool: task.contextTool || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'feature',
        status: 'todo',
        assignee: '',
        dueDate: '',
        context: '',
        contextTool: '',
      });
    }
    setError('');
  }, [task, isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    onSave({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      assignee: formData.assignee || null,
      dueDate: formData.dueDate || null,
      context: formData.context.trim(),
      contextTool: formData.contextTool || null,
    });
  };

  const handleDelete = () => {
    if (window.confirm('Delete Task? This cannot be undone.')) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-surface-border bg-surface-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold font-heading text-text-primary">
              {isEditing ? 'Edit Task' : 'Add Task'}
            </h2>
            {isEditing && (
              <span className="text-xs font-mono text-text-muted bg-surface-page border border-surface-border px-2 py-0.5 rounded">
                #{task.id}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-border/50 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (error) setError('');
              }}
              placeholder="e.g. Implement search filtering"
              autoFocus
              className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
            {error && <p className="text-xs text-red-400 mt-1 font-mono">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task details and scope..."
              className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors resize-none"
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-surface-card text-text-primary">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-surface-card text-text-primary">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              >
                <option value="" className="bg-surface-card text-text-muted">Unassigned</option>
                {TEAM.map((member) => (
                  <option key={member} value={member} className="bg-surface-card text-text-primary">
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              />
            </div>
          </div>

          {/* AI Context & AI Tool Selector */}
          <div className="pt-2 border-t border-surface-border/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
                Prompt Context
              </label>
              <div className="w-36">
                <select
                  value={formData.contextTool}
                  onChange={(e) => setFormData({ ...formData, contextTool: e.target.value })}
                  className="w-full bg-surface-page border border-surface-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                >
                  <option value="" className="bg-surface-card text-text-muted">Tool: None</option>
                  {AI_TOOLS.map((tool) => (
                    <option key={tool} value={tool} className="bg-surface-card text-text-primary">
                      {tool}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              rows={3}
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              placeholder="Paste prompt constraints, system briefings, or AI context..."
              className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors resize-none"
            />
          </div>

          {/* Autofilled metadata info when editing */}
          {isEditing && (
            <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-1">
              <span>Created: {task.createdDate}</span>
              {task.contextUpdatedAt && (
                <span>Context updated: {new Date(task.contextUpdatedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-page/50 flex items-center justify-between gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 active:scale-95 transition-all"
            >
              Delete Task
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-border/50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium active:scale-95 transition-all shadow-sm shadow-brand-primary/20"
            >
              {isEditing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TaskCard Component
 * Displays a single task card. Clicking opens the view details modal.
 */
function TaskCard({ task, onTaskClick }) {
  const isBug = task.type === 'bug';

  return (
    <article
      onClick={() => onTaskClick(task)}
      className="group relative rounded-lg border border-surface-border bg-surface-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500/60 shadow-sm cursor-pointer"
    >
      {/* Top row: Type badge & Task ID */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold ${
            isBug
              ? 'bg-[#EC4899]/10 text-type-bug border border-type-bug/30'
              : 'bg-[#10B981]/10 text-type-feature border border-type-feature/30'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isBug ? 'bg-type-bug' : 'bg-type-feature'
            }`}
          />
          {task.type}
        </span>
        <span className="text-[11px] font-mono text-text-muted">#{task.id}</span>
      </div>

      {/* Task Name */}
      <h3 className="font-medium text-sm text-text-primary leading-snug group-hover:text-white transition-colors">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="mt-1.5 text-xs text-text-muted line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Assignee & Due Date */}
      <div className="mt-4 flex items-center justify-between border-t border-surface-border/60 pt-3">
        {/* Assignee */}
        <div
          className="flex items-center gap-2"
          title={`Assignee: ${task.assignee || 'Unassigned'}`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-border text-[11px] font-mono font-medium text-text-primary ring-1 ring-white/10">
            {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-xs text-text-muted font-medium">
            {task.assignee || 'Unassigned'}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className="flex items-center gap-1 text-[11px] font-mono text-text-muted"
            title={`Due date: ${task.dueDate}`}
          >
            <svg
              className="h-3.5 w-3.5 opacity-70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * KanbanColumn Component
 * Renders one of the four columns with column header and list of cards.
 */
function KanbanColumn({ stage, tasks, onTaskClick }) {
  const stageAccents = {
    'todo': 'bg-brand-accent',
    'in-progress': 'bg-due-warning',
    'review': 'bg-brand-primary',
    'done': 'bg-type-feature',
  };

  const accentDot = stageAccents[stage.id] || 'bg-slate-400';

  return (
    <section className="flex flex-col rounded-xl bg-surface-card/30 border border-surface-border/60 p-3 sm:p-4 min-h-[500px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border/50">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${accentDot}`} />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-primary font-heading">
            {stage.label}
          </h2>
        </div>
        <span className="font-mono text-xs font-medium text-text-muted bg-surface-card border border-surface-border px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Task Cards Stack */}
      <div className="flex flex-col gap-3 flex-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-surface-border p-6 text-center">
            <p className="font-mono text-xs text-text-muted">No tasks here yet!</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function App() {
  // Milestone 4: Load tasks persisted to localStorage, seeded with initial mock tasks
  const [tasks, setTasks] = useLocalStorage(STORAGE_KEYS.tasks, seedTasks);

  // View details modal state (separate modal to view task without accidental edits)
  const [viewingTask, setViewingTask] = useState(null);

  // Form modal state (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // TODO M11 anchors:
  //   const [anchors, setAnchors] = useLocalStorage(STORAGE_KEYS.anchors, seedAnchors);

  const handleOpenCreateModal = () => {
    setViewingTask(null);
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleOpenViewModal = (task) => {
    setViewingTask(task);
  };

  const handleStartEditFromView = (task) => {
    setViewingTask(null);
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleCloseViewModal = () => {
    setViewingTask(null);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      // Edit existing task
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== editingTask.id) return t;
          const contextChanged = t.context !== taskData.context;
          return {
            ...t,
            ...taskData,
            contextUpdatedAt: contextChanged ? new Date().toISOString() : t.contextUpdatedAt,
          };
        })
      );
    } else {
      // Add new task
      const newTask = {
        id: `t-${Date.now().toString(36)}`,
        ...taskData,
        createdDate: new Date().toISOString().slice(0, 10),
        contextUpdatedAt: taskData.context ? new Date().toISOString() : null,
      };
      setTasks((prev) => [...prev, newTask]);
    }
    handleCloseFormModal();
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    handleCloseFormModal();
    handleCloseViewModal();
  };

  return (
    <div className="min-h-screen bg-surface-page text-text-primary font-body p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary font-bold">
              V
            </div>
            <h1 className="text-2xl font-bold font-heading text-text-primary tracking-tight">
              Vibecoding Project Tracker<span className="text-brand-primary">.</span>
            </h1>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Organised and clearheaded ready to take on your next task.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-all duration-150 active:scale-95 shadow-sm shadow-brand-primary/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </header>

      {/* TODO M11 anchors: Render the Deliverable Anchor Board (Presentation / Demo / Report / Documentation) */}

      {/* Four-Column Kanban Board Layout */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {STAGES.map((stage) => {
          const columnTasks = tasks.filter((task) => task.status === stage.id);
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              tasks={columnTasks}
              onTaskClick={handleOpenViewModal}
            />
          );
        })}
      </main>

      {/* View Task Details Modal */}
      <TaskDetailsModal
        isOpen={Boolean(viewingTask)}
        onClose={handleCloseViewModal}
        onEdit={handleStartEditFromView}
        onDelete={handleDeleteTask}
        task={viewingTask}
      />

      {/* Add / Edit Task Form Modal */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={editingTask}
      />
    </div>
  );
}
