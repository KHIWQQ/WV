import { ReactNode } from "react";
import { PremiumGate } from "@/components/subscription/PremiumGate";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
    return (
        <PremiumGate featureName="พอร์ตการลงทุน">
            {children}
        </PremiumGate>
    );
}
