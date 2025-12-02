// hooks/useSyncUser.ts
"use client";
import { useEffect } from "react";
import { createClient } from "../lib/supabase/client";

export default function useSyncUser() {
  const supabase = createClient();

  useEffect(() => {
    const syncUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: session.user }),
        });
        console.log(session);
      }
    };

    syncUser();
  }, []);
}
