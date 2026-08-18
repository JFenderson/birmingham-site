"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your reset session has expired. Request a new reset email." };

  const { error } = await supabase.auth.updateUser({ password });
  return { error: error ? "Could not set your password. Please try again." : null };
}
