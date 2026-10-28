# Product Requirement Document (PRD): Vibecoding Project Tracker

## 1. Functional Requirements

### 1.1 Kanban Board Core Features
* **Board Layout:** Display a four-column Kanban board with fixed column headers: **To Do**, **In Progress**, **Review**, and **Done**.
* **Task Visualization:** Render tasks as individual cards within their respective column based on status.
* **Pre-populated Mock Tasks:** Load 3 to 4 mock tasks on first launch so the board is not empty.
* **Deliverable Anchor Board:** Pinned banner at the top of the board displaying four deliverable cards: **Presentation**, **Demo**, **Report**, and **Documentation**.
  * Each anchor card includes a single URL input field to store relevant project links.
  * Displays a visual status indicator (e.g., empty vs. filled dot) indicating whether a link has been provided.
* **Login / Authentication** Basic authentication (login screen) allowing users to log into their team 
  * workspace to protect project board data from public internet exposure. Security not needed yet


### 1.2 Task Management & Modal (CRUD)
* **Create Task:** Global "+" button opens a modal allowing creation of new tasks.
* **Edit Task:** Clicking any card opens the modal pre-filled with the task's details.
* **Delete Task:** Dedicated button within the edit modal to permanently delete the task.
* **Status Updates:** Update task column via a status dropdown selector within the modal.
* **Fields Supported:** Title, Description, Type (Feature / Bug), Status, Due Date, Created Date, Context, AI Tool.

### 1.3 Visual Styling & Time Urgency
* **Task Type Styling:** Distinct visual representation (color accents and icons) for `feature` vs. `bug` tasks applied across cards and modals.
* **Time-Based Color Tints:** Visual indicator based on `dueDate` relative to current time:
  * **Calm:** More than 2 days out.
  * **Warning:** Less than 24 hours remaining.
  * **Alarm:** Past due date.
  * **Neutral:** Task status is marked as "Done" regardless of due date.

### 1.4 Vibecoding & Context Features
* **Task Context Field:** Textarea in the modal supporting Markdown input for prompt context, constraints, and progress updates.
* **AI Tool Tracking:** Dropdown selector to associate an AI tool (`Claude`, `ChatGPT`, `Cursor`, `Lovable`, `Replit`, `Other`) with the task context.
* **Context Timestamp:** Automatically updates and displays a `contextUpdatedAt` relative timestamp (e.g., "last updated 2 h ago").
* **Copy Context Button:** Action button available on task cards and inside the modal that copies a structured Markdown prompt block (Title, Description, and Context) directly to clipboard.
* **Feedback:** Toast notification confirming "Copied to clipboard!" when the action succeeds.

### 1.5 Team & User Profile Management
* **User Profile Fields:** Support storing basic team member profile information, specifically **Name**, **Email Address**, and **GitHub Username**.
* **Profile Editing:** Interface within the team management modal allowing users to edit names, email addresses, and GitHub usernames, as well as add new members with full profile details.
* **Prepopulated Profiles:** Default seed profiles configured for initial team members with sample contact and GitHub details.
* **Local Persistence:** Preserved in `localStorage` under `vibetracker.team_profiles`.

---

## 2. Non-Functional Requirements

* **Architecture & Stack:** 
  * Single-Page Web Application built using **React** (Vite scaffold).
  * UI styled with **Tailwind CSS** using utility classes.
* **Data Persistence:** Local browser persistence via `localStorage` with zero custom backend infrastructure required.
* **Deployment Target:** Hosted and deployed on **Vercel** with continuous deployment from GitHub.
* **Viewport Scope:** Designed and optimized for **desktop browsers** (Chrome recommended).
* **Performance:** Instant loading and card state rendering without blocking operations.


---

## 3. Data Requirements

### 3.1 Task Object Data Model

```ts
interface Task {
  id: string;                    // Unique Identifier
  title: string;                 // Task header
  description: string;           // Detailed description
  type: 'feature' | 'bug';       // Task type driving visual styling
  status: 'todo' | 'in-progress' | 'review' | 'done'; // Column location
  dueDate: string | null;        // Target date formatted as 'YYYY-MM-DD'
  createdDate: string;           // Creation date formatted as 'YYYY-MM-DD'
  
  // Context & Vibecoding details
  context: string;               // Markdown context block for AI prompt history
  contextTool: 'Claude' | 'ChatGPT' | 'Cursor' | 'Lovable' | 'Replit' | 'Other' | null;
  contextUpdatedAt: string | null; // ISO timestamp set automatically on update
}
```

### 3.2 Deliverable Anchor Data Model

```ts
interface Anchor {
  id: 'presentation' | 'demo' | 'report' | 'documentation'; // Fixed slot identifier
  label: string;                 // Display label for deliverable
  url: string | null;            // URL link pasted by user
}
```

### 3.3 Storage Schema
* **Key:** Maintained under standard `localStorage` key(s) (e.g., `vibecoding_tasks`, `vibecoding_anchors`).
* **Serialization:** Data converted and stored as JSON strings.