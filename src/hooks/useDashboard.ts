"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/actions/dashboard";
import { useAppStore } from "@/stores/useAppStore";
import { useEffect } from "react";

export function useDashboard() {
  const setProfile = useAppStore((state) => state.setProfile);

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => {
      const now = new Date();
      // Calculate start and end of current month using the client's local timezone
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
      return getDashboardData(monthStart, monthEnd);
    },
  });

  useEffect(() => {
    if (query.data?.profile) {
      setProfile(query.data.profile);
    }
    // Only react to profile changes, not the full query.data object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.profile, setProfile]);

  return query;
}
