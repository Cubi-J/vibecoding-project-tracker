/**
 * Data model for the Vibecoding Project Tracker.
 *
 * This file centralises every constant, type definition, and seed value that
 * describes the shape of the data the app works with.  UI components in
 * App.jsx (and later milestone files) should import from here rather than
 * re-declaring their own copies.
 *
 * Conventions
 *  - All identifiers for status / type values are **lowercase, kebab-case
 *    strings** so they can be used directly as CSS class fragments.
 *  - Dates are stored as **ISO 'YYYY-MM-DD' strings** (see PRD §3.1).
 *  - Every identifier for a Task.status is a key in STAGES, so the two never
 *    drift out of sync.
 *
 * Milestones that consume this file:
 *   M4  data-model  — render board using STAGES, seedTasks
 *   M5  crud-modal  — createTask() factory for new tasks
 *   M6  tag-style   — TASK_TYPES  → colour accent on cards
 *   M7  task-owner  — TEAM        → assignee badge / hand-off dropdown
 *   M8  due-tint    — due-date colour logic (pure function)
 *   M9  context     — AI_TOOLS    → AI tool selector
 *   M10 copy-prompt — serialise Task → Markdown (uses context/contextTool)
 *   M11 anchors     — seedAnchors → Anchor Board
 */

/* ———————————————————————————————————————————————————————
 * Storage keys
 * ——————————————————————————————————————————————————————— */

export const STORAGE_KEYS = {
  tasks: 'vibetracker.tasks',
  anchors: 'vibetracker.anchors',
  teamAvatars: 'vibetracker.team_avatars',
  team: 'vibetracker.team',
};

/* ———————————————————————————————————————————————————————
 * Type definitions
 * ——————————————————————————————————————————————————————— */

/**
 * @typedef {Object} Task
 * @property {string} id                  Unique identifier (uuid v4)
 * @property {string} title               Short task header
 * @property {string} description         Detailed description
 * @property {'feature'|'bug'|'vulnerability'} type Driving visual styling (M6 tag-style)
 * @property {'todo'|'in-progress'|'review'|'done'} status Column location
 * @property {string|null} assignee       Team member working on it (M7 task-owner)
 * @property {string|null} dueDate        ISO 'YYYY-MM-DD' — null means no deadline
 * @property {string} createdDate         ISO 'YYYY-MM-DD' — set at creation
 * @property {string} context             Markdown block for AI prompt history (M9)
 * @property {'Claude'|'ChatGPT'|'Cursor'|'Lovable'|'Replit'|'Other'|null} contextTool
 * @property {string|null} contextUpdatedAt ISO timestamp set automatically on update
 */

/**
 * @typedef {Object} Anchor
 * @property {'presentation'|'demo'|'report'|'documentation'} id  Fixed slot identifier
 * @property {string} label               Display label for the deliverable
 * @property {string|null} url            URL link pasted by user — null = not yet filled
 */

/* ———————————————————————————————————————————————————————
 * Board columns (STAGES)
 * ——————————————————————————————————————————————————————— */

/** The four columns of the Kanban board, in render order. */
export const STAGES = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'done',        label: 'Done' },
];

/** Convenience: status string literals. */
export const STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done',
};

/* ———————————————————————————————————————————————————————
 * Task type options (M6 tag-style)
 * ——————————————————————————————————————————————————————— */

export const TASK_TYPES = [
  { value: 'feature',       label: 'Feature' },
  { value: 'bug',           label: 'Bug' },
  { value: 'vulnerability', label: 'Vulnerability' },
];

/* ———————————————————————————————————————————————————————
 * Team / assignee options (M7 task-owner)
 * ——————————————————————————————————————————————————————— */

export const TEAM = [
  'Teammate A',
  'Teammate B',
  'Teammate C',
];

/* ———————————————————————————————————————————————————————
 * AI tool options (M9 context)
 * ——————————————————————————————————————————————————————— */

export const AI_TOOLS = [
  'Claude',
  'ChatGPT',
  'Cursor',
  'Lovable',
  'Replit',
  'Other',
];

/* ———————————————————————————————————————————————————————
 * Due Date State / Colour Tinting (M8 due-tint)
 * ——————————————————————————————————————————————————————— */

/**
 * Pure function: calculates due date state and border/badge color styling
 * based on PRD §1.3 and DESIGN.md §2.
 *
 * Rules:
 *  - Neutral: Task status is 'done' regardless of due date (#475569).
 *  - None: No deadline provided (uses default surface border).
 *  - Alarm (Overdue): Past due date (#EF4444).
 *  - Warning: Less than 24 hours remaining (#F59E0B).
 *  - Calm (Safe): More than 2 days out (#3B82F6).
 *
 * @param {string|null} dueDate - ISO 'YYYY-MM-DD'
 * @param {string} status - 'todo' | 'in-progress' | 'review' | 'done'
 * @param {Date} [now=new Date()]
 * @returns {{ state: 'neutral'|'none'|'overdue'|'warning'|'safe', borderClass: string, badgeClass: string, label: string }}
 */
