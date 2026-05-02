"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema, type PasswordSchemaType } from "@/lib/validations/schemas";
import { updatePassword } from "@/lib/actions/profile";
import { toast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

export function PasswordForm() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordSchemaType>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  async function onSubmit(data: PasswordSchemaType) {
    try {
      await updatePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast({ title: t.settings.passwordChanged });
      reset();
    } catch (err) {
      toast({
        title: t.settings.passwordChangeError,
        description: err instanceof Error ? err.message : t.common.tryAgain,
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>{t.settings.currentPassword}</Label>
        <Input
          type="password"
          {...register("current_password")}
          placeholder="••••••••"
        />
        {errors.current_password && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.current_password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t.settings.newPassword}</Label>
        <Input
          type="password"
          {...register("new_password")}
          placeholder={t.auth.atLeast8Chars}
        />
        {errors.new_password && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.new_password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t.settings.confirmNewPassword}</Label>
        <Input
          type="password"
          {...register("confirm_password")}
          placeholder={t.settings.reenterPassword}
        />
        {errors.confirm_password && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.common.saving : t.settings.changePassword}
        </Button>
      </div>
    </form>
  );
}
