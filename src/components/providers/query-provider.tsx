"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { useState } from "react";

function handleAuthError(error: unknown) {
  if (
    error instanceof Error &&
    error.message === "Unauthorized" &&
    typeof window !== "undefined"
  ) {
    window.location.href = "/login";
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,        // 5 min — most dashboard data is fine for this long
            gcTime: 10 * 60 * 1000,          // 10 min — drop cached pages user navigated away from
            refetchOnWindowFocus: false,
            retry(failureCount, error) {
              if (error instanceof Error && error.message === "Unauthorized") {
                return false;
              }
              return failureCount < 1;
            },
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: handleAuthError,
        }),
        mutationCache: new MutationCache({
          onError: handleAuthError,
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
