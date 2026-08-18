import { redirect } from "next/navigation";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { NewEventForm } from "./new-event-form";

export default async function NewEventPage() {
  try {
    await requireRole(["Admin", "Secretary"]);
  } catch (err) {
    if (err instanceof MfaRequiredError) {
      redirect("/security/mfa");
    }
    if (err instanceof PermissionError) {
      redirect("/events");
    }
    throw err;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <PortalPageHeader
        eyebrow="Chapter Calendar"
        title="New Event"
        description="Create a chapter event using the existing event and check-in workflow, now with more mobile-safe form spacing."
      />
      <PortalCard className="rounded-[2rem] p-5 sm:p-6" variant="elevated">
        <NewEventForm />
      </PortalCard>
    </div>
  );
}
