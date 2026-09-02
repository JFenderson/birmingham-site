import type { Metadata } from "next";
import { InitiativeTracker } from "@/components/public/initiative-tracker";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getInitiativeSnapshot } from "@/lib/initiatives/queries";
export const metadata: Metadata = {
  title: "Initiative Tracker",
  description: "Track Black Spending and daily steps with Birmingham Sigmas.",
};
export default async function InitiativesPage() {
  const { chapterId } = await getTenantContext();
  const month = new Date().toISOString().slice(0, 7);
  const snapshot = await getInitiativeSnapshot(chapterId, month);
  return (
    <main className="bg-[var(--public-surface-subtle)] py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-[var(--public-gutter)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--public-primary)]">
          Chapter initiatives · {month}
        </p>
        <h1 className="mt-3 text-4xl font-bold">Show up. Track the impact.</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Submit your Black Spending or daily steps proof. Entries are included
          automatically in the chapter totals.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm text-slate-500">Black Spending</p>
            <p className="mt-2 text-3xl font-bold">
              ${(snapshot.totals.blackSpendingCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm text-slate-500">Steps</p>
            <p className="mt-2 text-3xl font-bold">
              {snapshot.totals.steps.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {snapshot.rankings.map((ranking) => (
            <section
              key={ranking.initiative}
              className="rounded-2xl bg-white p-5"
            >
              <h2 className="font-bold">
                {ranking.initiative === "steps"
                  ? "Steps leaders"
                  : "Black Spending leaders"}
              </h2>
              <ol className="mt-3 space-y-2">
                {ranking.people.map((person, index) => (
                  <li
                    key={`${person.name}-${index}`}
                    className="flex justify-between"
                  >
                    <span>
                      {index + 1}. {person.name}
                    </span>
                    <span className="font-semibold">
                      {ranking.initiative === "steps"
                        ? person.score.toLocaleString()
                        : `$${(person.score / 100).toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <InitiativeTracker />
      </div>
    </main>
  );
}
