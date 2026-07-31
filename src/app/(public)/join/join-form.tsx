"use client";

import { useState } from "react";
import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { intakeFormSchema } from "@/lib/validation/schemas";
import { submitIntakeForm } from "./actions";

const [intakeSchema, reactivationSchema, transferSchema] = intakeFormSchema.options;

type FormType = "intake" | "reactivation" | "transfer";

const FORM_TYPE_LABELS: Record<FormType, string> = {
  intake: "New Member Intake",
  reactivation: "Reactivation",
  transfer: "Transfer",
};

const SCHEMAS = {
  intake: intakeSchema,
  reactivation: reactivationSchema,
  transfer: transferSchema,
} as const;

export function JoinForm() {
  const [formType, setFormType] = useState<FormType>("intake");

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {(Object.keys(FORM_TYPE_LABELS) as FormType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFormType(type)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              formType === type
                ? "border-navy bg-navy text-white"
                : "border-zinc-300 text-zinc-600 hover:border-navy hover:text-navy dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {FORM_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <JoinFormFields key={formType} formType={formType} />
    </div>
  );
}

function JoinFormFields({ formType }: { formType: FormType }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const schema = SCHEMAS[formType];
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues>({
    // Each branch of the discriminated union has a different shape; this
    // form intentionally handles all three generically via FieldValues, so
    // the resolver's precise per-branch type is cast away here.
    resolver: zodResolver(schema) as unknown as Resolver<FieldValues>,
    defaultValues: { formType },
  });

  async function onSubmit(values: FieldValues) {
    setError(null);
    const result = await submitIntakeForm({ ...values, formType } as Parameters<
      typeof submitIntakeForm
    >[0]);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-serif text-2xl italic text-navy">Application Received</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Thank you — a chapter officer will follow up with you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" value={formType} {...register("formType")} />

      <Field label="Full Name" error={errors.fullName?.message as string | undefined}>
        <input className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("fullName")} />
      </Field>

      <Field label="Email" error={errors.email?.message as string | undefined}>
        <input type="email" className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("email")} />
      </Field>

      <Field label="Phone (optional)" error={errors.phone?.message as string | undefined}>
        <input type="tel" className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("phone")} />
      </Field>

      {formType === "intake" && (
        <>
          <Field
            label="School Name"
            error={errors.schoolName?.message as string | undefined}
          >
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("schoolName")} />
          </Field>
          <Field label="Major (optional)">
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("major")} />
          </Field>
          <Field label="Expected Graduation Year (optional)">
            <input className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("expectedGraduationYear")} />
          </Field>
        </>
      )}

      {(formType === "reactivation" || formType === "transfer") && (
        <Field
          label="Previous Chapter Name"
          error={errors.previousChapterName?.message as string | undefined}
        >
          <input className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("previousChapterName")} />
        </Field>
      )}

      {formType === "reactivation" && (
        <Field label="Years Inactive (optional)">
          <input className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("yearsInactive")} />
        </Field>
      )}

      <Field label="Anything else you'd like us to know? (optional)">
        <textarea rows={4} className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" {...register("message")} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {isSubmitting ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
