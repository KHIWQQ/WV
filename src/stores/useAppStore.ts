import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Asset } from "@/types/asset";
import type { Liability } from "@/types/liability";
import type { Transaction } from "@/types/transaction";
import type { NetWorthHistory, Profile } from "@/types";
import { DEFAULT_APP_SETTINGS, type AppSettings } from "@/lib/subscription";

interface AppState {
  // User profile
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // App-wide feature-flag settings (read-only on client; admins write via
  // server action which then re-hydrates the store).
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;

  // Assets
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  // Liabilities
  liabilities: Liability[];
  setLiabilities: (liabilities: Liability[]) => void;
  addLiability: (liability: Liability) => void;
  updateLiability: (id: string, data: Partial<Liability>) => void;
  removeLiability: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;

  // Net Worth History
  netWorthHistory: NetWorthHistory[];
  setNetWorthHistory: (history: NetWorthHistory[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  appSettings: DEFAULT_APP_SETTINGS,
  setAppSettings: (settings) => set({ appSettings: settings }),

  assets: [],
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
  updateAsset: (id, data) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  removeAsset: (id) =>
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

  liabilities: [],
  setLiabilities: (liabilities) => set({ liabilities }),
  addLiability: (liability) =>
    set((s) => ({ liabilities: [...s.liabilities, liability] })),
  updateLiability: (id, data) =>
    set((s) => ({
      liabilities: s.liabilities.map((l) =>
        l.id === id ? { ...l, ...data } : l
      ),
    })),
  removeLiability: (id) =>
    set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) })),

  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((s) => ({ transactions: [transaction, ...s.transactions] })),

  netWorthHistory: [],
  setNetWorthHistory: (netWorthHistory) => set({ netWorthHistory }),
}));

// ─── Memoized selectors ───────────────────────────────────────────────
// Cache the last input/output reference so React subscribers don't re-render
// when the underlying array is unchanged.

const totalsCache = new WeakMap<object, number>();

function sumWithCache(arr: readonly { current_value?: number; balance?: number }[], key: "current_value" | "balance"): number {
  const cached = totalsCache.get(arr);
  if (cached !== undefined) return cached;
  const total = arr.reduce((sum, item) => sum + (item[key] ?? 0), 0);
  totalsCache.set(arr, total);
  return total;
}

export const selectTotalAssets = (s: AppState): number =>
  sumWithCache(s.assets, "current_value");

export const selectTotalLiabilities = (s: AppState): number =>
  sumWithCache(s.liabilities, "balance");

export const selectNetWorth = (s: AppState): number =>
  selectTotalAssets(s) - selectTotalLiabilities(s);

// Convenience hook returning all three totals with shallow equality.
// Components use: const { totalAssets, totalLiabilities, netWorth } = useNetWorth();
export function useNetWorth() {
  return useAppStore(
    useShallow((s) => ({
      totalAssets: selectTotalAssets(s),
      totalLiabilities: selectTotalLiabilities(s),
      netWorth: selectNetWorth(s),
    }))
  );
}
