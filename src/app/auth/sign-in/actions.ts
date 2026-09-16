"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeEmailSignIn(formData: FormData) {
  const hash = formData.get("token_hash");
  const code = formData.get("code");
  if ((typeof hash !== "string" || hash.length < 1 || hash.length > 2048) &&
      (typeof code !== "string" || code.length < 1 || code.length > 2048)) {
    redirect("/login?error=link-expired");
  }
  const supabase = await createClient();
  // POST confirmation prevents email-link scanners and prefetch from consuming tokens.
  const { error } = typeof hash === "string" && hash.length > 0 && hash.length <= 2048
    ? await supabase.auth.verifyOtp({ token_hash: hash, type: "email" })
    : await supabase.auth.exchangeCodeForSession(code as string);
  if (error) redirect("/login?error=link-expired");
  redirect("/dashboard");
}
