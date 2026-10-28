import { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import {
  STAGES,
  STATUS,
  TASK_TYPES,
  TEAM,
  AI_TOOLS,
  STORAGE_KEYS,
  seedTasks,
  seedAnchors,
  seedTeamProfiles,
  getDueStatus,
} from './model';

export { STAGES, STATUS, TEAM };

/**
 * Visual styling and metadata for each supported task type.
 * 'feature' -> Emerald Green (#10B981)
 * 'bug'     -> Hot Pink (#EC4899)
 * 'vulnerability' -> Deep Urgent Purple (#9333EA)
 */
const TYPE_CONFIG = {
  feature: {
    label: 'Feature',
    badgeClass: 'bg-[#10B981]/10 text-type-feature border border-type-feature/30',
    dotClass: 'bg-type-feature',
  },
  bug: {
    label: 'Bug',
    badgeClass: 'bg-[#EC4899]/10 text-type-bug border border-type-bug/30',
    dotClass: 'bg-type-bug',
  },
  vulnerability: {
    label: 'Vulnerability',
    badgeClass: 'bg-[#9333EA]/25 text-[#D8B4FE] border border-[#9333EA]/60',
    dotClass: 'bg-[#9333EA] shadow-[0_0_8px_rgba(147,51,234,0.9)] ring-1 ring-[#D8B4FE]/40',
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.feature;
}

/**
 * Serialises a Task into a structured Markdown prompt block (Milestone 10 copy-prompt).
 * Copies Title, Description, AI Tool, and Context — ready to paste into Claude / ChatGPT etc.
 *
 * @param {Task} task
 * @returns {string} Markdown string
 */
function buildPromptMarkdown(task) {
  const lines = [];
  lines.push(`# Task: ${task.title}`);
  if (task.description) {
    lines.push('');
    lines.push('## Description');
    lines.push(task.description);
  }
  if (task.contextTool) {
    lines.push('');
    lines.push(`**AI Tool:** ${task.contextTool}`);
  }
  if (task.context) {
    lines.push('');
    lines.push('## Prompt Context');
    lines.push(task.context);
  }
  return lines.join('\n');
}

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
 * Toast Component
 * Displays toast notifications (e.g. handoff alerts) with 200ms smooth fade.
 * Microcopy per DESIGN.md §5: "{Name} has received the task! Their problem now..."
 */
function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-brand-primary/40 bg-surface-card px-4 py-3 text-sm text-text-primary shadow-2xl shadow-black/80 transition-all duration-200"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      <p className="font-medium text-xs sm:text-sm text-text-primary pr-1">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="ml-auto rounded-md p-1 text-text-muted hover:bg-surface-border hover:text-text-primary transition-colors shrink-0"
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Avatar Component
 * Displays a teammate's profile picture if uploaded, or falls back to their initial letter.
 * (e.g. "Teammate A" -> "A", "Teammate B" -> "B").
 */
function Avatar({ name, avatarUrl, size = 'sm', className = '', onClick }) {
  const sizeClasses = {
    xs: 'h-4 w-4 text-[9px]',
    sm: 'h-5 w-5 text-[10px]',
    md: 'h-7 w-7 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-14 w-14 text-base',
  }

  const selectedSize = sizeClasses[size] || sizeClasses.sm;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Teammate avatar'}
        onClick={onClick}
        className={`${selectedSize} rounded-full object-cover ring-1 ring-white/10 shrink-0 ${
          onClick ? 'cursor-pointer hover:ring-brand-accent/60 transition-all' : ''
        } ${className}`}
      />
    );
  }

  // Fallback initial: "Teammate A" -> "A", "Teammate B" -> "B", or "?"
  const initial = name
    ? name.replace(/^Teammate\s+/i, '').charAt(0).toUpperCase() || name.charAt(0).toUpperCase()
    : '?';

  return (
    <div
      onClick={onClick}
      className={`flex ${selectedSize} items-center justify-center rounded-full bg-surface-border font-mono font-medium text-text-primary ring-1 ring-white/10 shrink-0 ${
        onClick ? 'cursor-pointer hover:bg-surface-border/80 hover:ring-brand-accent/40 transition-all' : ''
      } ${className}`}
    >
      {initial}
    </div>
  );
}

/**
 * Preset avatar choices for quick fun setup (Secret Sauce)
 */
const AVATAR_PRESETS = [
  {
    name: 'Cyberpunk Violet',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%236366F1"/><circle cx="32" cy="24" r="12" fill="%23A5B4FC"/><path d="M14 54c0-10 8-16 18-16s18 6 18 16" fill="%234338CA"/><circle cx="28" cy="23" r="2.5" fill="%2306B6D4"/><circle cx="36" cy="23" r="2.5" fill="%2306B6D4"/><rect x="25" y="29" width="14" height="2" rx="1" fill="%23F43F5E"/></svg>',
  },
  {
    name: 'Neon Matrix',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%230F172A"/><circle cx="32" cy="24" r="12" fill="%2310B981"/><path d="M14 54c0-10 8-16 18-16s18 6 18 16" fill="%23047857"/><rect x="24" y="21" width="16" height="5" rx="2" fill="%2306B6D4"/><path d="M28 30h8" stroke="%2334D399" stroke-width="2" stroke-linecap="round"/></svg>',
  },
  {
    name: 'Solar Flare',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23F59E0B"/><circle cx="32" cy="24" r="12" fill="%23FEF3C7"/><path d="M14 54c0-10 8-16 18-16s18 6 18 16" fill="%23B45309"/><circle cx="28" cy="23" r="2.5" fill="%231E293B"/><circle cx="36" cy="23" r="2.5" fill="%231E293B"/><path d="M28 30c2 2 6 2 8 0" stroke="%23EF4444" stroke-width="2" stroke-linecap="round"/></svg>',
  },
  {
    name: 'Electric Pink',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23EC4899"/><circle cx="32" cy="24" r="12" fill="%23FCE7F3"/><path d="M14 54c0-10 8-16 18-16s18 6 18 16" fill="%23BE185D"/><circle cx="28" cy="22" r="2.5" fill="%236366F1"/><circle cx="36" cy="22" r="2.5" fill="%236366F1"/><path d="M27 29h10" stroke="%239333EA" stroke-width="2" stroke-linecap="round"/></svg>',
  },
];

