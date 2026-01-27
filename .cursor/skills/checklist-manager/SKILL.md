---
name: checklist-manager
description: "Comprehensive task management with multiple checklists for medium-to-large projects (10+ tasks) with sequential dependencies. Use when: (1) User explicitly requests checklist creation, listing, or management, (2) Claude detects a complex multi-step project requiring structured tracking, (3) Working on projects involving refactoring, feature development, migrations, or multi-file changes, (4) User asks to update or review progress on ongoing tasks, (5) Managing task dependencies and sequential workflows, (6) User wants to archive completed work or switch between multiple active tasks."
---

# Checklist Manager

## Overview

Manage multiple medium-to-large projects (10+ tasks each) with sequential dependencies using structured checklists. Checklists are stored in `docs/checklists/active/` with unique filenames, and completed work is archived to `docs/checklists/archive/`. This skill provides workflows for creating, listing, switching, planning, tracking, updating, and archiving task progress systematically.

**Directory Structure:**
```
docs/checklists/
├── active/
│   ├── 2025-01-07-demo-data-update.md
│   └── 2025-01-08-oauth-migration.md
└── archive/
    └── 2024-12-20-ui-refactoring.md
```

**Naming Convention:** `YYYY-MM-DD-[task-name].md`

## Workflow Decision Tree

Use this decision tree to determine which workflow to follow:

```
User request
├─ "Create a checklist" / Starting new project
│  └─> Go to: Creating a New Checklist
│
├─ "List checklists" / "What am I working on?"
│  └─> Go to: Listing Active Checklists
│
├─ "Switch to [task]" / Change active task
│  └─> Go to: Switching Between Checklists
│
├─ "What's next?" / "Plan my work"
│  └─> Go to: Planning Short-Term Work
│
├─ Task completed / Progress made
│  └─> Go to: Updating Checklist Progress
│
├─ "Is the project done?" / Review status
│  └─> Go to: Reviewing Project Status
│
└─ "Archive [task]" / Work completed
   └─> Go to: Archiving Completed Work
```

## Creating a New Checklist

**When to use:** User explicitly requests checklist creation, or Claude detects a complex project requiring structured tracking.

**Process:**

1. **Understand project scope**
   - Identify all files, components, and systems to be modified
   - Clarify dependencies between tasks
   - Estimate total task count (should be 10+)
   - Determine a concise task name (e.g., "oauth-migration", "demo-data-update")

2. **Generate filename**
   - Format: `YYYY-MM-DD-[task-name].md`
   - Use current date (2025-01-07)
   - Task name: lowercase, hyphen-separated, descriptive
   - Example: `2025-01-07-oauth-migration.md`

3. **Create directory structure if needed**
   ```bash
   # Create directories if they don't exist
   mkdir -p docs/checklists/active
   mkdir -p docs/checklists/archive
   ```

4. **Structure the checklist**
   - Use the template from `assets/checklist-template.md`
   - Organize tasks by file, component, or logical grouping
   - Each section should include:
     - **File/Component name**: Clear identifier
     - **Task items**: Specific, actionable items with `- [ ]` checkboxes
     - **Verification items**: How to confirm task completion

5. **Define dependencies**
   - Order sections by dependency (prerequisites first)
   - Add warnings/notes for critical dependencies
   - Mark optional vs. required tasks clearly

6. **Add completion criteria**
   - Define what "done" means
   - Include integration tests
   - Specify acceptance criteria

7. **Save checklist**
   - Save to `docs/checklists/active/YYYY-MM-DD-[task-name].md`
   - Confirm to user with filename and location

**Example:**
```
✅ Created checklist: docs/checklists/active/2025-01-07-oauth-migration.md

This checklist tracks the OAuth 2.0 migration project with 15 tasks across 5 components.
```

**See also:** `references/checklist-examples.md` for project-specific examples

## Listing Active Checklists

**When to use:** User asks "what am I working on?", "list checklists", or needs to see all active tasks.

**Process:**

