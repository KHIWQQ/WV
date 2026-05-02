"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { AppSettings } from "@/lib/subscription";

/**
 * Mirrors ProfileHydrator: takes the server-fetched feature-flag settings
 * and pushes them into Zustand so client gates (`useSubscription`,
 * `<PremiumGate>`) react without an extra fetch.
 *
 * Renders nothing.
 */
export function AppSettingsHydrator({ settings }: { settings: AppSettings }) {
  const setAppSettings = useAppStore((s) => s.setAppSettings);

  useEffect(() => {
    setAppSettings(settings);
  }, [settings, setAppSettings]);

  return null;
}
