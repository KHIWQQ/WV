"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "#features", label: "ฟีเจอร์" },
  { href: "#how-it-works", label: "วิธีใช้งาน" },
  { href: "#pricing", label: "ราคา" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-navy/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <span className="text-base font-bold text-navy">W</span>
          </div>
          <span className="text-lg font-bold tracking-tight">WealthView TH</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-gold"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              เข้าสู่ระบบ
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="gold" className="gap-1">
              <Sparkles className="h-4 w-4" />
              เริ่มใช้ฟรี
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-md p-2 text-white md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-white/10 bg-navy/95 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                เข้าสู่ระบบ
              </Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button variant="gold" className="w-full gap-1">
                <Sparkles className="h-4 w-4" />
                เริ่มใช้ฟรี
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
