import { getCurrentChapter } from "@/lib/tenant/get-chapter";

export default async function ContactPage() {
  const chapter = await getCurrentChapter();
  return (
    <div className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Contact</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          For chapter information, partnerships, or service opportunities, please connect with Tau Sigma through our official channels.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="rounded-md border border-zinc-200 p-5">
            <h2 className="text-lg font-semibold text-zinc-900">General Inquiries</h2>
            <p className="mt-2 text-sm text-zinc-600">For general questions, partnerships, service opportunities, or chapter information, email the chapter or connect with us on social media.</p>
            <a href="mailto:tausigmapbs@gmail.com" className="mt-4 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b8e]">Email the Chapter</a>
          </section>
          <section className="rounded-md border border-zinc-200 p-5"><h2 className="text-lg font-semibold text-zinc-900">Stay connected</h2><p className="mt-2 text-sm text-zinc-600">Follow Birmingham Sigmas on our official social media pages for announcements, events, and service opportunities.</p><p className="mt-4 text-sm text-zinc-500">Social links can be added and maintained in the site settings.</p></section>
        </div>
      </div>
    </div>
  );
}
