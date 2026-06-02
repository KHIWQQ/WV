import { ReactNode } from "react";
import { PremiumGate } from "@/components/subscription/PremiumGate";

export default function SalaryLayout({ children }: { children: ReactNode }) {
  return (
    <PremiumGate featureName="บริหารเงินเดือน" feature="salary_management">
      {children}
    </PremiumGate>
  );
}
