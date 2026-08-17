# form-ux-validation

Use when designing or implementing forms with validation, submission, and recovery states.

## Use this skill when

- New forms are created (upload, payment, join, profile, admin).
- Existing forms have confusing errors or abandonment.
- Server-side schema validation is introduced or changed.

## Goals

- Reduce user error and retries.
- Make failures recoverable without losing progress.
- Keep validation consistent across client and server.

## Checklist

1. Define required vs optional fields clearly.
2. Validate early where safe, always validate again server-side.
3. Show field-level errors near controls.
4. Provide form-level error summary for submission failures.
5. Keep submit disabled only when necessary and explain why.
6. Preserve user input after non-fatal errors.
7. Confirm pending state prevents duplicate submissions.
8. Confirm success state communicates what happened next.

## Output format

- Field schema-to-UI mapping.
- Error copy set (field and form level).
- Submission state diagram.

## Anti-patterns

- Generic "Something went wrong" with no guidance.
- Clearing all fields on failed submit.
- Client-only validation with no server validation mirror.