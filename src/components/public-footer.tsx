import type { CurrentChapter } from "@/lib/tenant/get-chapter";

export function PublicFooter({ chapter }: { chapter: CurrentChapter }) {
  return (
    <footer id="contact" className="bg-navy-dark text-white/80">
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm">
        <p className="font-semibold text-white">{chapter.name}</p>
        <p className="mt-1">
          {chapter.type === "collegiate"
            ? "An advised collegiate chapter of Phi Beta Sigma Fraternity, Inc."
            : "Phi Beta Sigma Fraternity, Inc."}
        </p>
        <p className="mt-6 text-white/50">
          © {new Date().getFullYear()} {chapter.name}. Culture For Service, Service For Humanity.
        </p>
      </div>
    </footer>
  );
}
