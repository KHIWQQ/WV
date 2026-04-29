"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { Profile } from "@/types";

/**
 * Hydrates the Zustand store with the server-fetched profile.
 * Renders nothing — pure side-effect bridge between RSC and client state.
 */
export function ProfileHydrator({ profile }: { profile: Profile }) {
  const setProfile = useAppStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  return null;
}
