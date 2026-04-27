import { User } from "lucide-react";
import { getUsersList } from "@/lib/actions/admin";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let currentRole = "user";
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        if (profile) currentRole = profile.role;
    }

    const { success, users, error } = await getUsersList();

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">การจัดการผู้ใช้งาน (User Management)</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    รายชื่อสมาชิก และการจัดการสิทธิ์การเข้าถึงระบบ
                </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-white/50 glass-surface backdrop-blur-xl shadow-sm p-6">
                {success && users ? (
                    <UserManagementTable initialUsers={users} currentUserRole={currentRole} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p>ไม่สามารถโหลดข้อมูลผู้ใช้งานได้</p>
                        {error && <p className="text-sm mt-2 text-red-500">{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
