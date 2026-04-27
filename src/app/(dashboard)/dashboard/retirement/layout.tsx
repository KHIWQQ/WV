import { ReactNode } from "react";
import { PremiumGate } from "@/components/subscription/PremiumGate";

export default function RetirementLayout({ children }: { children: ReactNode }) {
    return (
        <PremiumGate featureName="วางแผนเกษียณ">
            {children}
        </PremiumGate>
    );
}