1. **List all active checklists**
   ```bash
   # Use Glob to find all active checklists
   Glob docs/checklists/active/*.md
   ```

2. **Read each checklist header**
   - Read first 20 lines of each file to get:
     - Title (# [Project Name])
     - 作業概要 (work summary)
     - Quick progress estimate by counting checkboxes

3. **Display formatted list**
   ```
   📋 Active Checklists (2):

   1. 2025-01-07-demo-data-update.md
      Title: Demo Data Update
      Summary: Update demo data from SD/MM to AP/AR/GL
      Progress: ~80% (48/60 tasks)

   2. 2025-01-08-oauth-migration.md
      Title: OAuth 2.0 Migration
      Summary: Replace basic auth with OAuth
      Progress: ~20% (3/15 tasks)

   Type the filename or number to switch to a checklist.
   ```

## Switching Between Checklists

**When to use:** User wants to work on a different active task.

**Process:**

1. **Confirm which checklist to switch to**
   - If user specifies filename or number from list, use that
   - If unclear, show list and ask user to choose

2. **Read the target checklist**
   ```bash
   Read docs/checklists/active/[selected-file].md
   ```

3. **Display current status**
   - Show progress summary
   - Highlight next incomplete section
   - Ask if user wants to plan next work

**Example:**
```
🔄 Switched to: 2025-01-08-oauth-migration.md

📊 Progress: 3/15 tasks complete (20%)

Next up: Section 2 - Login Component (5 tasks remaining)

Ready to plan next work? (Yes/No)
```

## Planning Short-Term Work

**When to use:** Beginning a work session, or user asks "what's next?"

**Process:**

1. **Determine which checklist to use**
   - If only one active checklist exists, use it
   - If multiple exist, ask user which one to work on
   - If none exist, suggest creating one

2. **Read current checklist**
   ```bash
   # Read the selected active checklist
   Read docs/checklists/active/[filename].md
   ```

3. **Identify next tasks**
   - Find first incomplete section with unchecked `- [ ]` items
   - Check for dependency warnings
   - If previous section incomplete, warn user:
     ```
     ⚠️ Warning: Section [X] is not complete yet.
     Recommended to complete it first due to dependencies.
     Proceed anyway? (Yes/No)
     ```

4. **Create short-term plan**
   - Select 1-3 related tasks from the same section
   - Explain what will be done and why
   - Estimate scope (number of files, complexity)
   - Confirm with user before proceeding

**Example:**
```
📋 Working on: 2025-01-07-demo-data-update.md

Based on checklist, next up:

Section 2: Dashboard Page (app/dashboard/page.tsx)
   - [ ] Update review queue data (AP/AR/GL only)
   - [ ] Update domain distribution chart

This involves:
- Modifying 1 file (app/dashboard/page.tsx)
- Updating 2 data arrays
- Testing chart rendering

Ready to proceed?
```

## Updating Checklist Progress

**When to use:** After completing one or more tasks.

**Process:**

1. **Determine which checklist was being worked on**
   - Use context from recent work
   - If unclear, ask user which checklist to update

2. **Read current checklist**
   ```bash
   Read docs/checklists/active/[filename].md
   ```

3. **Identify completed tasks**
   - Review what was just accomplished
   - Map to specific checklist items
   - Include verification items if tested

4. **Update checkboxes**
   - Change `- [ ]` to `- [x]` for completed items
   - Update ALL completed items in this session
   - Add comments if needed (e.g., `- [x] Task 1 <!-- Updated: 2025-01-07 -->`)

5. **Save and confirm**
   ```bash
   Edit docs/checklists/active/[filename].md
   # Update checkboxes
   ```
   - Confirm update to user with summary:
     ```
     ✅ Checklist updated: 2025-01-07-demo-data-update.md
     - Completed: Task X, Task Y
     - Section progress: 4/7 items done
     - Overall progress: 50/60 tasks (83%)
     ```

6. **Check for completion and auto-archive**
   - After updating checkboxes, check if all items are complete
   - Count remaining incomplete items: `grep "^- \[ \]" [filename].md`
   - If **NO incomplete items remain** (all are `- [x]`):
     ```
     ✅ All tasks complete! Auto-archiving checklist...
     ```
     - Immediately proceed to archive workflow:
       ```bash
       mv docs/checklists/active/[filename].md docs/checklists/archive/[filename].md
       ```
     - Confirm archival:
       ```
       📦 Archived: [filename].md
       Location: docs/checklists/archive/[filename].md
       Final status: [N]/[N] tasks complete (100%)
       ```
     - If other active checklists exist, offer to switch to one
     - If no active checklists remain, congratulate user on completion

**Important:**
- Update immediately after task completion (not batched)
- Be precise - only mark items actually completed
- If task partially done, add note but keep unchecked
- **ALWAYS check for completion after updating** - auto-archive if all done

## Reviewing Project Status

**When to use:** User asks for status, or periodically during long projects.

**Process:**

1. **Determine which checklist to review**
   - If user specifies, use that
   - If unclear and multiple exist, show list and ask
   - If only one exists, use it

2. **Read current checklist**
   ```bash
   Read docs/checklists/active/[filename].md
   ```

3. **Calculate progress**
   - Count total `- [x]` vs `- [ ]` items
   - Report per-section progress
   - Identify remaining work

4. **Report status**
   ```
   📊 Project Status: 2025-01-07-demo-data-update.md

   Overall: 45/60 tasks complete (75%)

   Sections:
   ✅ 1. Business Page: 8/8 (100%)
   ✅ 2. Dashboard Page: 7/7 (100%)
   🔄 3. Tickets Page: 5/8 (63%)
   ⬜ 4. Ideas Page: 0/5 (0%)
   ⬜ 5. Settings Page: 0/3 (0%)

   Next up: Complete Section 3, then start Section 4
   ```

5. **Suggest next actions**
   - Recommend what to work on next
   - Highlight blockers or dependencies
   - Estimate remaining effort if possible

## Archiving Completed Work

**When to use:** All tasks in a checklist are complete, or user requests archiving.

**Process:**

1. **Verify completion**
   - Read the checklist to confirm all `- [ ]` items are `- [x]`
   - Check completion criteria section
   - If not fully complete, warn user:
     ```
     ⚠️ Warning: This checklist has 5 incomplete tasks.
     Archive anyway? (Yes/No)
     ```

2. **Move to archive**
   ```bash
   # Move file from active to archive
   mv docs/checklists/active/[filename].md docs/checklists/archive/[filename].md
   ```

3. **Confirm to user**
   ```
   ✅ Archived: 2025-01-07-demo-data-update.md

   Location: docs/checklists/archive/2025-01-07-demo-data-update.md
   Final status: 60/60 tasks complete (100%)

   Remaining active checklists: 1
   ```

4. **Suggest next steps**
   - If other active checklists exist, offer to switch to one
   - If no active checklists, ask if user wants to create a new one

## Handling Dependencies

**Warnings-only mode** (default):
- Check previous sections for incomplete items
- Issue warning but allow proceeding:
  ```
  ⚠️ Dependency Warning:
  Section 1 has incomplete items:
  - [ ] Task X
  - [ ] Task Y

  Recommended to complete these first.
  Continue with Section 2? (Yes/No)
  ```

**Flexible mode** (parallel work allowed):
- Only warn for critical dependencies
- Allow working on independent sections simultaneously

## File Naming Best Practices

**Good names:**
- `2025-01-07-oauth-migration.md` - Clear, specific
- `2025-01-08-react-hooks-refactor.md` - Descriptive
- `2025-01-10-postgres-migration.md` - Concise

**Avoid:**
- `2025-01-07-fix.md` - Too vague
- `2025-01-07-update-everything.md` - Not specific
- `2025-01-07-oauth_migration_project_v2.md` - Underscores, version numbers

## Resources

### assets/
- `checklist-template.md`: Basic template for new checklists

### references/
- `checklist-examples.md`: Example checklists for different project types (refactoring, feature development, migration, etc.)
