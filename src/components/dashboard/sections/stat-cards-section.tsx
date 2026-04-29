import { getDashboardStats } from "@/lib/actions/dashboard";
import { StatCardsGrid } from "./stat-cards-grid";
import { ProfileHydrator } from "./profile-hydrator";

export async function StatCardsSection() {
  const stats = await getDashboardStats();
  return (
    <>
      <StatCardsGrid stats={stats} />
      {stats.profile && <ProfileHydrator profile={stats.profile} />}
    </>
  );
}
