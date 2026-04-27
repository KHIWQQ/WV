"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold">เกิดข้อผิดพลาด</h1>
          <p className="text-sm text-muted-foreground">
            ระบบพบปัญหาที่ไม่คาดคิด ทีมงานได้รับแจ้งแล้ว
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            ลองใหม่
          </button>
        </main>
      </body>
    </html>
  );
}
