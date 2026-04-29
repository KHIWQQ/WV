"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { route: "dashboard" },
    });
  }, [error]);

  const isAuth = error.message === "Unauthorized";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-muted-foreground">
          {isAuth
            ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
            : "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ ทีมงานได้รับแจ้งแล้ว"}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/70">
            ref: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {isAuth ? (
          <Button asChild>
            <Link href="/login">เข้าสู่ระบบ</Link>
          </Button>
        ) : (
          <>
            <Button onClick={reset} variant="default">
              <RotateCw className="mr-2 h-4 w-4" />
              ลองใหม่
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                กลับหน้าแรก
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
