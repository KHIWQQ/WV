"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  profileServerSchema,
  passwordServerSchema,
} from "@/lib/validations/schemas";

export async function updateProfile(formData: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = profileServerSchema.parse(formData);

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.display_name })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateAvatarUrl(avatarUrl: string | null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validate URL: must be null or a valid https URL from our Supabase storage
  if (avatarUrl !== null) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (
      !avatarUrl.startsWith("https://") ||
      (supabaseUrl && !avatarUrl.startsWith(supabaseUrl))
    ) {
      throw new Error("Invalid avatar URL");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updatePassword(formData: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = passwordServerSchema.parse(formData);

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.current_password,
  });

  if (signInError) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");

  const { error } = await supabase.auth.updateUser({
    password: parsed.new_password,
  });

  if (error) throw new Error(error.message);
}
