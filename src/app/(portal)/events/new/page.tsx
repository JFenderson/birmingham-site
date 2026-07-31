import { redirect } from "next/navigation";
import { requireRole, PermissionError } from "@/lib/auth/rbac";
import { NewEventForm } from "./new-event-form";

export default async function NewEventPage() {
  try {
    await requireRole(["Admin", "Secretary"]);
  } catch (err) {
    if (err instanceof PermissionError) {
      redirect("/events");
    }
    throw err;
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">New Event</h1>
      <NewEventForm />
    </div>
  );
}
