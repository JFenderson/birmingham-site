"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  citizenshipOptions,
  ethnicityOptions,
  getScholarshipContentType,
  raceOptions,
  SCHOLARSHIP_BUCKET,
  SCHOLARSHIP_FILES,
  type ScholarshipFileName,
} from "@/lib/scholarship/application";
import { finalizeScholarshipApplication, prepareScholarshipApplication } from "./actions";

type SelectedFile = { name: ScholarshipFileName; file: File; contentType: string };

const inputClass = "mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900";

function Choice({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <label className="text-sm font-medium text-zinc-800">
      {label}
      <select required name={name} defaultValue="" className={inputClass}>
        <option value="" disabled>Select an option</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function ScholarshipApplicationForm() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(form: FormData) {
    setSubmitting(true);
    setMessage("");
    try {
      const files: SelectedFile[] = [];
      for (const required of SCHOLARSHIP_FILES) {
        const file = form.get(required.name);
        if (!(file instanceof File) || file.size <= 0 || file.size > required.maxBytes) {
          setMessage(`Choose a ${required.label.toLowerCase()} file under ${required.maxBytes / 1_000_000} MB.`);
          return;
        }
        const format = getScholarshipContentType(required.name, file.name);
        if (!format) {
          setMessage(`${required.label} must use one of these file types: ${required.accept}.`);
          return;
        }
        files.push({ name: required.name, file, contentType: format.contentType });
      }

      const values = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
      const prepared = await prepareScholarshipApplication(
        values,
        files.map(({ name, file }) => ({ name, size: file.size, filename: file.name })),
      );
      if ("error" in prepared) {
        setMessage(prepared.error);
        return;
      }

      const browser = createClient();
      for (const upload of prepared.uploads) {
        const selected = files.find((entry) => entry.name === upload.name);
        if (!selected) {
          setMessage("Please select every required document.");
          return;
        }
        const { error } = await browser.storage.from(SCHOLARSHIP_BUCKET).uploadToSignedUrl(
          upload.path,
          upload.token,
          selected.file,
          { contentType: selected.contentType },
        );
        if (error) {
          setMessage("We could not upload one of your documents. Please try again.");
          return;
        }
      }

      const result = await finalizeScholarshipApplication(prepared.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setMessage("We could not submit the application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p role="status" className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5 text-green-900">Application received. Please watch your email for confirmation.</p>;
  }

  return (
    <form action={submit} className="mt-8 grid gap-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2">
      <input name="website" tabIndex={-1} aria-hidden="true" autoComplete="off" className="absolute -left-[10000px]" />
      <label className="text-sm font-medium text-zinc-800">Legal full name<input required name="legalName" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">Email<input required type="email" name="email" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">Phone<input required type="tel" name="phone" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800 sm:col-span-2">Permanent residence<input required name="address" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">High school<input required name="school" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">Date of birth<input required type="date" name="dateOfBirth" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">Age<input required type="number" min="14" max="25" name="age" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">Current cumulative GPA<input required type="number" min="2.75" max="5" step="0.01" name="gpa" className={inputClass} /></label>
      <Choice name="citizenship" label="Citizenship" options={citizenshipOptions} />
      <Choice name="race" label="Race" options={raceOptions} />
      <Choice name="ethnicity" label="Ethnicity" options={ethnicityOptions} />
      <label className="text-sm font-medium text-zinc-800">Intended major<input required name="major" className={inputClass} /></label>
      <label className="text-sm font-medium text-zinc-800">Intended college or university<input required name="intendedSchool" className={inputClass} /></label>

      <fieldset className="grid gap-4 border-t border-zinc-200 pt-5 sm:col-span-2 sm:grid-cols-2">
        <legend className="text-lg font-semibold text-[#013594]">Required uploads</legend>
        <p className="text-sm text-zinc-600 sm:col-span-2">Each file must be 10 MB or less, except the essay, which must be 5 MB or less. The essay must be a PDF or Word .docx file.</p>
        {SCHOLARSHIP_FILES.map(({ name, label, accept, maxBytes }) => (
          <label key={name} className="text-sm font-medium text-zinc-800">
            {label} <span className="font-normal text-zinc-600">({maxBytes / 1_000_000} MB max)</span>
            <input required type="file" name={name} accept={accept} className={inputClass} />
          </label>
        ))}
      </fieldset>

      <label className="flex items-start gap-3 border-t border-zinc-200 pt-5 text-sm text-zinc-800 sm:col-span-2">
        <input required type="checkbox" name="eligibility" value="yes" className="mt-1" />
        <span>I confirm that I meet the eligibility requirements listed above.</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-zinc-800 sm:col-span-2">
        <input required type="checkbox" name="agreement" value="yes" className="mt-1" />
        <span>I have read and agree to the <a href="#scholarship-rules" className="font-semibold text-[#013594] underline">scholarship rules</a> and <a href="#statement-of-commitment" className="font-semibold text-[#013594] underline">statement of commitment</a>. I confirm that my application and uploads are accurate.</span>
      </label>
      <button disabled={submitting} className="rounded-full bg-[#0047AB] px-5 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2">{submitting ? "Uploading…" : "Submit application"}</button>
      {message && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{message}</p>}
    </form>
  );
}
