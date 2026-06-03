# Notion-style Task App Design

## Goal

Build a private GitHub-backed task management web app with a Notion-like database experience. Tasks should be human-readable for future AI workflows, while still supporting fast list rendering and collaborative use.

## Storage Model

The app stores task data in a private GitHub repository under a configurable base path.

```text
tasks/
  index.json
  task_20260603_abcd1234.md
  task_20260603_efgh5678.md
```

`index.json` is the list cache used by the UI.

```json
{
  "version": 1,
  "updatedAt": "2026-06-03T00:00:00.000Z",
  "tasks": []
}
```

Each task also has a Markdown file with frontmatter. Markdown is the AI-friendly source that can later be summarized, classified, embedded, or converted into notes.

```markdown
---
id: task_20260603_abcd1234
title: Design GitHub storage
status: doing
priority: high
dueDate: 2026-06-10
tags:
  - app
  - github
assignees:
  - uenoyuuta
createdAt: 2026-06-03T00:00:00.000Z
updatedAt: 2026-06-03T00:00:00.000Z
---

Task details, meeting notes, AI context, and decisions live here.
```

## Collaboration

GitHub is the collaboration backend.

- Every change creates a commit.
- The app reads the current file SHA before writing.
- If a SHA mismatch happens, the API returns a conflict and the UI can ask the user to reload or merge.
- `updatedBy` and `assignees` are part of the task metadata.
- GitHub history acts as the audit log for edits.

This is enough for an MVP and can later evolve into GitHub OAuth or a GitHub App.

## Environment

```env
GITHUB_TOKEN=ghp_xxx
GITHUB_OWNER=your-user-or-org
GITHUB_REPO=private-task-repo
GITHUB_BRANCH=main
GITHUB_TASKS_PATH=tasks
```

The first version uses a Personal Access Token stored in `.env.local`.

## MVP Screens

- Table view: dense task database with filters and inline scanning.
- Board view: tasks grouped by status.
- Task detail panel: title, status, priority, due date, tags, assignees, and Markdown notes.
- Sync button: manually pull from GitHub.

## Future AI Features

- Generate summaries from Markdown task notes.
- Extract action items from meeting notes into tasks.
- Auto-tag and prioritize tasks.
- Detect stale tasks.
- Generate weekly reports from task Markdown files and GitHub history.
