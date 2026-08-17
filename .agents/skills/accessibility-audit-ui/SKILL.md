# accessibility-audit-ui

Use when validating an implemented UI for practical accessibility quality before merge.

## Use this skill when

- A page or flow is considered feature-complete.
- New interactive controls, dialogs, or forms were added.
- Navigation or role-restricted actions changed.

## Goals

- Meet WCAG AA-level practical standards.
- Catch keyboard and screen-reader blockers early.
- Ensure error and status states are perceivable.

## Checklist

1. Verify color contrast for text, buttons, and disabled states.
2. Confirm keyboard-only navigation for all focusable elements.
3. Confirm visible focus styles on links, buttons, inputs, and custom controls.
4. Ensure form inputs have labels and errors are associated clearly.
5. Ensure icon-only buttons have accessible names.
6. Check heading structure and landmark usage for navigation clarity.
7. Validate status messages for success, error, and pending states are obvious.
8. Check mobile zoom and readability at common viewport sizes.

## Output format

- Findings first, ordered by severity.
- Each finding includes location, impact, and fix recommendation.
- End with pass/fail summary and residual risk notes.

## Anti-patterns

- Auditing only colors and skipping keyboard flow.
- Relying on placeholder text as labels.
- Hiding critical state only by color changes.