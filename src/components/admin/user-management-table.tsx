"use client";

import { useState } from "react";
import { AppRole, Profile } from "@/types";
import { updateUserRole, updateUserSubscription } from "@/lib/actions/admin";
import { toast } from "@/hooks/useToast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useTranslation } from "@/lib/i18n";

interface ExtendedProfile extends Profile {
    email?: string;
}

interface UserManagementTableProps {
    initialUsers: ExtendedProfile[];
    currentUserRole: string;
}

const ALL_ROLES: AppRole[] = ['superadmin', 'admin', 'sale', 'user', 'cto', 'cfo', 'ceo', 'cio'];

export function UserManagementTable({ initialUsers, currentUserRole }: UserManagementTableProps) {
    const { t } = useTranslation();
    const [users, setUsers] = useState<ExtendedProfile[]>(initialUsers);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    // Removed: const { toast } = useToast();

    const isSuperadmin = currentUserRole === 'superadmin';
    const canEditSub = currentUserRole === 'superadmin' || currentUserRole === 'sale';

    const handleRoleChange = async (userId: string, newRole: string) => {
        setIsLoading(userId);
        try {
            const res = await updateUserRole(userId, newRole as AppRole);
            if (res?.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as AppRole } : u));
                toast({ title: t.admin.roleUpdated, description: t.admin.roleSaved });
            } else {
                toast({ title: t.common.error, description: res?.error || t.admin.roleUpdateError, variant: "destructive" });
            }
        } catch {
            toast({ title: t.common.error, description: t.admin.connectionError, variant: "destructive" });
        } finally {
            setIsLoading(null);
        }
    };

    const handleSubChange = async (userId: string, newTier: string) => {
        setIsLoading(userId);
        try {
            const res = await updateUserSubscription(userId, newTier as 'free' | 'premium');
            if (res?.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier as 'free' | 'premium' } : u));
                toast({ title: t.admin.statusUpdated, description: t.admin.packageSaved });
            } else {
                toast({ title: t.common.error, description: res?.error || t.admin.packageUpdateError, variant: "destructive" });
            }
        } catch {
            toast({ title: t.common.error, description: t.admin.connectionError, variant: "destructive" });
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 dark:bg-white/5 border-b border-border dark:border-white/10">
                    <tr>
                        <th className="px-4 py-3 font-semibold">{t.admin.nameMember}</th>
                        <th className="px-4 py-3 font-semibold">{t.admin.email}</th>
                        <th className="px-4 py-3 font-semibold">{t.admin.role}</th>
                        <th className="px-4 py-3 font-semibold">{t.admin.package}</th>
                        <th className="px-4 py-3 font-semibold text-right">{t.admin.joinDate}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/50 dark:border-white/10 hover:bg-muted/10 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                                <div className="font-medium text-foreground">{user.display_name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5" title={user.id}>
                                    {user.id.split('-')[0]}...
                                </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {user.email}
                            </td>
                            <td className="px-4 py-3">
                                {isSuperadmin ? (
                                    <Select
                                        disabled={isLoading === user.id}
                                        value={user.role || 'user'}
                                        onValueChange={(val) => handleRoleChange(user.id, val)}
                                    >
                                        <SelectTrigger className="w-[130px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ALL_ROLES.map(role => (
                                                <SelectItem key={role} value={role} className="text-xs">
                                                    {role.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                        {user.role || 'user'}
                                    </Badge>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {canEditSub ? (
                                    <Select
                                        disabled={isLoading === user.id}
                                        value={user.subscription_tier || 'free'}
                                        onValueChange={(val) => handleSubChange(user.id, val)}
                                    >
                                        <SelectTrigger className="w-[100px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free" className="text-xs">Free</SelectItem>
                                            <SelectItem value="premium" className="text-xs text-gold">Premium</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={user.subscription_tier === 'premium' ? "default" : "secondary"} className="text-[10px]">
                                        {user.subscription_tier === 'premium' ? 'PREMIUM' : 'FREE'}
                                    </Badge>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-muted-foreground">{t.admin.noUsersFound}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
