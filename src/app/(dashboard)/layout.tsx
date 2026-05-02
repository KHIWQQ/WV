import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AppSettingsHydrator } from "@/components/dashboard/sections/app-settings-hydrator";
import { getAppSettings } from "@/lib/subscription/settings";

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Fetch app-wide feature flags once for the whole dashboard tree, then
  // bridge them into Zustand so client components (`<PremiumGate>`,
  // `useSubscription`) react instantly without a per-page fetch.
  const appSettings = await getAppSettings();

  return (
    <DashboardLayout>
      <AppSettingsHydrator settings={appSettings} />
      {children}
    </DashboardLayout>
  );
}
