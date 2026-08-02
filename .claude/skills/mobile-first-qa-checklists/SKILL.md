# mobile-first-qa-checklists

Use when validating responsive behavior and touch usability of new or updated UI.

## Use this skill when

- Any page/layout change is shipped.
- New controls are added to navigation, forms, or cards.
- Breakpoint-specific styles were introduced.

## Goals

- Ensure usability at phone widths first.
- Catch overflow and touch issues early.
- Standardize visual QA across features.

## Checklist

1. Validate layout at 320px, 375px, 768px, and desktop.
2. Check no horizontal scrolling appears unintentionally.
3. Verify tappable controls meet minimum touch target size.
4. Verify nav behavior and menu close/open interactions.
5. Verify form labels and errors remain readable on small screens.
6. Confirm sticky/fixed elements do not overlap critical controls.
7. Validate key tasks can be completed one-handed.

## Output format

- Viewport-by-viewport findings.
- Blocking vs non-blocking issues.
- Recommended fix order by user impact.

## Anti-patterns

- Desktop-first QA only.
- Ignoring keyboard behavior on mobile browsers.
- Overreliance on screenshots without interaction checks.