"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { finalizeInitiativeUpload, prepareInitiativeUpload } from "@/app/(public)/initiatives/actions";
import { DEFAULT_STEPS_PER_MILE, estimateStepsFromMiles } from "@/lib/initiatives/tracker";

export function InitiativeTracker() {
  const [initiative, setInitiative] = useState<"black_spending" | "steps">(
    "black_spending",
  );
  const [result, setResult] = useState<string | null>(null);
  const [miles, setMiles] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      action={async (data) => {
        setSubmitting(true);
        const evidence = data.get("evidence");
        if (!(evidence instanceof File)) {
          setResult("Upload a receipt or screenshot first.");
          setSubmitting(false);
          return;
        }
        const values = Object.fromEntries([...data.entries()].filter(([, value]) => typeof value === "string"));
        const prepared = await prepareInitiativeUpload(values, { name: evidence.name, size: evidence.size });
        if ("error" in prepared) {
          setResult(prepared.error);
          setSubmitting(false);
          return;
        }
        const { error: uploadError } = await createClient().storage
          .from("initiative-evidence")
          .uploadToSignedUrl(prepared.path, prepared.token, evidence, { contentType: evidence.type });
        const response = uploadError ? { error: "We could not upload the proof file. Please try again." } : await finalizeInitiativeUpload(prepared.id);
        setResult(
          response.error ??
            "Submitted for review. It will appear in chapter totals once verified.",
        );
        setSubmitting(false);
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
      <fieldset className="sm:col-span-2">
        <legend>Time spent (optional)</legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <label>
          Hours
          <input
            name="durationHours"
            type="number"
            min="0"
            max="24"
            className="mt-2 w-full rounded-xl border p-3"
            placeholder="Leave blank to estimate from miles"
          />
        </label>
        <label>
          Minutes
          <input
            name="durationMinutes"
            type="number"
            min="0"
            max="59"
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        </div>
      </fieldset>
      {initiative === "steps" && <label>
        Miles walked (optional)
        <input
          name="distanceMiles"
          type="number"
          min="0"
          max="500"
          step="0.01"
          onChange={(e) => setMiles(e.target.value)}
          className="mt-2 w-full rounded-xl border p-3"
        />
        <p className="mt-2 text-sm text-slate-500">If steps are blank, we’ll estimate {miles ? estimateStepsFromMiles(Number(miles), DEFAULT_STEPS_PER_MILE).toLocaleString() : "0"} steps using {DEFAULT_STEPS_PER_MILE.toLocaleString()} steps per mile.</p>
      </label>}
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
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--public-primary)] px-6 py-3 font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:col-span-2"
      >
        {submitting ? "Submitting…" : initiative === "black_spending"
          ? "Submit Black Spending"
          : "Submit Steps Entry"}
      </button>
      {result && (
        <p className="sm:col-span-2 rounded-xl bg-slate-50 p-4 text-sm">
          {result}
        </p>
      )}
    </form>
  );
}
