"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SUPPORTED_LOCALES, type Locale, type Translations } from "./types";
import { translations } from "./translations";

const DEFAULT_LOCALE: Locale = "en";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const raw of candidates) {
    if (!raw) continue;
    const base = raw.toLowerCase().split("-")[0] as Locale;
    if (SUPPORTED_LOCALES.includes(base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}

interface I18nContextValue {
  locale: Locale;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: translations[DEFAULT_LOCALE],
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const detected = detectBrowserLocale();
    setLocale(detected);
    document.documentElement.lang = detected;
    document.title = translations[detected].meta.title;
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
