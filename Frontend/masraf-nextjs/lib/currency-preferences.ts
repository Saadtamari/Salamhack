"use client";

const STORAGE_KEY = "masraf_currency";
const SUPPORTED_CURRENCIES = new Set(["USD", "SAR", "AED", "JOD", "EGP", "KWD"]);

type CurrencyGlobal = typeof globalThis & {
  MASRAF_CURRENCY?: string;
};

export function normalizeCurrency(value: unknown, fallback = "USD") {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toUpperCase();
  return SUPPORTED_CURRENCIES.has(normalized) ? normalized : fallback;
}

export function getCurrencyPreference(fallback = "USD") {
  if (typeof window === "undefined") {
    return normalizeCurrency(fallback);
  }

  return normalizeCurrency(window.localStorage.getItem(STORAGE_KEY), fallback);
}

export function setCurrencyPreference(value: string) {
  const currency = normalizeCurrency(value);
  (globalThis as CurrencyGlobal).MASRAF_CURRENCY = currency;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, currency);
  }

  return currency;
}
