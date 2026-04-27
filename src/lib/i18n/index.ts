import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale, Translations } from "./types";
import { th } from "./locales/th";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

export type { Locale, Translations };

const locales: Record<Locale, Translations> = { th, en, zh };

export const LOCALE_LABELS: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
  zh: "中文",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  th: "TH",
  en: "EN",
  zh: "CN",
};

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "th",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "wv:locale" }
  )
);

export function getTranslations(locale: Locale): Translations {
  return locales[locale];
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  return {
    t: locales[locale],
    locale,
    setLocale: useLocaleStore.getState().setLocale,
  };
}
