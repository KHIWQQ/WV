import { getAllocation } from "@/lib/actions/allocation";
import { AllocationDriftCard } from "./allocation-drift-card";

/** Server component: only renders the card when there are alerts to show. */
export async function AllocationDriftSection() {
  const { alerts } = await getAllocation();
  if (alerts.length === 0) return null;
  return <AllocationDriftCard alerts={alerts} />;
}
