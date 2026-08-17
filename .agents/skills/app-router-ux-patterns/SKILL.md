# app-router-ux-patterns

Use when building user flows in Next.js App Router where server actions and async boundaries affect UX.

## Use this skill when

- A route reads async data in server components.
- A server action handles form submissions or mutations.
- A route needs robust loading, empty, and error states.

## Goals

- Make async behavior predictable to users.
- Align state transitions across pages.
- Avoid dead-end or confusing transitions.

## Checklist

1. Define route-level loading and empty states.
2. Define mutation pending, success, and failure states.
3. Ensure redirect outcomes are explicit and user-understandable.
4. Use optimistic behavior only when rollback is clear.
5. Revalidate or refresh routes so post-action data is accurate.
6. Keep server-action error messages concise and actionable.
7. Confirm role-gated flows redirect to useful destinations.

## Output format

- State map with: initial, loading, success, error, empty.
- Per-state UI behavior and copy rules.
- Post-submit navigation behavior.

## Anti-patterns

- Silent failures with no user feedback.
- Redirect loops after permission checks.
- Inconsistent button pending behavior across forms.