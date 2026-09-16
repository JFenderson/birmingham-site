import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export default async function AcceptInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Welcome, brother</h1>
        <p className="text-sm text-zinc-600">You can create a password or continue without one and use an email sign-in link. Chapter approval is still required for member access.</p>
        <SetPasswordForm />
      </div>
    </div>
  );
}
