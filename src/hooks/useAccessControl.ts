import { useAppStore } from "@/stores/useAppStore";
import { AppRole } from "@/types";

export function useAccessControl() {
    const profile = useAppStore((state) => state.profile);

    // Default to 'user' if not loaded or not set
    const role: AppRole = profile?.role || 'user';

    // Define broad access categories
    const isSuperAdmin = role === 'superadmin';
    const isAdmin = role === 'admin' || isSuperAdmin;
    const isSale = role === 'sale';
    const isCLevel = ['ceo', 'cfo', 'cto', 'cio'].includes(role);

    // 'Staff' refers to any internal role (not a regular user)
    const isStaff = role !== 'user';

    return {
        role,
        isSuperAdmin,
        isAdmin,
        isSale,
        isCLevel,
        isStaff,
    };
}
