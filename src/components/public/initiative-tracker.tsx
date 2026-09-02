"use client";
import { useState } from "react";
import { submitInitiative } from "@/app/(public)/initiatives/actions";

export function InitiativeTracker() {
  const [initiative, setInitiative] = useState<"black_spending" | "steps">(
    "black_spending",
  );
  const [result, setResult] = useState<string | null>(null);
  return (
    <form
      action={async (data) => {
        const response = await submitInitiative(data);
        setResult(
          response.error ??
            "Submitted. Save your private edit code: " + response.token,
        );
      }}
      className="mt-8 grid gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
      />
      <label className="sm:col-span-2">
        Initiative
        <select
          name="initiative"
          value={initiative}
          onChange={(e) => setInitiative(e.target.value as typeof initiative)}
          className="mt-2 w-full rounded-xl border p-3"
        >
          <option value="black_spending">Black Spending</option>
          <option value="steps">Daily Steps</option>
        </select>
      </label>
      <label>
        First name
        <input
          required
          name="firstName"
          className="mt-2 w-full rounded-xl border p-3"
        />
      </label>
      <label>
        Last name
        <input
          required
          name="lastName"
          className="mt-2 w-full rounded-xl border p-3"
        />
      </label>
      {initiative === "black_spending" ? (
        <>
          <label>
            Black-owned business
            <input
              required
              name="businessName"
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <label>
            Amount spent (dollars)
            <input
              required
              name="amountCents"
              type="number"
              min="0.01"
              step="0.01"
              className="mt-2 w-full rounded-xl border p-3"
              onChange={(e) => {
                const cents = Math.round(Number(e.target.value) * 100);
                e.target.value = String(cents);
              }}
            />
          </label>
          <label>
            Date
            <input
              required
              name="spentOn"
              type="date"
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
        </>
      ) : (
        <>
          <label>
            Steps
            <input
              required
              name="steps"
              type="number"
              min="1"
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <label>
            Date
            <input
              required
              name="trackedOn"
              type="date"
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
        </>
      )}
      <label>
        Minutes spent
        <input
          required
          name="durationMinutes"
          type="number"
          min="1"
          className="mt-2 w-full rounded-xl border p-3"
        />
      </label>
      <label>
        Receipt or screenshot
        <input
          required
          name="evidence"
          type="file"
          accept="image/*,.pdf"
          className="mt-2 w-full rounded-xl border p-3"
        />
      </label>
      {initiative === "black_spending" && (
        <label className="sm:col-span-2">
          <input
            type="checkbox"
            required
            name="blackOwnedConfirmed"
            value="true"
            className="mr-2"
          />
          I confirm this is a Black-owned business.
        </label>
      )}
      <button className="rounded-full bg-[var(--public-primary)] px-6 py-3 font-semibold text-white sm:col-span-2">
        Submit initiative
      </button>
      {result && (
        <p className="sm:col-span-2 rounded-xl bg-slate-50 p-4 text-sm">
          {result}
        </p>
      )}
    </form>
  );
}
