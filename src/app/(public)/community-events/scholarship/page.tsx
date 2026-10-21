import type { Metadata } from "next";
import Link from "next/link";
import { ScholarshipApplicationForm } from "./application-form";
import { isScholarshipOpen, SCHOLARSHIP_DEADLINE_LABEL } from "@/lib/scholarship/application";

export const metadata: Metadata = {
  title: "Sigma Sapphire Scholarship Application",
  description: "Apply for Tau Sigma Chapter's Sigma Sapphire Scholarship by January 27, 2027.",
};

const essayPrompts = [
  "Introduce yourself, including school, church, and community activities.",
  "Explain why you should receive this scholarship.",
  "Describe your community service and service at your school or other educational institution.",
  "Describe your plans and the position you hope to hold five to seven years into your continued education.",
  "Describe your academic achievements, goals, and future aspirations.",
  "Give one specific example of your leadership.",
  "Describe a problem or need in society that you want public servants to address.",
  "Add any other personal information you want the scholarship committee to consider.",
];

export default function ScholarshipPage() {
  const open = isScholarshipOpen();

  return (
    <div className="bg-white px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10 rounded-md border border-zinc-200 bg-[#f8f9fc] p-6 shadow-sm sm:p-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#013594]">Tau Sigma Chapter of Phi Beta Sigma Fraternity, Inc.</p>
          <h1 className="mt-2 text-4xl font-bold text-[#013594] sm:text-5xl">Sigma Sapphire Scholarship</h1>
          <p className="mt-4 text-[15px] leading-8 text-zinc-700">
            Phi Beta Sigma Fraternity was founded at Howard University on January 9, 1914, by Honorable A. Langston Taylor, Honorable Leonard F. Morse, and Honorable Charles I. Brown. Its founders envisioned a fraternity that would be a part of the general community and serve it through brotherhood, scholarship, and service.
          </p>
          <p className="mt-3 text-[15px] leading-8 text-zinc-700">
            Tau Sigma Chapter in Birmingham seeks to strengthen educational and vocational opportunities in African American communities. The Sigma Sapphire Scholarship supports underrepresented and disadvantaged students preparing for college.
          </p>
          <p className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 font-semibold text-[#013594]">Application deadline: {SCHOLARSHIP_DEADLINE_LABEL}</p>
        </header>

        <section aria-labelledby="eligibility-heading" className="space-y-4">
          <h2 id="eligibility-heading" className="text-2xl font-bold text-[#013594]">Eligibility and required documents</h2>
          <ul className="list-disc space-y-2 pl-6 text-zinc-700">
            <li>Be a male senior at a local-area high school who plans to attend a four-year college or university.</li>
            <li>Have a cumulative GPA of at least 2.75 and an acceptance letter from an accredited college or university.</li>
            <li>Upload an official transcript with the school seal and an authorized official&apos;s signature, a professional résumé, a recommendation letter, and the college acceptance letter.</li>
            <li>Upload a color or black-and-white dress-attire photograph, approximately 4 × 6 inches and 300 dpi.</li>
            <li>Upload the essay described below. Describe your community service in the essay; there is no separate service-proof upload.</li>
          </ul>
          <p className="text-sm text-zinc-600">Selection considers academic achievement, leadership, and extracurricular activities. If eligible applications exceed available funds, those with the highest GPAs receive first preference. Awards are subject to enrollment verification.</p>
        </section>

        <section aria-labelledby="essay-heading" className="space-y-4">
          <h2 id="essay-heading" className="text-2xl font-bold text-[#013594]">Essay instructions</h2>
          <p className="text-zinc-700">Submit one essay of no more than four pages as a PDF or Word .docx file. Use headings for each section and address these topics:</p>
          <ol className="list-decimal space-y-2 pl-6 text-zinc-700">
            {essayPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
          </ol>
        </section>

        <section id="scholarship-rules" aria-labelledby="rules-heading" className="scroll-mt-8 space-y-4">
          <h2 id="rules-heading" className="text-2xl font-bold text-[#013594]">Scholarship rules</h2>
          <ol className="list-decimal space-y-2 pl-6 text-zinc-700">
            <li>All information in the application and its attachments must be true and accurate.</li>
            <li>Transcript copies must be official.</li>
            <li>Criminal activity detected or reported after an award will disqualify the awardee from this scholarship and future Tau Sigma awards.</li>
            <li>Applicants must describe participation in community service in the essay.</li>
            <li>Awardees must display proper etiquette while dancing with an escort at the ceremony and be able to speak publicly.</li>
            <li>Awardees must conduct themselves on and off campus in a way that earns the respect of students and university officials.</li>
            <li>Awardees must report changes in enrollment status or contact information to Tau Sigma Chapter as soon as possible.</li>
          </ol>
        </section>

        <section id="statement-of-commitment" aria-labelledby="commitment-heading" className="scroll-mt-8 rounded-xl border border-blue-200 bg-white p-5">
          <h2 id="commitment-heading" className="text-2xl font-bold text-[#013594]">Statement of commitment</h2>
          <p className="mt-3 leading-7 text-zinc-700">If selected by the Phi Beta Sigma Fraternity, Inc. Scholarship Committee, I understand that I must abide by the program&apos;s rules, regulations, and criteria and make proper use of the educational opportunities provided. If I violate this commitment, I understand that I will be disqualified and receive no further award.</p>
        </section>

        <section aria-labelledby="apply-heading" className="border-t border-zinc-200 pt-8">
          <h2 id="apply-heading" className="text-2xl font-bold text-[#013594]">Apply online</h2>
          {open ? <ScholarshipApplicationForm /> : <p className="mt-4 rounded-lg bg-zinc-100 p-4 text-zinc-700">The application deadline has passed. Applications are closed.</p>}
        </section>

        <Link href="/community-events" className="inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">Back to Events</Link>
      </div>
    </div>
  );
}
