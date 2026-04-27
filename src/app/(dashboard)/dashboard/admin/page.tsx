import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Activity, Database } from "lucide-react";
import { getAdminMetrics } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/utils/format";
import { AdminGrowthChart, AdminSubscriptionChart } from "@/components/admin/admin-charts";

export default async function AdminDashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let role = "user";
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        if (profile) role = profile.role;
    }

    const isSuperAdmin = role === 'superadmin';
    const isCLevel = ['ceo', 'cfo', 'cio'].includes(role);

    const { success, metrics } = await getAdminMetrics();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        ระบบจัดการหลังบ้านสำหรับทีมงาน (Role: <span className="uppercase font-bold text-gold">{role}</span>)
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ผู้ใช้งานทั้งหมด</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {success ? metrics?.totalUsers.toLocaleString() : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {success ? metrics?.userGrowthStr : ""} จากเดือนที่แล้ว
                        </p>
                    </CardContent>
                </Card>

                <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">สมาชิก Premium</CardTitle>
                        <Shield className="h-4 w-4 text-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {success ? metrics?.premiumUsers.toLocaleString() : "-"}
                        </div>
                        <p className="text-xs text-muted-foreground text-emerald-500">
                            Active
                        </p>
                    </CardContent>
                </Card>

                <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ทรัพย์สินรวมในระบบ</CardTitle>
                        <Database className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {(isCLevel || isSuperAdmin) ? (
                            <>
                                <div className="text-2xl font-bold">
                                    {success ? formatTHB(metrics?.totalSystemAssetsTracked || 0) : "-"}
                                </div>
                                <p className="text-xs text-emerald-500 font-medium">Aggregated Data</p>
                            </>
                        ) : (
                            <>
                                <div className="text-xl font-bold text-muted-foreground/50" aria-hidden="true">— — —</div>
                                <p className="text-xs text-muted-foreground">ไม่มีสิทธิ์ดูข้อมูลเชิงลึก</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card variant="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">สถานะเซิร์ฟเวอร์</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">Online</div>
                        <p className="text-xs text-muted-foreground">Uptime: 99.9%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <AdminGrowthChart
                    data={success && metrics?.monthlyData ? metrics.monthlyData : []}
                    title="กราฟแสดงการเติบโต"
                    usersLabel="ผู้ใช้ใหม่"
                />
                <AdminSubscriptionChart
                    data={success && metrics ? [
                        { name: "Free", value: metrics.freeUsers },
                        { name: "Premium", value: metrics.premiumUsers },
                    ] : []}
                    title="สัดส่วนสมาชิก"
                />
            </div>
        </div>
    );
}
