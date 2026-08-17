# SDD ledger — plan: docs/superpowers/plans/2026-08-17-public-birmingham-sigmas.md

## Pre-flight scan

| Task | Shared file/interface | Finding | Ruling |
|---|---|---|---|
| 1 | `globals.css`, public header/footer | Establishes tokens and shell used by later public tasks | Proceed; later tasks consume the shared styling only. |
| 2 | New public components | Produces reusable sections consumed by Task 3 | Proceed; props remain local typed interfaces. |
| 3 | Public homepage | Consumes Task 2 components and existing `getCurrentChapter()` | Proceed; preserve server component boundary. |
| 4 | Existing public routes | Consumes Task 1 shell and Task 2 patterns | Proceed; avoid portal route changes. |

| Task self-consistency | Finding | Ruling |
|---|---|---|
| 1 | Files and style-token deliverable agree | Proceed |
| 2 | Components and typed props agree | Proceed |
| 3 | Homepage composition and existing chapter source agree | Proceed |
| 4 | Route consistency and verification agree | Proceed |

## Rulings

- Ruling: Execute in the current workspace because Git worktree creation is blocked by repository permissions — preserve unrelated changes and do not reset or clean the worktree.
