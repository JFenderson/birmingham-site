import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalStatusBadge, type PortalStatusBadgeProps } from "@/components/portal/portal-status-badge";

test("portal status badge maps each variant to an exposed semantic marker", () => {
  const variants = [
    { variant: "neutral", expected: "neutral" },
    { variant: "info", expected: "info" },
    { variant: "success", expected: "success" },
    { variant: "warning", expected: "warning" },
    { variant: "danger", expected: "danger" },
  ] as const;

  for (const { variant, expected } of variants) {
    const badge = PortalStatusBadge({
      variant,
      children: "Status",
    } satisfies PortalStatusBadgeProps);
    const markup = renderToStaticMarkup(badge);

    assert.match(markup, new RegExp(`data-variant="${expected}"`));
    assert.match(markup, /Status/);
  }
});

test("portal empty state renders its title as an accessible heading", () => {
  const markup = renderToStaticMarkup(
    createElement(PortalEmptyState, {
      title: "No chapter events yet",
      description: "Check back soon for the next brotherhood gathering.",
    }),
  );

  assert.match(markup, /<section[^>]*>/);
  assert.match(markup, /<h2[^>]*>No chapter events yet<\/h2>/);
  assert.match(markup, /Check back soon for the next brotherhood gathering\./);
});
