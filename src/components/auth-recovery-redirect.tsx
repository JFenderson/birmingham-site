"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Routes Supabase's hash-based recovery session to the password form. */
export function AuthRecoveryRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/reset-password") return;

    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecovery = hash.get("type") === "recovery";

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
      }
    });

    if (isRecovery) {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.replace("/reset-password");
      });
    }

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
