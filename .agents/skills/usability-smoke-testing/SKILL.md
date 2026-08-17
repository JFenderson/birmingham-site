# usability-smoke-testing

Use after implementation to run quick scenario-based checks for UX regressions.

## Use this skill when

- A feature is ready for internal QA.
- Multiple UI states were added (success, error, empty, pending).
- You need a fast confidence pass before release.

## Goals

- Validate end-to-end user tasks quickly.
- Catch obvious confusion points and dead ends.
- Provide clear go/no-go guidance.

## Checklist

1. Define 3 to 5 critical user scenarios.
2. Execute each scenario as a new/returning user where relevant.
3. Record where users hesitate, backtrack, or fail.
4. Verify each failure path has recovery guidance.
5. Verify completion states are explicit and accurate.
6. Log top usability issues by severity.

## Output format

- Scenario list with pass/fail.
- Findings ranked by severity and frequency.
- Release recommendation: ship, ship with caveats, or hold.

## Anti-patterns

- Only testing happy paths.
- Treating non-blocking confusion as acceptable by default.
- Shipping without checking error and edge states.