# Vibecoding Project Tracker — Design

**Status:** Hackathon starter design doc · fill in the **`<TODO>`** sections before you tag `design-done`.

**Why this file exists.** This tracker is your tool. It should look like *your* tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Person B, during the same window the rest of the team is reviewing the PRD. By the time the team converges to start M4 (`data-model`), this file should be filled in and the colors should already be in `tailwind.config.js`.

---

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

Organised and clearheaded ready to take on your next task.

Two or three references that capture the vibe (links to dribbble shots, screenshots of apps you admire, Pinterest boards — anything visual):

Dark, modern, lightweight/responsive feel
- [(https://linear.app/)]
- [(https://www.raycast.com/)]
- [(https://vercel.com/)]

Anti-references — what we are explicitly **not** trying to look like:

Cluttered, blocky, old fashioned
- [(https://media.planview.com/wp-content/uploads/2018/09/KanbanBoard5-1024x576.jpg)]

## 2. Color palette

These are the colors the build milestones will reference. Once chosen, paste the hex values into `tailwind.config.js` so the rest of the team can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

### Brand

| Token | Hex | Where it shows up |
|---|---|---|
| `brand-primary` | #6366F1 | Header, "+" button, focus rings |
| `brand-accent` | #06B6D4 | Highlights, hover states, links |
| `surface-page` | #0D0E11 | Page background |
| `surface-card` | #16181D | Card background |
| `text-primary` | #F8FAFC | Body text |
| `text-muted` | #94A3B8 | Captions, dates, counts |

### Task type (M6 `tag-style`)

| Token | Hex | When used |
|---|---|---|
| `type-feature` | #10B981 | Cards tagged `feature` (accent stripe + icon) |
| `type-bug` | #EC4899 | Cards tagged `bug` (accent stripe + icon) |

### Due-date states (M8 `due-tint`)

| Token | Hex | When used |
|---|---|---|
| `due-safe` | #3B82F6 | More than 2 days out |
| `due-warning` | #F59E0B | Less than 24 hours |
| `due-overdue` | #EF4444 | Past due |
| `due-neutral` | #475569 | Done (overrides date) |

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Heading | Inter / System Sans-Serif (font-sans) | Provides highly legible, crisp and clear text for headers of any size |
| Body | System Sans-Serif (font-sans) | Simplistic, "to the point" font for, easy to read, larger bodies of text |
| Monospace (tags, badges, code) | JetBrains Mono / Fira Code / System Monospace (font-mono) | Gives the "developer tool" aesthetic |

Suggested sizes (override only if the design demands it):

- Page title: 24 px / semibold
- Section header: 16 px / semibold uppercase
- Card title: 14 px / medium
- Body: 14 px / regular
- Caption: 12 px / regular muted

## 4. Component principles

One short sentence per element. These set the tone for the build phase — Person A's modal and Person B's anchor board should both feel like they came from this doc.

- **Cards:** Clean dark charcoal surfaces with subtle 1px borders (border-surface-border) and a springy hover lift, reserving shadows purely for active focus or urgency states.
- **Buttons:** Crisp solid fills with generous horizontal padding, medium rounding (rounded-lg), and subtle scale-down feedback on click (active:scale-95).
- **Modal:** Centered overlay with smooth scale-and-fade entry, maximum width of md/lg, and a heavy backdrop blur (backdrop-blur-sm bg-black/60).
- **Empty states:** Minimalist dashed outline borders with muted monospace guidance text that feels encouraging.
- **Drag affordance (if used):** Begin with none, focusing on dropdown menus to move items. If there is enough time then smooth drag and drop with drop-zone highlighting for a modern feel.

## 5. Voice / microcopy

Three lines of microcopy that capture the tone of the product. Keep it short — these are the words a stressed user reads at 11pm.

| Where | Text |
|---|---|
| "+" button label | Add Task |
| Empty column placeholder | "No tasks here yet!" |
| Toast after "Copy as Prompt Context" | "Prompt Copied" |
| Confirm-delete message | "Delete Task? This cannot be undone." |
| Handoff toast (M7 `task-owner`) | "{Name} has received the task! Their problem now..." |

## 6. Logo / wordmark

The tracker probably doesn't need a logo, but it does need a name and a wordmark style.

- **Product name:** "Vibecoding Project Tracker 4"
- **Wordmark style:** Bold typography in font-heading using crisp white (text-text-primary) paired with an electric violet (text-brand-primary) accent dot.

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- A dark mode toggle. Pick one mode and ship it.
- Multiple themes. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) via Tailwind classes if you need any.

---

*DESIGN.md version: hackathon-starter v1*
