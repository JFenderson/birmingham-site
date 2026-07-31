import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client that bypasses Row-Level Security entirely.
 *
 * NEVER import this under src/app/** (enforced by the no-restricted-imports
 * ESLint rule). Reserved for trusted server-only code: webhook handlers,
 * scheduled jobs, and the intake-form insert path where the applicant has no
 * session to authenticate an RLS-scoped insert.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
