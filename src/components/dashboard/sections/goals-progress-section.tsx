import { getGoals } from "@/lib/actions/goals";
import { GoalsProgressCard } from "./goals-progress-card";

export async function GoalsProgressSection() {
  const goals = await getGoals();
  if (goals.length === 0) return null;
  // Pick top 3 by progress (closest to completion first)
  const top = [...goals]
    .map((g) => ({
      ...g,
      pct: g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  return <GoalsProgressCard goals={top} />;
}
