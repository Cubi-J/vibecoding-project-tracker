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
};

/* ———————————————————————————————————————————————————————
 * Type definitions
 * ——————————————————————————————————————————————————————— */

/**
 * @typedef {Object} Task
 * @property {string} id                  Unique identifier (uuid v4)
 * @property {string} title               Short task header
 * @property {string} description         Detailed description
 * @property {'feature'|'bug'} type       Driving visual styling (M6 tag-style)
 * @property {'todo'|'in-progress'|'review'|'done'} status  Column location
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
  { value: 'feature', label: 'Feature' },
  { value: 'bug',     label: 'Bug' },
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
 * Seed data — pre-populated on first launch
 * ——————————————————————————————————————————————————————— */

/**
 * Factory: create a Task with sensible defaults.
 *
 * @param {string} id
 * @param {string} title
 * @param {string} description
 * @param {'feature'|'bug'} type
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
    null,
  ),
  createTask(
    't-002',
    'Fix dark-mode flash on initial load',
    'Users see a brief white flash before the dark theme kicks in. Need to persist the class on <html> early.',
    'bug',
    'in-progress',
    'Teammate B',
    new Date().toISOString().slice(0, 10),
  ),
  createTask(
    't-003',
    'Design the Kanban card component',
    'Build the reusable card that shows title, type badge, due date, and assignee.',
    'feature',
    'todo',
    'Teammate C',
    new Date().toISOString().slice(0, 10),
  ),
  createTask(
    't-004',
    'Wire up localStorage persistence',
    'Ensure tasks survive a page refresh with zero data loss.',
    'feature',
    'review',
    'Teammate C',
    null,
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
