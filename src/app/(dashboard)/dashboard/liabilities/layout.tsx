import { ReactNode } from "react";
import { PremiumGate } from "@/components/subscription/PremiumGate";

export default function LiabilitiesLayout({ children }: { children: ReactNode }) {
    return (
        <PremiumGate featureName="จัดการหนี้สิน" feature="liabilities">
            {children}
        </PremiumGate>
    );
}
