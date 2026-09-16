"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) return { error: "Password must be between 8 and 128 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your reset session has expired. Request a new reset email." };

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2")) {
    return { error: "Complete officer verification before changing your password." };
  }
  // User-scoped Auth enforces configured secure password change rules.
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error ? "Could not set your password. Request a fresh recovery email, or complete officer verification, and try again." : null };
}
