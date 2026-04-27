export const dynamic = 'force-dynamic';

import { ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <RoleGate requireStaff={true}>
            {children}
        </RoleGate>
    );
}
