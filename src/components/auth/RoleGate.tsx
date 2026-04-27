"use client";

import { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { useAccessControl } from "@/hooks/useAccessControl";
import { AppRole } from "@/types";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGateProps {
    children: ReactNode;
    allowedRoles?: AppRole[];
    requireStaff?: boolean;
    requireAdmin?: boolean;
    requireSuperAdmin?: boolean;
    requireCLevel?: boolean;
    fallback?: ReactNode; // Custom fallback instead of the default restricted screen
}

/**
 * RoleGate conditionally renders its children based on the user's role.
 * You can pass an array of `allowedRoles`, or use convenience flags like `requireStaff`.
 */
export function RoleGate({
    children,
    allowedRoles,
    requireStaff,
    requireAdmin,
    requireSuperAdmin,
    requireCLevel,
    fallback,
}: RoleGateProps) {
    const { t } = useTranslation();
    const { role, isStaff, isAdmin, isSuperAdmin, isCLevel } = useAccessControl();

    let hasAccess = false;

    if (allowedRoles && allowedRoles.includes(role)) {
        hasAccess = true;
    } else if (requireSuperAdmin && isSuperAdmin) {
        hasAccess = true;
    } else if (requireAdmin && isAdmin) {
        hasAccess = true;
    } else if (requireCLevel && isCLevel) {
        hasAccess = true;
    } else if (requireStaff && isStaff) {
        hasAccess = true;
    } else if (!allowedRoles && !requireStaff && !requireAdmin && !requireSuperAdmin && !requireCLevel) {
        // If no specific requirement is passed, we default to deny to be safe
        hasAccess = false;
    }

    // Superadmin usually has access to everything by default, but we'll stick to strict checks for now 
    // unless we want SuperAdmin to bypass all RoleGates.
    if (isSuperAdmin) {
        hasAccess = true;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback !== undefined) {
        return <>{fallback}</>;
    }

    // Default Restricted Screen
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
            <div className="mb-4 rounded-full bg-red-500/10 p-4">
                <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                {t.roleGate.unauthorized}
            </h2>
            <p className="mb-6 text-muted-foreground font-medium">
                {t.roleGate.noPermission} <br />
                (Current Role: {role})
            </p>
            <Link href="/dashboard">
                <Button variant="outline">{t.roleGate.backToHome}</Button>
            </Link>
        </div>
    );
}
