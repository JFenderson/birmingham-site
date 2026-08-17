# role-based-ux-maps

Use when a feature has role-specific visibility, actions, or restrictions.

## Use this skill when

- Different roles can view or perform different actions.
- A flow depends on permissions from RBAC checks.
- Product needs a clear role matrix for QA and design.

## Goals

- Make permissions obvious in the UI.
- Prevent exposing actions users cannot complete.
- Give QA a concrete matrix to validate.

## Checklist

1. List all roles involved in the feature.
2. Define per-role visibility for each screen section.
3. Define per-role action availability (enabled/hidden/blocked).
4. Ensure blocked actions provide explanatory messaging.
5. Align UI rules with server-side authorization behavior.
6. Create a compact role-action matrix for testing.

## Output format

- Table or matrix by role and action.
- Notes for hidden vs disabled behavior choices.
- Explicit mismatch risks between UI and backend permissions.

## Anti-patterns

- Showing actions that always fail server-side.
- Role checks only on the client.
- Ambiguous permission error copy.