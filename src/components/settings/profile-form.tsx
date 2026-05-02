"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { profileSchema, type ProfileSchemaType } from "@/lib/validations/schemas";
import { updateProfile, updateAvatarUrl } from "@/lib/actions/profile";
import { useAppStore } from "@/stores/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

export function ProfileForm() {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: profile?.display_name ?? "" },
  });

  useEffect(() => {
    if (profile) {
      reset({ display_name: profile.display_name });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile, reset]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: t.settings.selectImageFile, variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t.settings.fileTooLarge, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateAvatarUrl(avatarUrl);
      setAvatarPreview(avatarUrl);
      setProfile({ ...profile, avatar_url: avatarUrl });
      toast({ title: t.settings.uploadSuccess });
    } catch {
      toast({ title: t.settings.uploadError, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ProfileSchemaType) {
    try {
      await updateProfile(data);
      if (profile) {
        setProfile({ ...profile, display_name: data.display_name });
      }
      toast({ title: t.settings.saveSuccess });
    } catch {
      toast({ title: t.settings.saveError, variant: "destructive" });
    }
  }

  const initials = profile?.display_name
    ?.split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border/50 transition-colors hover:border-gold/50"
        >
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Avatar"
              width={80}
              height={80}
              // unoptimized: avatarPreview is often a blob:/data: URL from
              // FileReader before upload, which next/image's optimizer can't
              // process — and the avatar is small (80px) so optimization
              // would buy little anyway.
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-gold text-navy text-xl font-bold">
              {initials || "?"}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
          aria-label={t.settings.profilePicture}
        />
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium">{t.settings.profilePicture}</p>
          <p className="text-xs text-muted-foreground">
            {uploading ? t.settings.uploading : t.settings.clickToChange}
          </p>
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>{t.settings.displayName}</Label>
          <Input {...register("display_name")} placeholder={t.settings.yourName} />
          {errors.display_name && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.display_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t.settings.email}</Label>
          <Input value={email} disabled className="bg-muted/50" />
          <p className="text-xs text-muted-foreground">
            {t.settings.cannotChangeEmail}
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
