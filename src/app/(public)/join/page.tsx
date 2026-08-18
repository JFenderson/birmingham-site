import { JoinForm } from "./join-form";

export default function JoinPage() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h1 className="font-serif text-3xl italic text-navy">
          Interested in Becoming a Sigma?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Whether you&apos;re expressing membership interest, reactivating, or
          transferring from another chapter, tell us a bit about yourself and
          a chapter officer will follow up.
        </p>
      </div>
      <JoinForm />
    </section>
  );
}
