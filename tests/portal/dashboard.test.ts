import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

function unwrapModuleExports(moduleValue: unknown) {
  if (!moduleValue || typeof moduleValue !== "object") {
    return {} as Record<string, unknown>;
  }

  const record = moduleValue as Record<string, unknown>;
  if ("buildDashboardSections" in record || "DashboardCard" in record) {
    return record;
  }

  const defaultValue = record.default;
  if (defaultValue && typeof defaultValue === "object") {
    const defaultRecord = defaultValue as Record<string, unknown>;
    if ("buildDashboardSections" in defaultRecord || "DashboardCard" in defaultRecord) {
      return defaultRecord;
    }
  }

  return record;
}

test("dashboard view model returns the four member dashboard sections", async () => {
  const dashboardPageModule = unwrapModuleExports(
    (await import("../../src/app/(portal)/dashboard/page.tsx")) as unknown,
  );
  const buildDashboardSections = dashboardPageModule.buildDashboardSections as
    | ((input: {
        userEmail: string;
        role: string;
        chapterId: string;
        events: Array<{
          id: string;
          title: string;
          starts_at: string;
          location_name: string | null;
        }>;
        documents: Array<{
          id: string;
          title: string;
          category: string;
          created_at: string;
        }>;
        transactions: Array<{
          id: string;
          type: string;
          amount_cents: number;
          status: string;
          description: string | null;
          created_at: string;
        }>;
        now?: Date;
      }) => Array<{
        title: string;
        href: string;
        summary: string;
        detail: string;
        badgeLabel: string;
      }>)
    | undefined;

  assert.equal(typeof buildDashboardSections, "function");

  const sections = buildDashboardSections!({
    userEmail: "brother@example.com",
    role: "Treasurer",
    chapterId: "chapter-123",
    events: [
      {
        id: "event-past",
        title: "Past Chapter Meeting",
        starts_at: "2026-08-01T14:00:00.000Z",
        location_name: "Chapter House",
      },
      {
        id: "event-1",
        title: "Brotherhood Breakfast",
        starts_at: "2026-08-29T14:00:00.000Z",
        location_name: "Chapter House",
      },
      {
        id: "event-2",
        title: "Community Cleanup",
        starts_at: "2026-09-05T15:30:00.000Z",
        location_name: null,
      },
    ],
    documents: [
      {
        id: "doc-1",
        title: "August Meeting Minutes",
        category: "minutes",
        created_at: "2026-08-10T18:30:00.000Z",
      },
      {
        id: "doc-2",
        title: "Chapter Bylaws",
        category: "bylaws",
        created_at: "2026-07-18T18:30:00.000Z",
      },
    ],
    transactions: [
      {
        id: "txn-1",
        type: "dues",
        amount_cents: 12500,
        status: "completed",
        description: "Fall dues",
        created_at: "2026-08-16T17:00:00.000Z",
      },
      {
        id: "txn-2",
        type: "donation",
        amount_cents: 2500,
        status: "pending",
        description: "Scholarship donation",
        created_at: "2026-08-11T17:00:00.000Z",
      },
    ],
    now: new Date("2026-08-18T12:00:00.000Z"),
  });

  assert.deepEqual(
    sections.map((section) => section.title),
    ["Events", "Vault", "Payments", "Account Status"],
  );
  assert.equal(sections[0]?.href, "/events");
  assert.match(sections[0]?.summary ?? "", /Brotherhood Breakfast/);
  assert.equal(sections[0]?.badgeLabel, "2 events");
  assert.match(sections[1]?.summary ?? "", /August Meeting Minutes/);
  assert.match(sections[2]?.summary ?? "", /\$125\.00/);
  assert.match(sections[3]?.summary ?? "", /Treasurer/);
  assert.match(sections[3]?.detail ?? "", /chapter-123/);
});

test("dashboard card renders a linked section with badge and summary copy", async () => {
  const dashboardCardModule = unwrapModuleExports(
    (await import("../../src/components/portal/dashboard-card.tsx")) as unknown,
  );
  const DashboardCard = dashboardCardModule.DashboardCard as
    | ((props: {
        title: string;
        href: string;
        summary: string;
        detail: string;
        badgeLabel: string;
        badgeVariant: "success" | "info" | "warning" | "neutral" | "danger";
      }) => React.ReactElement)
    | undefined;

  assert.equal(typeof DashboardCard, "function");

  const markup = renderToStaticMarkup(
    createElement(DashboardCard!, {
      title: "Payments",
      href: "/pay",
      summary: "Latest payment: $125.00",
      detail: "Completed Fall dues on Aug 16",
      badgeLabel: "Completed",
      badgeVariant: "success",
    }),
  );

  assert.match(markup, /<h2[^>]*>Payments<\/h2>/);
  assert.match(markup, /Latest payment: \$125\.00/);
  assert.match(markup, /Completed Fall dues on Aug 16/);
  assert.match(markup, /href="\/pay"/);
  assert.match(markup, /data-variant="success"/);
});