export function getDueStatus(dueDate, status, now = new Date()) {
  if (status === 'done') {
    return {
      state: 'neutral',
      borderClass: 'border-due-neutral/70 hover:border-due-neutral',
      badgeClass: 'text-due-neutral bg-due-neutral/10 border-due-neutral/30',
      label: 'Done',
    };
  }

  if (!dueDate) {
    return {
      state: 'none',
      borderClass: 'border-surface-border hover:border-slate-500/60',
      badgeClass: 'text-text-muted bg-surface-page/80 border-surface-border/80',
      label: '',
    };
  }

  const [year, month, day] = dueDate.split('-').map(Number);
  const dueDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);
  const diffMs = dueDateTime.getTime() - now.getTime();

  if (diffMs < 0) {
    return {
      state: 'overdue',
      borderClass: 'border-due-overdue/80 hover:border-due-overdue shadow-sm shadow-due-overdue/10',
      badgeClass: 'text-due-overdue bg-due-overdue/10 border-due-overdue/30',
      label: 'Overdue',
    };
  }

  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      state: 'warning',
      borderClass: 'border-due-warning/80 hover:border-due-warning shadow-sm shadow-due-warning/10',
      badgeClass: 'text-due-warning bg-due-warning/10 border-due-warning/30',
      label: 'Due soon',
    };
  }

  return {
    state: 'safe',
    borderClass: 'border-due-safe/70 hover:border-due-safe',
    badgeClass: 'text-due-safe bg-due-safe/10 border-due-safe/30',
    label: 'On track',
  };
}

/* ———————————————————————————————————————————————————————
 * Seed data — pre-populated on first launch
 * ——————————————————————————————————————————————————————— */

/**
 * Factory: create a Task with sensible defaults.
 *
 * @param {string} id
 * @param {string} title
 * @param {string} description
 * @param {'feature'|'bug'|'vulnerability'} type
 * @param {'todo'|'in-progress'|'review'|'done'} status
 * @param {string|null} assignee
 * @param {string|null} dueDate
 * @returns {Task}
 */
export function createTask(id, title, description, type, status, assignee, dueDate) {
  const createdDate = new Date().toISOString().slice(0, 10);
  return {
    id,
    title,
    description,
    type,
    status,
    assignee,
    dueDate,
    createdDate,
    // Context & Vibecoding — empty until the user fills them in (M9)
    context: '',
    contextTool: null,
    contextUpdatedAt: null,
  };
}

const nowMs = Date.now();
const todayIso = new Date(nowMs).toISOString().slice(0, 10);
const futureIso = new Date(nowMs + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const pastIso = new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * Pre-populated mock tasks so the board is not empty on first launch (PRD §1.1).
 */
export const seedTasks = [
  createTask(
    't-001',
    'Set up Vite + Tailwind scaffold',
    'Bootstrap the dev environment so the team can start building features on day one.',
    'feature',
    'done',
    'Teammate A',
    todayIso,
  ),
  createTask(
    't-002',
    'Fix dark-mode flash on initial load',
    'Users see a brief white flash before the dark theme kicks in. Need to persist the class on <html> early.',
    'bug',
    'in-progress',
    'Teammate B',
    todayIso,
  ),
  createTask(
    't-003',
    'Design the Kanban card component',
    'Build the reusable card that shows title, type badge, due date, and assignee.',
    'feature',
    'todo',
    'Teammate C',
    futureIso,
  ),
  createTask(
    't-004',
    'Audit localStorage against XSS injection',
    'Ensure stored task contexts are properly sanitized to prevent potential script execution vulnerabilities.',
    'vulnerability',
    'review',
    'Teammate C',
    pastIso,
  ),
  createTask(
    't-005',
    'Implement Task Creation Modal',
    'Add modal form to capture task details, AI context, and tool selections.',
    'feature',
    'todo',
    'Teammate A',
    null,
  ),
];

/**
 * Four default anchor cards — all unfilled on first launch (PRD §1.1).
 * Each represents a hackathon deliverable with a single URL input field.
 */
export const seedAnchors = [
  { id: 'presentation',  label: 'Presentation',   url: null },
  { id: 'demo',          label: 'Demo',           url: null },
  { id: 'report',        label: 'Report',         url: null },
  { id: 'documentation', label: 'Documentation',  url: null },
];
