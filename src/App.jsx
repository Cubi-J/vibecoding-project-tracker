import { useState, useEffect } from 'react';
import {
  STAGES,
  STATUS,
  TEAM,
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
 * TaskCard Component
 * Displays a single task card with task name, assignee, type badge, and metadata.
 */
function TaskCard({ task }) {
  const isBug = task.type === 'bug';

  return (
    <article className="group relative rounded-lg border border-surface-border bg-surface-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600/60 shadow-sm">
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
function KanbanColumn({ stage, tasks }) {
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
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
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
  // Milestone 4: Load tasks initialized with seed data (4-5 sample tasks)
  const [tasks] = useLocalStorage(STORAGE_KEYS.tasks, seedTasks);

  // TODO M5 crud-modal:
  //   const [editing, setEditing] = useState(null);

  // TODO M11 anchors:
  //   const [anchors, setAnchors] = useLocalStorage(STORAGE_KEYS.anchors, seedAnchors);

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
            />
          );
        })}
      </main>
    </div>
  );
}
