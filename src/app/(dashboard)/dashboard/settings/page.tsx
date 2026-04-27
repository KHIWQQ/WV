"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.settings.subtitle}
        </p>
      </div>

      <Card variant="glass">
        <CardContent className="p-6">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">{t.settings.profile}</TabsTrigger>
              <TabsTrigger value="security">{t.settings.security}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-1 mb-6">
                <h2 className="text-lg font-semibold">{t.settings.profileInfo}</h2>
                <p className="text-sm text-muted-foreground">
                  {t.settings.profileInfoDesc}
                </p>
              </div>
              <ProfileForm />
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-1 mb-6">
                <h2 className="text-lg font-semibold">{t.settings.changePassword}</h2>
                <p className="text-sm text-muted-foreground">
                  {t.settings.changePasswordDesc}
                </p>
              </div>
              <PasswordForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
