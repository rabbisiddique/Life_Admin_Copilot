"use client";
import { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { userProfileData } from "../actions/user";
import { createClient } from "../lib/supabase/client";
interface IUserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- start as true
  const supabase = createClient();
  useEffect(() => {
    // Initialize session
    const initialize = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) console.error("Error fetching session:", error);

        setSession(session);
        setUser(session?.user || null);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false); // Done loading
      }
    };

    initialize();

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false); // Done loading after auth event
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, isLoading }; // <-- return isLoading
}

export function useProfileAuth() {
  const [userProfile, setUserProfile] = useState<IUserProfile>();
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await userProfileData();
        console.log("Response:", res);

        if (res.success && res.profile) {
          setUserProfile(res.profile);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchProfileData();
  }, []);

  return { userProfile }; // <-- return isLoading
}
