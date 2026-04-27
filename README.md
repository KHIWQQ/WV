# WealthView TH — Tech Stack & Architecture Blueprint

## 🎯 Project Overview

**Platform:** Personal/Family Wealth Management Dashboard  
**Target:** คนไทยทรัพย์สิน 3–50 ล้านบาท  
**Model:** Freemium → Premium Subscription + Affiliate  
**License:** ไม่ต้องใบอนุญาต (เครื่องมือ ไม่ใช่ที่ปรึกษา)

---

## 🏗️ Recommended Tech Stack

### Frontend — Next.js 14+ (App Router)

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| Framework | **Next.js 14+ (App Router)** | SSR + SSG + API Routes ในตัว, SEO ดี |
| Language | **TypeScript** | Type-safe สำคัญมากสำหรับ financial data |
| UI Library | **shadcn/ui + Tailwind CSS** | สวย professional ปรับแต่งง่าย |
| Charts | **Recharts + Tremor** | Dashboard charts สวยและ responsive |
| State | **Zustand** | เบากว่า Redux เหมาะกับ financial state |
| Forms | **React Hook Form + Zod** | Validation แข็งแกร่ง |

### Backend — Supabase + Next.js API Routes

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| Database | **Supabase (PostgreSQL)** | Free tier, RLS, Realtime |
| Auth | **Supabase Auth** | Social login + MFA built-in |
| Storage | **Supabase Storage** | เก็บเอกสาร Estate Vault |
| API | **Next.js API Routes + tRPC** | Type-safe end-to-end |
| Background Jobs | **Trigger.dev** | Cron: อัพเดทราคาหุ้น กองทุน ทอง |

### Market Price APIs

| Data | API/Source | Cost |
|------|-----------|------|
| หุ้นไทย (SET) | SET Smart API / settrade | Free-$50/mo |
| หุ้นต่างประเทศ | Yahoo Finance / Alpha Vantage | Free 500 req/day |
| กองทุนรวมไทย | SEC API (sec.or.th) | Free |
| Crypto | CoinGecko API | Free 30 calls/min |
| ทองไทย | GoldTraders API | Free |
| อัตราแลกเปลี่ยน | ExchangeRate-API | Free 1500 req/mo |

### Hosting & Infrastructure

| Layer | Technology | Cost/เดือน |
|-------|-----------|-----------|
| Frontend | **Vercel** | ฟรี → $20 |
| Database | **Supabase** | ฟรี → $25 |
| Domain | .com + .co.th | ~80 บาท/เดือน |
| Email | **Resend** | ฟรี |
| Analytics | **PostHog** | ฟรี |
| **Total Phase 1** | | **~0–2,000 บาท/เดือน** |

---

## 📐 Architecture

```
┌────────────────────────────────────────────┐
│              CLIENT (Browser)              │
│  Next.js + React + TypeScript + Tailwind   │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐  │
│  │Dashboard│ │Portfolio │ │Retirement  │  │
│  │NetWorth │ │ Tracker  │ │  Planner   │  │
│  └─────────┘ └──────────┘ └────────────┘  │
└───────────────────┬────────────────────────┘
                    │ HTTPS
                    ▼
┌────────────────────────────────────────────┐
│          NEXT.JS API LAYER                 │
│       (API Routes + tRPC + Auth)           │
└───────────────────┬────────────────────────┘
         ┌──────────┼──────────┐
         ▼          ▼          ▼
┌────────────┐ ┌─────────┐ ┌─────────────┐
│ SUPABASE   │ │TRIGGER  │ │ EXTERNAL    │
│ PostgreSQL │ │ .DEV    │ │ PRICE APIs  │
│ + RLS      │ │ (Cron)  │ │ SET/SEC/    │
│ + Auth     │ │         │ │ CoinGecko/  │
│ + Storage  │ │         │ │ Gold/FX     │
└────────────┘ └─────────┘ └─────────────┘
```

---

## 🗃️ Database Schema (Phase 1)

### Core Tables

**profiles** - ข้อมูลผู้ใช้
- id, display_name, avatar_url, currency, created_at

**assets** - ทรัพย์สิน
- id, user_id, category, name, symbol
- quantity, cost_basis, current_price, current_value
- currency, is_auto_update, notes

**liabilities** - หนี้สิน
- id, user_id, name, type
- principal, balance, interest_rate, monthly_payment
- start_date, end_date

**transactions** - รายรับรายจ่าย
- id, user_id, type (income/expense/buy/sell)
- category, amount, description, date

**net_worth_history** - snapshot รายวัน
- id, user_id, total_assets, total_liabilities
- net_worth, asset_breakdown (JSONB), recorded_at

**price_history** - ประวัติราคา
- id, symbol, price, currency, recorded_at

### Asset Categories
- cash (เงินสด/เงินฝาก)
- stock_th (หุ้นไทย)
- stock_us (หุ้นต่างประเทศ)
- mutual_fund (กองทุนรวม)
- crypto (Cryptocurrency)
- gold (ทองคำ)
- bond (พันธบัตร/หุ้นกู้)
- real_estate (อสังหาริมทรัพย์)
- vehicle (รถยนต์)
- insurance (ประกันชีวิต)
- ssf_rmf (SSF/RMF)
- other

### Row Level Security
ทุก table ใช้ RLS — ผู้ใช้เห็นแค่ข้อมูลตัวเอง

---

## 📁 Project Structure

```
wealthview-th/
├── src/
│   ├── app/
│   │   ├── (auth)/login, register
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx          # Net Worth Overview
│   │   │   ├── assets/           # จัดการทรัพย์สิน
│   │   │   ├── liabilities/      # จัดการหนี้สิน
│   │   │   ├── transactions/     # รายรับ-รายจ่าย
│   │   │   ├── portfolio/        # Portfolio Tracking
│   │   │   ├── goals/            # Phase 2
│   │   │   ├── retirement/       # Phase 2
│   │   │   ├── family/           # Phase 3
│   │   │   └── estate/           # Phase 4
│   │   └── api/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   ├── dashboard/            # Charts, cards
│   │   └── portfolio/            # Asset tables
│   ├── lib/
│   │   ├── supabase/             # DB client
│   │   ├── prices/               # Price APIs
│   │   ├── calculations/         # Financial math
│   │   └── utils/                # Formatting
│   ├── hooks/
│   └── types/
├── supabase/migrations/
└── package.json
```

---

## 💰 Cost Summary

| Phase | Users | Infra Cost/mo | Revenue |
|-------|-------|--------------|---------|
| Phase 1 (0-3 mo) | 0-100 | 0-2,000 ฿ | 0 (free) |
| Phase 2 (3-6 mo) | 100-1K | 2,000-5,000 ฿ | Freemium starts |
| Phase 3 (6-9 mo) | 1K-5K | 5,000-15,000 ฿ | 299-599 ฿/mo |
| Phase 4 (9-12 mo) | 5K-10K | 15,000-30,000 ฿ | 599-1,499 ฿/mo |

---

## 🔒 Security Checklist

- [ ] Supabase RLS on ALL tables
- [ ] HTTPS everywhere
- [ ] MFA/2FA option
- [ ] Zod input validation
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Audit logging
- [ ] PDPA compliance
- [ ] No financial data in URLs
- [ ] Regular dependency updates

---

## 🚀 Quick Start Commands

```bash
npx create-next-app@latest wealthview-th \
  --typescript --tailwind --app --src-dir

cd wealthview-th

npm install @supabase/supabase-js @supabase/ssr \
  zustand react-hook-form @hookform/resolvers zod \
  recharts date-fns lucide-react

npx shadcn-ui@latest init
npm run dev
```