/**
 * TeamAvatarsModal Component
 * Allows uploading custom profile pictures for teammates (Secret Sauce).
 * Includes automatic client-side canvas compression to ~128x128 keeping localStorage fast.
 */
/**
 * TeamAvatarsModal Component
 * Allows uploading custom profile pictures and adding, removing, and renaming teammates (Secret Sauce).
 * Includes automatic client-side canvas compression to ~128x128 keeping localStorage fast.
 */
function TeamAvatarsModal({
  isOpen,
  onClose,
  team,
  teamAvatars,
  teamProfiles = {},
  onUpdateAvatar,
  onAddTeammate,
  onUpdateTeammateProfile,
  onRenameTeammate,
  onRemoveTeammate,
  tasks,
}) {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberGithub, setNewMemberGithub] = useState('');
  const [addError, setAddError] = useState('');

  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editError, setEditError] = useState('');
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);

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

  const getMemberProfile = (member) => {
    return (
      teamProfiles?.[member] || {
        name: member,
        email: `${member.toLowerCase().replace(/\s+/g, '.')}@vibecoding.dev`,
        github: member.toLowerCase().replace(/\s+/g, '-'),
      }
    );
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      setAddError('Name cannot be empty');
      return;
    }
    if (team.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setAddError('A teammate with this name already exists');
      return;
    }
    onAddTeammate(trimmed, newMemberEmail.trim(), newMemberGithub.trim());
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberGithub('');
    setAddError('');
  };

  const handleStartEdit = (member) => {
    setEditingMember(member);
    const prof = getMemberProfile(member);
    setEditName(prof.name || member);
    setEditEmail(prof.email || '');
    setEditGithub(prof.github || '');
    setEditError('');
    setConfirmDeleteMember(null);
  };

  const handleSaveEdit = (member) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Name cannot be empty');
      return;
    }
    if (team.some((m) => m.toLowerCase() === trimmed.toLowerCase() && m !== member)) {
      setEditError('A teammate with this name already exists');
      return;
    }
    if (onUpdateTeammateProfile) {
      onUpdateTeammateProfile(member, {
        name: trimmed,
        email: editEmail.trim(),
        github: editGithub.trim(),
      });
    } else if (trimmed !== member) {
      onRenameTeammate(member, trimmed);
    }
    setEditingMember(null);
    setEditError('');
  };

  const handleFileUpload = (member, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 128;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onUpdateAvatar(member, dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage Team & Profiles"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/20 text-brand-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary font-heading">
                Manage Team & Profiles
              </h2>
              <p className="text-xs text-text-muted">
                Add, edit member profiles (Name, Email, GitHub), and customize avatars
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-border/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add New Teammate Form (PRD §1.5) */}
        <form onSubmit={handleAddSubmit} className="space-y-2 p-3 rounded-xl bg-surface-page/50 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Add New Team Member
            </span>
            <span className="text-[10px] text-text-muted/60 font-mono">
              Name required · Email &amp; GitHub optional
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Name (e.g. Alex Chen) *"
              value={newMemberName}
              onChange={(e) => {
                setNewMemberName(e.target.value);
                if (addError) setAddError('');
              }}
              className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40 transition-colors"
            />
            <input
              type="email"
              placeholder="Email address"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40 transition-colors"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="GitHub handle"
                value={newMemberGithub}
                onChange={(e) => setNewMemberGithub(e.target.value)}
                className="flex-1 min-w-0 bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40 transition-colors"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium active:scale-95 transition-all shrink-0 shadow-sm shadow-brand-primary/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </button>
            </div>
          </div>
          {addError && (
            <p className="text-[11px] text-red-400 font-mono px-1">{addError}</p>
          )}
        </form>

        {/* Teammates List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {team.map((member) => {
            const avatarUrl = teamAvatars?.[member];
            const profile = getMemberProfile(member);
            const assignedCount = tasks.filter((t) => t.assignee === member).length;
            const inputId = `avatar-upload-${member.replace(/\s+/g, '-')}`;
            const isEditingThis = editingMember === member;
            const isConfirmingDelete = confirmDeleteMember === member;

            return (
              <div
                key={member}
                className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface-page/60 border border-surface-border/80 transition-all"
              >
                {/* Top Row: Avatar + Name / Profile Info + Delete button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar
                      name={member}
                      avatarUrl={avatarUrl}
                      size="lg"
                      className="ring-2 ring-brand-primary/30 mt-0.5"
                    />

                    {isEditingThis ? (
                      <div className="flex-1 space-y-2 bg-surface-card p-2.5 rounded-lg border border-brand-primary/40 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-mono text-text-muted mb-0.5">Name *</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Full Name"
                              className="w-full bg-surface-page border border-surface-border focus:border-brand-primary rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-text-muted mb-0.5">Email Address</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="email@example.com"
                              className="w-full bg-surface-page border border-surface-border focus:border-brand-primary rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-text-muted mb-0.5">GitHub Username</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">@</span>
                              <input
                                type="text"
                                value={editGithub}
                                onChange={(e) => setEditGithub(e.target.value)}
                                placeholder="username"
                                className="w-full bg-surface-page border border-surface-border focus:border-brand-primary rounded pl-6 pr-2 py-1 text-xs text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        {editError && (
                          <p className="text-[11px] text-red-400 font-mono">{editError}</p>
                        )}
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingMember(null)}
                            className="px-2.5 py-1 text-xs rounded text-text-muted hover:text-text-primary hover:bg-surface-border transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(member)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-all active:scale-95 shadow-sm shadow-brand-primary/20"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Profile
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-text-primary truncate">
                            {member}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(member)}
                            title="Edit profile (Name, Email, GitHub)"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:text-brand-primary/80 bg-brand-primary/10 hover:bg-brand-primary/20 px-1.5 py-0.5 rounded transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit Profile</span>
                          </button>
                        </div>

                        {/* Stored Profile Fields: Email & GitHub (PRD §1.5) */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted flex-wrap">
                          {profile.email && (
                            <a
                              href={`mailto:${profile.email}`}
                              className="inline-flex items-center gap-1 hover:text-brand-accent transition-colors truncate max-w-[200px]"
                              title={`Email: ${profile.email}`}
                            >
                              <svg className="w-3.5 h-3.5 text-brand-accent/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">{profile.email}</span>
                            </a>
                          )}
                          {profile.github && (
                            <a
                              href={`https://github.com/${profile.github}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:text-text-primary transition-colors font-mono text-[11px] bg-surface-card px-1.5 py-0.5 rounded border border-surface-border/60"
                              title={`GitHub: @${profile.github}`}
                            >
                              <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                              <span>@{profile.github}</span>
                            </a>
                          )}
                          <span className="text-[11px] text-text-muted font-mono">
                            {assignedCount} {assignedCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remove Button with Confirm */}
                  <div>
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onRemoveTeammate(member);
                            setConfirmDeleteMember(null);
                          }}
                          className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-medium transition-colors"
                          title="Confirm removal"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMember(null)}
                          className="px-1.5 py-1 rounded text-text-muted hover:text-text-primary text-[11px] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMember(member)}
                        disabled={team.length <= 1}
                        title={team.length <= 1 ? 'Cannot remove the only teammate' : `Remove ${member}`}
                        className={`p-1.5 rounded-lg text-text-muted transition-colors ${
                          team.length <= 1
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:text-red-400 hover:bg-red-500/10'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Presets + Upload + Reset */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-text-muted">Presets:</span>
                    <div className="flex items-center gap-1">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onUpdateAvatar(member, preset.url)}
                          title={`Use ${preset.name} preset`}
                          className="h-5 w-5 rounded-full overflow-hidden hover:scale-110 ring-1 ring-white/10 hover:ring-brand-accent transition-all"
                        >
                          <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Upload file button */}
                    <label
                      htmlFor={inputId}
                      className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-primary/15 hover:bg-brand-primary/25 border border-brand-primary/30 text-[11px] font-medium text-brand-primary transition-all active:scale-95"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(member, file);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Reset button */}
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateAvatar(member, null)}
                        title="Reset to default initial"
                        className="px-2 py-1 rounded-md text-[11px] text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-surface-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailsModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onHandoff,
  onCopyPrompt,
  task,
  teamAvatars,
  onOpenTeamModal,
  team = TEAM,
  teamProfiles = {},
}) {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const typeConfig = getTypeConfig(task.type);
  const dueStatus = getDueStatus(task.dueDate, task.status);
  const stage = STAGES.find((s) => s.id === task.status);

  const stageAccents = {
    'todo': 'bg-brand-accent',
    'in-progress': 'bg-due-warning',
    'review': 'bg-brand-primary',
    'done': 'bg-type-feature',
  }

  const accentDot = stageAccents[task.status] || 'bg-slate-400';

  const handleDelete = () => {
    if (window.confirm('Delete Task? This cannot be undone.')) {
      onDelete(task.id);
    }
  }

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
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider font-semibold ${typeConfig.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dotClass}`} />
              {typeConfig.label}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-lg bg-surface-page border border-surface-border/70 text-xs">
            {/* Status */}
            <div className="min-w-0">
              <span className="block font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Status
              </span>
              <div className="flex items-center gap-1.5 font-medium text-text-primary">
                <span className={`h-2 w-2 rounded-full ${accentDot} shrink-0`} />
                <span className="truncate">{stage?.label || task.status}</span>
              </div>
            </div>

            {/* Assignee with Hand off selector */}
            <div className="min-w-0">
              <span className="block font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Assignee
              </span>
              <div className="flex items-center gap-1.5 min-w-0 w-full">
                <Avatar
                  name={task.assignee}
                  avatarUrl={teamAvatars?.[task.assignee]}
                  size="sm"
                  onClick={task.assignee && onOpenTeamModal ? onOpenTeamModal : undefined}
                />
                <div className="relative min-w-0 flex-1">
                  <select
                    value={task.assignee || ''}
                    onChange={(e) => onHandoff(task.id, e.target.value, task.assignee)}
                    aria-label="Hand off to..."
                    className="w-full truncate appearance-none bg-surface-card hover:bg-surface-border/50 border border-surface-border rounded px-2 py-0.5 pr-5 text-xs font-medium text-text-primary cursor-pointer transition-colors focus:outline-none focus:border-brand-primary"
                  >
                    <option value="" disabled={Boolean(task.assignee)}>
                      {task.assignee ? task.assignee : 'Hand off to...'}
                    </option>
                    {task.assignee && <option value="">Unassign</option>}
                    {(team || TEAM).map((member) => (
                      <option key={member} value={member}>
                        {member === task.assignee ? `${member} (current)` : `Hand off to ${member}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted opacity-70">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              {task.assignee && teamProfiles?.[task.assignee] && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted flex-wrap">
                  {teamProfiles[task.assignee].email && (
                    <a
                      href={`mailto:${teamProfiles[task.assignee].email}`}
                      className="hover:text-brand-accent transition-colors truncate max-w-[170px]"
                      title={`Email: ${teamProfiles[task.assignee].email}`}
                    >
                      ✉️ {teamProfiles[task.assignee].email}
                    </a>
                  )}
                  {teamProfiles[task.assignee].github && (
                    <a
                      href={`https://github.com/${teamProfiles[task.assignee].github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-primary transition-colors font-mono"
                      title={`GitHub: @${teamProfiles[task.assignee].github}`}
                    >
                      @{teamProfiles[task.assignee].github}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="min-w-0">
              <span className="block font-mono text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Due Date
              </span>
              {task.dueDate ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border shrink-0 ${dueStatus.badgeClass}`}
                  >
                    <svg className="h-3 w-3 opacity-80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due {task.dueDate}
                  </span>
                  {dueStatus.label && (
                    <span className="text-[11px] font-mono text-text-muted whitespace-nowrap">
                      ({dueStatus.label})
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-mono text-xs text-text-muted">No deadline</span>
              )}
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
              <div className="flex items-center gap-2">
                {task.contextTool && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-primary/15 border border-brand-primary/30 text-brand-accent">
                    Tool: {task.contextTool}
                  </span>
                )}
                {(task.context || task.description) && (
                  <button
                    type="button"
                    onClick={() => onCopyPrompt(task)}
                    title="Copy as Prompt Context"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium text-brand-accent bg-brand-primary/10 border border-brand-primary/25 hover:bg-brand-primary/20 hover:border-brand-primary/50 active:scale-95 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Prompt
                  </button>
                )}
              </div>
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
            {(task.context || task.description) && (
              <button
                type="button"
                onClick={() => onCopyPrompt(task)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-accent bg-brand-primary/10 border border-brand-primary/25 hover:bg-brand-primary/20 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Prompt
              </button>
            )}
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
function TaskFormModal({ isOpen, onClose, onSave, onDelete, task, teamAvatars, team = TEAM }) {
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
    }
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
  }

  const handleDelete = () => {
    if (window.confirm('Delete Task? This cannot be undone.')) {
      onDelete(task.id);
    }
  }

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
                  Assignee
                </label>
                {formData.assignee && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Avatar
                      name={formData.assignee}
                      avatarUrl={teamAvatars?.[formData.assignee]}
                      size="xs"
                    />
                    <span className="text-[11px] font-mono">{formData.assignee}</span>
                  </div>
                )}
              </div>
              <select
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              >
                <option value="" className="bg-surface-card text-text-muted">Unassigned</option>
                {(team || TEAM).map((member) => (
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
 * Displays a single task card with assignee badge and inline "Hand off to..." dropdown.
 * Supports HTML5 Drag & Drop (Secret Sauce) between columns.
 * Clicking the card opens the view details modal; clicking the handoff dropdown does not.
 */
function TaskCard({ task, onTaskClick, onHandoff, onCopyPrompt, teamAvatars, onOpenTeamModal, team = TEAM }) {
  const [isDragging, setIsDragging] = useState(false);
  const typeConfig = getTypeConfig(task.type);
  const dueStatus = getDueStatus(task.dueDate, task.status);

  const handleDragStart = (e) => {
    // If dragging starts from select dropdown or button, cancel drag to allow normal click
    if (e.target.closest('select, button, a')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }

  const handleDragEnd = () => {
    setIsDragging(false);
  }

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onTaskClick(task)}
      className={`group relative rounded-lg border bg-surface-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-brand-primary ring-2 ring-brand-primary/30'
          : dueStatus.borderClass
      }`}
    >
      {/* Top row: Type badge, Due Date, and Drag affordance */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold ${typeConfig.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dotClass}`} />
            {typeConfig.label}
          </span>
          {/* Subtle drag handle affordance visible on hover */}
          <span
            className="opacity-0 group-hover:opacity-60 transition-opacity text-text-muted hover:text-text-primary"
            title="Drag to move between columns"
            aria-hidden="true"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="7" r="1.5" />
              <circle cx="15" cy="7" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="17" r="1.5" />
              <circle cx="15" cy="17" r="1.5" />
            </svg>
          </span>
        </div>

        {task.dueDate && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded border shrink-0 ${dueStatus.badgeClass}`}
            title={`Due date: ${task.dueDate}${dueStatus.label ? ` (${dueStatus.label})` : ''}`}
          >
            <svg
              className="h-3 w-3 opacity-80"
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
            <span>Due {task.dueDate}</span>
          </div>
        )}
      </div>

      {/* Task Name */}
      <h3 className="font-medium text-sm text-text-primary leading-snug group-hover:text-white transition-colors line-clamp-2">
        {task.title}
      </h3>

      {/* Card Footer: Assignee + Copy Prompt icon */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-surface-border/60 pt-2.5">
        {/* Assignee avatar badge + "Hand off to..." dropdown (Milestone 7 task-owner & Secret Sauce) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 min-w-0 flex-1"
          title={task.assignee ? `Assigned to ${task.assignee} — click photo to customize avatar` : 'Unassigned — click to hand off'}
        >
          <Avatar
            name={task.assignee}
            avatarUrl={teamAvatars?.[task.assignee]}
            size="sm"
            onClick={task.assignee && onOpenTeamModal ? onOpenTeamModal : undefined}
          />

          <div className="relative inline-flex items-center flex-1 min-w-0">
            <select
              value={task.assignee || ''}
              onChange={(e) => onHandoff(task.id, e.target.value, task.assignee)}
              aria-label="Hand off to..."
              className="w-full truncate appearance-none bg-surface-page/80 hover:bg-surface-page border border-surface-border/80 hover:border-brand-primary/60 rounded px-2 py-0.5 pr-5 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer transition-colors focus:outline-none focus:border-brand-primary"
            >
              <option value="" disabled={Boolean(task.assignee)}>
                {task.assignee ? task.assignee : 'Hand off to...'}
              </option>
              {task.assignee && <option value="">Unassign</option>}
              {(team || TEAM).map((member) => (
                <option key={member} value={member}>
                  {member === task.assignee ? `${member} (current)` : `Hand off to ${member}`}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted opacity-70">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Copy Prompt button (Milestone 10 copy-prompt) */}
        {(task.context || task.description) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCopyPrompt(task); }}
            title="Copy as Prompt Context"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted hover:text-brand-accent hover:bg-brand-primary/15 border border-transparent hover:border-brand-primary/25 active:scale-95 transition-all"
            aria-label="Copy prompt context"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * KanbanColumn Component
 * Renders one of the four columns with column header and list of cards.
 * Supports HTML5 Drag & Drop with animated drop-zone highlighting.
 */
function KanbanColumn({
  stage,
  tasks,
  onTaskClick,
  onHandoff,
  onCopyPrompt,
  onMoveTask,
  teamAvatars,
  onOpenTeamModal,
  team = TEAM,
  teamProfiles = {},
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const stageAccents = {
    'todo': 'bg-brand-accent',
    'in-progress': 'bg-due-warning',
    'review': 'bg-brand-primary',
    'done': 'bg-type-feature',
  }

  const accentDot = stageAccents[stage.id] || 'bg-slate-400';

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  }

  const handleDragLeave = (e) => {
    // Only turn off highlight if drag leaves the column container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onMoveTask) {
      onMoveTask(taskId, stage.id);
    }
  }

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl border p-3 sm:p-4 min-h-[500px] transition-all duration-200 ${
        isDragOver
          ? 'bg-brand-primary/10 border-brand-accent ring-2 ring-brand-accent/40 shadow-xl shadow-brand-accent/5'
          : 'bg-surface-card/30 border-surface-border/60'
      }`}
    >
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
            <TaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              onHandoff={onHandoff}
              onCopyPrompt={onCopyPrompt}
              teamAvatars={teamAvatars}
              onOpenTeamModal={onOpenTeamModal}
              team={team}
            />
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

/**
 * AnchorCard Component
 * Represents a single project deliverable (Presentation, Demo, Report, Documentation).
 * Features:
 * - Fixed slot label and contextual icon
 * - Visual status indicator: empty ring dot vs. vibrant filled dot (PRD §1.1)
 * - Single URL input field for storing deliverable link (PRD §1.1)
 * - Convenient open-in-new-tab and clear actions when link is present
 */
function AnchorCard({ anchor, onUpdateUrl }) {
  const hasLink = Boolean(anchor.url && anchor.url.trim().length > 0);

  // Helper to ensure external URLs open with http/https protocol
  const getHref = (url) => {
    if (!url) return '#';
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  const getAnchorIcon = (id) => {
    switch (id) {
      case 'presentation':
        // Slides / Presentation screen icon
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'demo':
        // Play / Demo icon
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'report':
        // Document / Bar chart report icon
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'documentation':
        // Book / Library docs icon
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          </svg>
        );
    }
  }

  return (
    <div
      className={`flex flex-col justify-between rounded-xl bg-surface-card border p-3 transition-all duration-150 ${
        hasLink
          ? 'border-brand-primary/40 shadow-sm shadow-brand-primary/5 hover:border-brand-primary/70'
          : 'border-surface-border hover:border-surface-border/90'
      }`}
    >
      {/* Top Header: Icon + Label + Status Indicator */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
              hasLink ? 'bg-brand-primary/20 text-brand-primary' : 'bg-surface-border text-text-muted'
            }`}
          >
            {getAnchorIcon(anchor.id)}
          </span>
          <span className="font-heading font-semibold text-xs text-text-primary truncate">
            {anchor.label}
          </span>
        </div>

        {/* Status Indicator (empty vs. filled dot per PRD §1.1) */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          title={hasLink ? 'Deliverable link provided' : 'No link provided'}
        >
          {hasLink ? (
            <span
              data-testid={`anchor-dot-${anchor.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-type-feature font-medium"
            >
              <span className="h-2 w-2 rounded-full bg-type-feature shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              <span className="hidden sm:inline text-[10px]">Ready</span>
            </span>
          ) : (
            <span
              data-testid={`anchor-dot-${anchor.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted"
            >
              <span className="h-2 w-2 rounded-full border border-slate-500 bg-transparent" />
              <span className="hidden sm:inline text-[10px]">Empty</span>
            </span>
          )}
        </div>
      </div>

      {/* URL input field */}
      <div className="relative flex items-center">
        <input
          type="url"
          id={`anchor-input-${anchor.id}`}
          placeholder="https://..."
          value={anchor.url || ''}
          onChange={(e) => onUpdateUrl(anchor.id, e.target.value)}
          aria-label={`${anchor.label} deliverable URL`}
          className="w-full bg-surface-page/90 hover:bg-surface-page border border-surface-border rounded-lg pl-2.5 pr-14 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 font-mono transition-colors focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/40"
        />

        {/* Action buttons inside the input: Open link & Clear */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {hasLink && (
            <>
              <button
                type="button"
                onClick={() => onUpdateUrl(anchor.id, '')}
                title="Clear URL"
                aria-label={`Clear ${anchor.label} URL`}
                className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <a
                href={getHref(anchor.url)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${anchor.label} link in new tab`}
                aria-label={`Open ${anchor.label} link in new tab`}
                className="text-brand-accent hover:text-cyan-300 p-0.5 rounded hover:bg-brand-accent/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DeliverableAnchorBoard Component
 * Pinned above the Kanban columns.
 * Displays 4 deliverable cards: Presentation, Demo, Report, Documentation.
 * Provides high-level progress count (e.g. "X / 4 ready") and persists URLs via localStorage.
 */
function DeliverableAnchorBoard({ anchors, onUpdateAnchor }) {
  const completedCount = anchors.filter((a) => Boolean(a.url && a.url.trim().length > 0)).length;

  return (
    <section
      aria-label="Deliverables Anchor Board"
      className="sticky top-2 z-20 mb-8 rounded-2xl bg-surface-page/95 backdrop-blur-md border border-surface-border/80 p-3.5 sm:p-4 shadow-xl shadow-black/40"
    >
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-surface-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-primary/20 text-brand-primary text-xs">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary font-heading">
            Deliverables Anchor Board
          </h2>
          <span className="hidden sm:inline-block text-[11px] text-text-muted">
            Pinned Deliverables
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium text-text-muted">
            <span
              className={
                completedCount === 4
                  ? 'text-type-feature font-bold'
                  : completedCount > 0
                  ? 'text-brand-accent font-bold'
                  : 'text-text-muted'
              }
            >
              {completedCount}
            </span>
            <span className="text-text-muted/60"> / 4 ready</span>
          </span>
          {completedCount === 4 && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-type-feature/15 border border-type-feature/30 text-[10px] font-mono text-type-feature font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-type-feature" />
              All Complete
            </span>
          )}
        </div>
      </div>

      {/* 4 Deliverable Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {anchors.map((anchor) => (
          <AnchorCard
            key={anchor.id}
            anchor={anchor}
            onUpdateUrl={onUpdateAnchor}
          />
        ))}
      </div>
    </section>
  );
}

export default function App() {
  // Milestone 4: Load tasks persisted to localStorage, seeded with initial mock tasks
  const [tasks, setTasks] = useLocalStorage(STORAGE_KEYS.tasks, seedTasks);

  // Milestone 11: Deliverable Anchor Board persisted to localStorage
  const [anchors, setAnchors] = useLocalStorage(STORAGE_KEYS.anchors, seedAnchors);

  // Secret Sauce: Teammate profile pictures / avatars persisted to localStorage
  const [teamAvatars, setTeamAvatars] = useLocalStorage(STORAGE_KEYS.teamAvatars, {});
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Secret Sauce: Custom team members list persisted to localStorage
  const [team, setTeam] = useLocalStorage(STORAGE_KEYS.team, TEAM);

  // PRD §1.5: Team Member Profiles persisted to localStorage
  const [teamProfiles, setTeamProfiles] = useLocalStorage(
    STORAGE_KEYS.teamProfiles,
    seedTeamProfiles
  );

  // Safe team list fallback
  const effectiveTeam = Array.isArray(team) && team.length > 0 ? team : TEAM;

  // Helper: Get or construct a teammate profile
  const getProfileForMember = (member) => {
    if (teamProfiles && teamProfiles[member]) {
      return teamProfiles[member];
    }
    if (seedTeamProfiles && seedTeamProfiles[member]) {
      return seedTeamProfiles[member];
    }
    return {
      name: member,
      email: `${member.toLowerCase().replace(/\s+/g, '.')}@vibecoding.dev`,
      github: member.toLowerCase().replace(/\s+/g, '-'),
    };
  };

  const effectiveTeamProfiles = effectiveTeam.reduce((acc, m) => {
    acc[m] = getProfileForMember(m);
    return acc;
  }, { ...(teamProfiles || seedTeamProfiles) });

  // Handler: Add Teammate with profile info (Name, Email, GitHub)
  const handleAddTeammate = (name, email = '', github = '') => {
    const cleanName = name.trim();
    if (!cleanName) return;

    setTeam((prev) => {
      const current = Array.isArray(prev) && prev.length > 0 ? prev : TEAM;
      return [...current, cleanName];
    });

    const cleanEmail =
      email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@vibecoding.dev`;
    const cleanGithub =
      github.trim().replace(/^@/, '') || cleanName.toLowerCase().replace(/\s+/g, '-');

    setTeamProfiles((prev) => ({
      ...(prev || seedTeamProfiles),
      [cleanName]: {
        name: cleanName,
        email: cleanEmail,
        github: cleanGithub,
      },
    }));

    triggerToast(`Teammate "${cleanName}" added to the team!`);
  };

  // Handler: Update Teammate Profile (Name, Email, GitHub)
  const handleUpdateTeammateProfile = (oldName, updatedProfile) => {
    const newName = updatedProfile.name.trim();
    const newEmail = updatedProfile.email.trim();
    const newGithub = updatedProfile.github.trim().replace(/^@/, '');

    // 1. If name changed, rename across team, avatars, tasks
    if (newName && newName !== oldName) {
      handleRenameTeammate(oldName, newName);
    }

    const resolvedKey = newName || oldName;
    setTeamProfiles((prev) => {
      const next = { ...(prev || seedTeamProfiles) };
      if (newName && newName !== oldName) {
        delete next[oldName];
      }
      next[resolvedKey] = {
        name: resolvedKey,
        email: newEmail,
        github: newGithub,
      };
      return next;
    });

    triggerToast(`Updated profile for ${resolvedKey}`);
  };

  // Handler: Rename Teammate
  const handleRenameTeammate = (oldName, newName) => {
    // 1. Update team list
    setTeam((prev) => {
      const current = Array.isArray(prev) && prev.length > 0 ? prev : TEAM;
      return current.map((m) => (m === oldName ? newName : m));
    });

    // 2. Migrate avatar if present
    setTeamAvatars((prev) => {
      const next = { ...(prev || {}) };
      if (next[oldName]) {
        next[newName] = next[oldName];
        delete next[oldName];
      }
      return next;
    });

    // 3. Migrate profile if present
    setTeamProfiles((prev) => {
      const next = { ...(prev || seedTeamProfiles) };
      const existing = next[oldName] || getProfileForMember(oldName);
      delete next[oldName];
      next[newName] = {
        ...existing,
        name: newName,
      };
      return next;
    });

    // 4. Update any tasks assigned to oldName
    setTasks((prev) =>
      prev.map((t) => (t.assignee === oldName ? { ...t, assignee: newName } : t))
    );

    // 5. Update viewingTask if open
    setViewingTask((prev) =>
      prev && prev.assignee === oldName ? { ...prev, assignee: newName } : prev
    );

    triggerToast(`Renamed "${oldName}" to "${newName}"`);
  };

  // Handler: Remove Teammate
  const handleRemoveTeammate = (name) => {
    // 1. Update team list
    setTeam((prev) => {
      const current = Array.isArray(prev) && prev.length > 0 ? prev : TEAM;
      return current.filter((m) => m !== name);
    });

    // 2. Remove avatar
    setTeamAvatars((prev) => {
      const next = { ...(prev || {}) };
      delete next[name];
      return next;
    });

    // 3. Remove profile
    setTeamProfiles((prev) => {
      const next = { ...(prev || seedTeamProfiles) };
      delete next[name];
      return next;
    });

    // 4. Unassign tasks currently assigned to this teammate
    setTasks((prev) =>
      prev.map((t) => (t.assignee === name ? { ...t, assignee: null } : t))
    );

    // 5. Update viewingTask if open
    setViewingTask((prev) =>
      prev && prev.assignee === name ? { ...prev, assignee: null } : prev
    );

    triggerToast(`Removed "${name}" from team`);
  };

  // View details modal state (separate modal to view task without accidental edits)
  const [viewingTask, setViewingTask] = useState(null);

  // Form modal state (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Toast notification state (Milestone 7 handoff toast, etc.)
  const [toast, setToast] = useState(null);

  const triggerToast = (message) => {
    setToast({ id: Date.now(), message });
  }

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Prototype Authentication state (PRD §1.1)
  const [auth, setAuth] = useLocalStorage(STORAGE_KEYS.auth, {
    isLoggedIn: false,
    user: 'Teammate A',
  });

  const handleLogin = (userData) => {
    const resolvedName = userData?.username || 'Teammate A';
    setAuth({
      isLoggedIn: true,
      user: resolvedName,
      email: userData?.email || '',
    });
    triggerToast(`Welcome back, ${resolvedName}!`);
  }

  const handleLogout = () => {
    setAuth((prev) => ({
      ...(prev || {}),
      isLoggedIn: false,
    }));
    triggerToast('Logged out of workspace');
  }

  // Handler for updating an anchor URL
  const handleUpdateAnchor = (id, newUrl) => {
    setAnchors((prev) => {
      const list = Array.isArray(prev) && prev.length > 0 ? prev : seedAnchors;
      return list.map((a) => (a.id === id ? { ...a, url: newUrl } : a));
    });
  }

  // Safe fallback ensuring all 4 seed deliverables are present
  const effectiveAnchors = seedAnchors.map((seed) => {
    const found = Array.isArray(anchors) ? anchors.find((a) => a.id === seed.id) : null;
    return found || seed;
  });

  // Handler for updating / clearing a teammate's avatar
  const handleUpdateAvatar = (member, avatarUrl) => {
    setTeamAvatars((prev) => {
      const next = { ...(prev || {}) };
      if (avatarUrl) {
        next[member] = avatarUrl;
      } else {
        delete next[member];
      }
      return next;
    });
  }

  const handleOpenCreateModal = () => {
    setViewingTask(null);
    setEditingTask(null);
    setIsFormOpen(true);
  }

  const handleOpenViewModal = (task) => {
    setViewingTask(task);
  }

  const handleStartEditFromView = (task) => {
    setViewingTask(null);
    setEditingTask(task);
    setIsFormOpen(true);
  }

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  }

  const handleCloseViewModal = () => {
    setViewingTask(null);
  }

  /**
   * Handle task hand-off to a new assignee.
   * Updates task in state/localStorage and triggers hand-off alert per DESIGN.md §5.
   */
  const handleHandoff = (taskId, newAssignee, previousAssignee) => {
    if (newAssignee === (previousAssignee || '')) return;

    const resolvedAssignee = newAssignee || null;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: resolvedAssignee } : t))
    );

    // Keep viewingTask in sync if the view modal is currently open
    setViewingTask((prev) =>
      prev && prev.id === taskId ? { ...prev, assignee: resolvedAssignee } : prev
    );

    // Handoff toast microcopy from DESIGN.md §5
    if (resolvedAssignee) {
      triggerToast(`${resolvedAssignee} has received the task! Their problem now...`);
    } else {
      triggerToast('Task unassigned.');
    }
  }

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      const prevAssignee = editingTask.assignee;
      const nextAssignee = taskData.assignee;

      // Check if assignee was changed during edit
      if (nextAssignee && nextAssignee !== prevAssignee) {
        triggerToast(`${nextAssignee} has received the task! Their problem now...`);
      } else if (!nextAssignee && prevAssignee) {
        triggerToast('Task unassigned.');
      }

      // Edit existing task
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== editingTask.id) return t;
          const contextChanged = t.context !== taskData.context;
          return {
            ...t,
            ...taskData,
            contextUpdatedAt: contextChanged ? new Date().toISOString() : t.contextUpdatedAt,
          }
        })
      );
    } else {
      // Add new task
      const newTask = {
        id: `t-${Date.now().toString(36)}`,
        ...taskData,
        createdDate: new Date().toISOString().slice(0, 10),
        contextUpdatedAt: taskData.context ? new Date().toISOString() : null,
      }
      setTasks((prev) => [...prev, newTask]);
      if (taskData.assignee) {
        triggerToast(`${taskData.assignee} has received the task! Their problem now...`);
      }
    }
    handleCloseFormModal();
  }

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    handleCloseFormModal();
    handleCloseViewModal();
  }

  /**
   * Secret Sauce: Move a task to a different Kanban stage via Drag & Drop.
   * If the stage changed, update state and localStorage automatically.
   */
  const handleMoveTask = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId && t.status !== newStatus ? { ...t, status: newStatus } : t))
    );
  }

  /**
   * Milestone 10 copy-prompt: serialise task to Markdown and write to clipboard.
   * Toast microcopy: "Prompt Copied" (DESIGN.md §5)
   */
  const handleCopyPrompt = async (task) => {
    const markdown = buildPromptMarkdown(task);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = markdown;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    triggerToast('Prompt Copied');
  }

  // If not logged in, show the prototype Login Page
  if (!auth?.isLoggedIn) {
    return (
      <>
        <LoginPage onLogin={handleLogin} initialUsername={auth?.user || ''} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

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

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* User Profile Badge & Logout (Prototype Auth) */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs text-text-muted shadow-sm">
            <span className="h-2 w-2 rounded-full bg-type-feature animate-pulse" title="Signed In" />
            <span className="text-text-primary font-medium truncate max-w-[120px]" title={auth?.user || 'User'}>
              {auth?.user || 'User'}
            </span>
            <span className="text-surface-border">|</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-text-muted hover:text-due-overdue transition-colors font-medium active:scale-95"
              title="Log out back to login screen"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>

          {/* Teammate Profile Pictures & Management (Secret Sauce) */}
          <button
            type="button"
            onClick={() => setIsTeamModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card hover:bg-surface-border/60 border border-surface-border text-xs text-text-primary transition-all duration-150 active:scale-95 shadow-sm group"
            title="Manage team members and profile pictures"
          >
            <div className="flex -space-x-1.5 overflow-hidden">
              {effectiveTeam.map((member) => (
                <Avatar
                  key={member}
                  name={member}
                  avatarUrl={teamAvatars[member]}
                  size="xs"
                  className="ring-2 ring-surface-card"
                />
              ))}
            </div>
            <span className="font-medium text-text-muted group-hover:text-text-primary">
              Team ({effectiveTeam.length})
            </span>
          </button>

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

      {/* Deliverable Anchor Board pinned above the Kanban Columns (Milestone 11) */}
      <DeliverableAnchorBoard
        anchors={effectiveAnchors}
        onUpdateAnchor={handleUpdateAnchor}
      />

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
              onHandoff={handleHandoff}
              onCopyPrompt={handleCopyPrompt}
              onMoveTask={handleMoveTask}
              teamAvatars={teamAvatars}
              onOpenTeamModal={() => setIsTeamModalOpen(true)}
              team={effectiveTeam}
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
        onHandoff={handleHandoff}
        onCopyPrompt={handleCopyPrompt}
        task={viewingTask}
        teamAvatars={teamAvatars}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        team={effectiveTeam}
        teamProfiles={effectiveTeamProfiles}
      />

      {/* Add / Edit Task Form Modal */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={editingTask}
        teamAvatars={teamAvatars}
        team={effectiveTeam}
      />

      {/* Team Avatars & Management Modal (Secret Sauce) */}
      <TeamAvatarsModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        team={effectiveTeam}
        teamAvatars={teamAvatars}
        teamProfiles={effectiveTeamProfiles}
        onUpdateAvatar={handleUpdateAvatar}
        onAddTeammate={handleAddTeammate}
        onUpdateTeammateProfile={handleUpdateTeammateProfile}
        onRenameTeammate={handleRenameTeammate}
        onRemoveTeammate={handleRemoveTeammate}
        tasks={tasks}
      />

      {/* Toast Notification (Handoff alert, etc.) */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
