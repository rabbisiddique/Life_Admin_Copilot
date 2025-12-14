"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "../../../lib/supabase/client";

export function NotificationListener() {
  const supabase = createClient();
  useEffect(() => {
    const channel = supabase
      .channel("notifications-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const data = payload.new;

          // Safety: only show if time has reached
          if (new Date(data.trigger_time) <= new Date()) {
            toast(`${data.title}: ${data.message}`, {
              id: data.id,
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return null; // No UI
}
