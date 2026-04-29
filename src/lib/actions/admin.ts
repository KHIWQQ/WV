"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { AppRole } from "@/types";
import { logger } from "@/lib/logger";
import { prefetchFxRates, convertToHome } from "@/lib/currency/aggregate";

// Admin Client with Service Role Key to bypass RLS
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase Service Role Key");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Check if current user is authorized for admin actions
async function requireSuperAdmin() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    throw new Error("Forbidden: Requires Superadmin role");
  }

  return user;
}

// Check if current user is authorized for staff actions (Superadmin or Sale)
async function requireStaffForSub() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "sale") {
    throw new Error("Forbidden: Requires Superadmin or Sale role");
  }

  return user;
}

export async function getUsersList() {
  try {
    // For listing users, requires staff
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    // Check if the caller is at least a staff member
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    const role = profile?.role as AppRole;
    if (!role || role === 'user') {
      throw new Error("Forbidden: Requires Staff access");
    }

    const adminClient = getAdminSupabase();
    
    // Fetch profiles from public.profiles
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Fetch all users from auth.users with pagination to get their emails
    const allAuthUsers: { id: string; email?: string }[] = [];
    let page = 1;
    const perPage = 50;
    while (true) {
      const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });
      if (authError) throw authError;
      allAuthUsers.push(...authData.users);
      if (authData.users.length < perPage) break;
      page++;
    }

    // Merge email addresses into profile data
    const authMap = new Map(allAuthUsers.map(u => [u.id, u.email]));
    const usersWithEmail = profiles.map(p => ({
      ...p,
      email: authMap.get(p.id) || "No Email",
    }));

    return {
      success: true,
      users: usersWithEmail
    };
  } catch (error) {
    logger.error({ err: error }, "admin: fetch users list failed");
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function updateUserRole(userId: string, newRole: AppRole) {
  try {
    const currentUser = await requireSuperAdmin();

    // Prevent superadmin from demoting themselves
    if (currentUser.id === userId && newRole !== "superadmin") {
      return { success: false, error: "Cannot demote yourself" };
    }

    const adminClient = getAdminSupabase();

    const { error } = await adminClient
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "admin: update user role failed");
    return { success: false, error: "Failed to update role" };
  }
}

export async function updateUserSubscription(userId: string, newTier: 'free' | 'premium') {
  try {
    await requireStaffForSub();
    const adminClient = getAdminSupabase();

    const { error } = await adminClient
        .from("profiles")
        .update({ subscription_tier: newTier })
        .eq("id", userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "admin: update user subscription failed");
    return { success: false, error: "Failed to update subscription" };
  }
}

export async function getAdminMetrics() {
  try {
    await requireStaffForSub(); // any staff can view the basics
    const adminClient = getAdminSupabase();

    const now = new Date();

    // 1. Total Users Count (only fetch counts, not all data)
    const { count: totalUsers, error: usersCountError } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (usersCountError) throw usersCountError;

    const { count: premiumUsers, error: premiumError } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("subscription_tier", "premium");

    if (premiumError) throw premiumError;

    // New users this month
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { count: newUsersThisMonth, error: newUsersError } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart);

    if (newUsersError) throw newUsersError;

    const total = totalUsers ?? 0;
    const premium = premiumUsers ?? 0;
    const newThisMonth = newUsersThisMonth ?? 0;

    const previousMonthUsers = total - newThisMonth;
    const userGrowthStr = previousMonthUsers > 0
      ? `+${Math.round((newThisMonth / previousMonthUsers) * 100)}%`
      : '+100%';

    // 2. Total system assets — sum in THB across mixed currencies.
    // PostgREST aggregate (`current_value.sum()`) was the prior approach but
    // it required `db_aggregates_enabled` and silently broke the whole admin
    // metrics call when unavailable. Pull rows + sum in JS instead, which
    // also lets us convert each asset to THB before adding (the prod data
    // has USD/JPY/etc. assets that must not be added to THB raw).
    const { data: assetRows, error: assetsError } = await adminClient
      .from("assets")
      .select("current_value, currency")
      .is("deleted_at", null);

    if (assetsError) throw assetsError;

    const fxRates = await prefetchFxRates(assetRows ?? []);
    const totalSystemAssetsTracked = (assetRows ?? []).reduce(
      (sum, a) => sum + convertToHome(a.current_value ?? 0, a.currency, fxRates),
      0
    );

    // Monthly user registration data (last 6 months) — fetch only needed data
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: recentUsers, error: recentError } = await adminClient
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgoStr);

    if (recentError) throw recentError;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const count = (recentUsers ?? []).filter(u => {
        const ud = new Date(u.created_at);
        return ud.getMonth() === m && ud.getFullYear() === y;
      }).length;
      monthlyData.push({ month: monthNames[m], count });
    }

    return {
      success: true,
      metrics: {
        totalUsers: total,
        premiumUsers: premium,
        userGrowthStr,
        totalSystemAssetsTracked,
        monthlyData,
        freeUsers: total - premium,
      }
    };
  } catch (error) {
    logger.error({ err: error }, "admin: fetch metrics failed");
    return { success: false, error: "Failed to fetch metrics" };
  }
}
