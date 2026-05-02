import Link from "next/link";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  PieChart,
  Target,
  Globe,
  Sparkles,
  Lock,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  PiggyBank,
  ArrowLeftRight,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "./landing-header";

interface LandingPageProps {
  allFeaturesFree: boolean;
}

const FEATURES = [
  {
    icon: Wallet,
    title: "ติดตามทรัพย์สินทุกประเภท",
    desc: "หุ้นไทย, US, กองทุน, คริปโต, ทองคำไทย, อสังหาฯ — รวมในที่เดียว ราคาอัปเดตอัตโนมัติ",
  },
  {
    icon: CreditCard,
    title: "บริหารหนี้สินอย่างชาญฉลาด",
    desc: "ดูตารางผ่อน, คำนวณดอกเบี้ยรวม, ทดลองจ่ายเพิ่มดูประหยัดกี่เดือน",
  },
  {
    icon: ArrowLeftRight,
    title: "บันทึกรายรับ-รายจ่าย",
    desc: "หมวดหมู่ครบ พร้อมกราฟแนวโน้มรายเดือน + สัดส่วนค่าใช้จ่าย",
  },
  {
    icon: PieChart,
    title: "วิเคราะห์พอร์ตการลงทุน",
    desc: "Asset allocation, P&L รายตัว, country exposure — ดูพอร์ตเป็นภาพรวม",
  },
  {
    icon: Target,
    title: "ตั้งเป้าหมายการเงิน",
    desc: "บ้าน, รถ, เกษียณ, กองทุนฉุกเฉิน — track progress + แนะนำเงินออมต่อเดือน",
  },
  {
    icon: PiggyBank,
    title: "วางแผนเกษียณ",
    desc: "คำนวณเงินที่ต้องมี, ดูโครงการเงินสะสมตามอายุ, ปรับสมมติฐานได้",
  },
  {
    icon: TrendingUp,
    title: "ราคาตลาดสด",
    desc: "หุ้น SET / NYSE / NASDAQ, BTC, ETH, ทองคำ 96.5% — ดูได้ใน watchlist",
  },
  {
    icon: Globe,
    title: "หลายสกุลเงิน",
    desc: "ลงทุน USD/EUR/JPY ได้ — ระบบแปลงเป็น THB อัตโนมัติเมื่อรวมพอร์ต",
  },
];

const HOW_IT_WORKS = [
  {
    n: "1",
    title: "สมัครฟรี ใน 30 วินาที",
    desc: "Login ด้วย Google หรือสมัครด้วย email — ไม่ต้องบัตรเครดิต",
  },
  {
    n: "2",
    title: "ใส่ทรัพย์สิน + หนี้สิน",
    desc: "หุ้นใส่ symbol → ราคาอัปเดตเอง, อสังหา/รถใส่มูลค่าเอง",
  },
  {
    n: "3",
    title: "เห็นภาพรวมทันที",
    desc: "Dashboard แสดง net worth, cashflow, allocation — ทุกอย่างในหน้าเดียว",
  },
];

const TRUST = [
  {
    icon: Lock,
    title: "ข้อมูลถูกเข้ารหัส",
    desc: "Supabase + RLS — ข้อมูลคุณ คุณคนเดียวเห็น",
  },
  {
    icon: ShieldCheck,
    title: "Row-Level Security",
    desc: "ทุก query ถูก enforce ใน DB — ไม่มีการรั่วข้าม user",
  },
  {
    icon: Smartphone,
    title: "ใช้บนมือถือได้",
    desc: "Responsive design — ใช้ผ่าน browser มือถือได้เต็มฟีเจอร์",
  },
  {
    icon: Globe,
    title: "ภาษาไทยเต็มระบบ",
    desc: "ทำเพื่อคนไทย — รองรับหุ้น SET, ทองคำไทย, สลาก SSF/RMF",
  },
];

