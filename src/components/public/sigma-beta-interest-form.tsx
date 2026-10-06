"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  submitSigmaBetaInterestFormAction,
  type SigmaBetaInterestResult,
} from "@/app/(public)/sigma-beta-club/actions";
import { sigmaBetaReferralLabels } from "@/lib/validation/schemas";

const initialState: SigmaBetaInterestResult = { success: true, message: "" };
const labelClass = "text-sm font-semibold text-[var(--public-ink)]";
const fieldClass = "w-full rounded-md border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-sm text-[var(--public-ink)] outline-none transition-colors focus-visible:border-[var(--public-blue)] focus-visible:ring-2 focus-visible:ring-[var(--public-blue)]/30";

export function SigmaBetaInterestForm({ chapterName }: { chapterName: string }) {
  const [state, formAction, pending] = useActionState(submitSigmaBetaInterestFormAction, initialState);

  if (state.success && state.message) {
    return <p role="status" className="rounded-lg border border-[var(--public-border)] bg-[var(--public-surface-subtle)] px-5 py-4 text-[var(--public-blue-deep)]">{state.message}</p>;
  }

  return (
    <form action={formAction} className="space-y-7">
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-sm text-[var(--public-muted)]">Fields marked * are required.</p>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-lg font-bold text-[var(--public-blue-deep)]">Parent/Guardian Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="parentName" className={labelClass}>Parent/Guardian Name <span aria-hidden="true">*</span></label>
            <input id="parentName" name="parentName" autoComplete="name" required maxLength={200} className={fieldClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="parentEmail" className={labelClass}>Parent/Guardian Email <span aria-hidden="true">*</span></label>
            <input id="parentEmail" name="parentEmail" type="email" autoComplete="email" required maxLength={254} className={fieldClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="parentPhone" className={labelClass}>Parent/Guardian Phone Number <span aria-hidden="true">*</span></label>
            <input id="parentPhone" name="parentPhone" type="tel" autoComplete="tel" required maxLength={20} pattern="[+]?1?[ .-]?(\([0-9]{3}\)|[0-9]{3})[ .-]?[0-9]{3}[ .-]?[0-9]{4}" title="Enter a 10-digit U.S. phone number, such as (205) 555-0100." className={fieldClass} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-lg font-bold text-[var(--public-blue-deep)]">Student Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="studentName" className={labelClass}>Student Name <span aria-hidden="true">*</span></label>
            <input id="studentName" name="studentName" required maxLength={200} className={fieldClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="studentAge" className={labelClass}>Student Age <span aria-hidden="true">*</span></label>
            <input id="studentAge" name="studentAge" type="number" min={8} max={18} step={1} required className={fieldClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="gradeLevel" className={labelClass}>Current Grade Level <span aria-hidden="true">*</span></label>
            <select id="gradeLevel" name="gradeLevel" defaultValue="" required className={fieldClass}>
              <option value="" disabled>Select a grade</option>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => <option key={grade} value={grade}>{grade}{grade === 2 ? "nd" : grade === 3 ? "rd" : "th"} grade</option>)}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="studentSchool" className={labelClass}>Student School <span aria-hidden="true">*</span></label>
            <input id="studentSchool" name="studentSchool" required maxLength={200} className={fieldClass} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-lg font-bold text-[var(--public-blue-deep)]">Additional Information</legend>
        <div className="space-y-2">
          <label htmlFor="referralSource" className={labelClass}>How did you hear about Sigma Beta Club? <span className="font-normal">(optional)</span></label>
          <select id="referralSource" name="referralSource" defaultValue="" className={fieldClass}>
            <option value="">Select an option</option>
            {Object.entries(sigmaBetaReferralLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="message" className={labelClass}>Questions or Additional Information <span className="font-normal">(optional)</span></label>
          <textarea id="message" name="message" rows={4} maxLength={2000} className={fieldClass} />
        </div>
      </fieldset>

      {state.success === false ? <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p> : null}

      <p className="text-sm leading-relaxed text-[var(--public-muted)]">
        By submitting this form, you are requesting information about the {chapterName} Sigma Beta Club. Submission of an interest form does not constitute membership or acceptance into the program. A parent or legal guardian will be contacted regarding participation and intake requirements.
      </p>
      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--public-blue)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--public-blue-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--public-blue)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
        <Send aria-hidden="true" className="h-4 w-4" />
        {pending ? "Submitting..." : "Join the Interest List"}
      </button>
    </form>
  );
}
