import { Sparkles } from "lucide-react";
import { getAppSettingsForAdmin } from "@/lib/actions/admin-settings";
import { FeatureFlagsForm } from "@/components/admin/feature-flags-form";

export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage() {
  const settings = await getAppSettingsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">
            จัดการ Premium / ฟรี
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          คุมว่า feature ไหนเปิดให้ใช้ฟรี / ต้องเป็นพรีเมียม
          (เปิดทุกอย่างฟรีไว้ตอนช่วงเรียกลูกค้าได้ — กดสวิตช์ด้านบน)
        </p>
      </div>

      <FeatureFlagsForm initial={settings} />
    </div>
  );
}