export function LandingPage({ allFeaturesFree }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-600 to-navy-800 text-white">
        {/* Decorative blurred mesh */}
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-gold-300 to-navy-500 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          {allFeaturesFree && (
            <div className="mx-auto mb-8 inline-flex w-full max-w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold-200 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>โปรโมชั่นเปิดตัว — ทุกฟีเจอร์ฟรี ไม่จำกัด</span>
            </div>
          )}

          <h1 className="text-balance text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            จัดการ
            <span className="text-gradient-gold mx-2 inline-block">
              ความมั่งคั่ง
            </span>
            <br className="hidden sm:block" />
            ของคุณในที่เดียว
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/80 sm:text-xl">
            แพลตฟอร์มจัดการทรัพย์สิน หนี้สิน รายรับ-รายจ่าย และการลงทุน
            <br className="hidden sm:block" />
            ออกแบบมาเพื่อคนไทยโดยเฉพาะ
          </p>

          <div className="mx-auto mt-10 flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                className="w-full gap-2 text-base sm:w-auto"
              >
                <Sparkles className="h-5 w-5" />
                เริ่มใช้ฟรี
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/30 bg-transparent text-base text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>

          {/* Inline trust micro-copy */}
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ฟรีตลอดชีพ
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ไม่ต้องบัตรเครดิต
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ตั้งค่า 30 วินาที
            </span>
          </div>
        </div>

        {/* Mockup placeholder strip */}
        <div className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl">
            <div className="rounded-xl bg-gradient-to-br from-navy/60 to-navy-800/60 p-8 sm:p-12">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Net Worth", value: "฿2,450,000", tone: "gold" },
                  { label: "Assets", value: "฿2,800,000", tone: "emerald" },
                  { label: "Liabilities", value: "฿350,000", tone: "red" },
                  { label: "Savings Rate", value: "32%", tone: "blue" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <p className="text-xs uppercase tracking-wider text-white/50">
                      {s.label}
                    </p>
                    <p
                      className={`mt-2 text-lg font-bold tabular-nums sm:text-2xl ${
                        s.tone === "gold"
                          ? "text-gold"
                          : s.tone === "emerald"
                            ? "text-emerald-400"
                            : s.tone === "red"
                              ? "text-red-400"
                              : "text-blue-400"
                      }`}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/80">
                      Asset Allocation
                    </p>
                    <PieChart className="h-4 w-4 text-gold" />
                  </div>
                  <div className="mt-3 flex h-32 items-center justify-center text-white/40">
                    <PieChart className="h-20 w-20 opacity-40" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/80">
                      Net Worth Trend
                    </p>
                    <LineChart className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-3 flex h-32 items-center justify-center text-white/40">
                    <LineChart className="h-20 w-20 opacity-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="bg-background py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              ฟีเจอร์ครบ จบในที่เดียว
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              ทุกอย่างที่ต้องใช้เพื่อ
              <span className="text-gradient-gold mx-2">บริหารเงิน</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              ตั้งแต่บัญชีออมทรัพย์จนถึงพอร์ตการลงทุน
              ระบบเดียวเห็นภาพรวมความมั่งคั่งทั้งหมด
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/30 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(0_0_0/0.3)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y border-border bg-muted/20 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              เริ่มต้นง่ายๆ
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              3 ขั้นตอน เห็นภาพรวมการเงิน
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.n} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold text-2xl font-bold text-navy shadow-lg">
                  {step.n}
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-[calc(50%+2rem)] top-8 hidden w-[calc(100%-4rem)] border-t-2 border-dashed border-gold/30 md:block"
                  />
                )}
                <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / SECURITY */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              ปลอดภัย ไว้ใจได้
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              ข้อมูลการเงินคุณ — เก็บอย่างมืออาชีพ
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="mt-3 text-base font-bold">{t.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING / FINAL CTA */}
      <section
        id="pricing"
        className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-600 to-navy-800 py-20 text-white sm:py-24"
      >
        <div
          className="absolute inset-x-0 top-1/2 -z-10 transform-gpu overflow-hidden blur-3xl"
          aria-hidden="true"
        >
          <div
            className="relative left-1/2 aspect-[1155/678] w-[72rem] -translate-x-1/2 -translate-y-1/2 rotate-[30deg] bg-gradient-to-tr from-gold-500 to-navy-300 opacity-25"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {allFeaturesFree ? (
              <>
                ตอนนี้
                <span className="text-gradient-gold mx-2">ทุกฟีเจอร์ฟรี</span>
                ไม่จำกัด
              </>
            ) : (
              <>
                เริ่มจัดการ
                <span className="text-gradient-gold mx-2">ความมั่งคั่ง</span>
                วันนี้
              </>
            )}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            {allFeaturesFree
              ? "ใช้ feature ทั้งหมดได้ฟรีในช่วงเปิดตัว — ทดลองแบบเต็มโดยไม่ต้องสมัครจ่าย"
              : "สมัครฟรี ใช้ฟีเจอร์พื้นฐานได้ตลอดชีพ — อัปเกรดเมื่อต้องการเครื่องมือขั้นสูง"}
          </p>

          <ul className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
            {[
              "ติดตามทรัพย์สิน + หนี้สิน + รายรับ-รายจ่าย",
              "ราคาตลาด real-time (หุ้น/คริปโต/ทอง)",
              "Dashboard แสดง net worth + cashflow",
              "บันทึกรายการแบบไม่จำกัด",
              "รองรับหลายสกุลเงิน + แปลงเป็น THB อัตโนมัติ",
              "ใช้ได้ทั้ง desktop + mobile",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-left text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <span className="text-white/90">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button variant="gold" size="lg" className="gap-2 text-base">
                <Sparkles className="h-5 w-5" />
                สมัครฟรี — เริ่มเลย
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-white/60">
              ไม่ต้องบัตรเครดิต · ใช้งานได้ทันที
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
                  <span className="text-base font-bold text-navy">W</span>
                </div>
                <span className="text-lg font-bold tracking-tight">
                  WealthView TH
                </span>
              </Link>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                แพลตฟอร์มจัดการความมั่งคั่งสำหรับคนไทย
                — บริหารทรัพย์สิน หนี้สิน และมูลค่าสุทธิในที่เดียว
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">
                ผลิตภัณฑ์
              </h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ฟีเจอร์
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    วิธีใช้งาน
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ราคา
                  </a>
                </li>
                <li>
                  <Link
                    href="/api-docs"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">
                บัญชี
              </h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    สมัครสมาชิก
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} WealthView TH. All rights reserved.
            ·{" "}
            <span className="text-muted-foreground/70">
              Built with Next.js + Supabase
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
