# design-system-enforcement

Use when implementing or reviewing UI to keep visual consistency across pages and components.

## Use this skill when

- A new page or component is being added.
- Existing UI looks inconsistent in spacing, typography, colors, or button styles.
- Multiple contributors are touching the same feature area.

## Goals

- Enforce token-first styling.
- Prevent one-off visual exceptions.
- Keep interaction patterns consistent.

## Checklist

1. Use existing brand utilities (`bg-navy`, `bg-navy-dark`, `text-navy`) before introducing raw color values.
2. Use consistent heading hierarchy and font usage (`font-serif` for section headings where applicable).
3. Reuse established form field class patterns and button states.
4. Keep spacing scale consistent at section, card, and control levels.
5. Avoid introducing a new style variant unless it is used in at least two places.
6. Document any new token/utility decisions in code comments or plan docs.

## Output format

- List all style decisions changed.
- Identify reused patterns and any intentional exceptions.
- Provide quick before/after rationale.

## Anti-patterns

- Hardcoded one-off styles for single screens.
- Mixing unrelated visual motifs in adjacent sections.
- Introducing new component variants without a second use case.