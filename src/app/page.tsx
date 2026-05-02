import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/subscription/settings";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Authenticated users skip the marketing page and go straight to work.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  // Read the master "free promo mode" flag so the hero/banner can announce
  // it to visitors when active.
  const settings = await getAppSettings();

  return <LandingPage allFeaturesFree={settings.allFeaturesFree} />;
}
