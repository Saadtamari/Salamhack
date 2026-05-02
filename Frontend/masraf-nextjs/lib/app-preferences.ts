"use client";

import { MASRAF_DATA } from "@/lib/data";
import { getCurrencyPreference, normalizeCurrency, setCurrencyPreference } from "@/lib/currency-preferences";
import { getVoicePersona, normalizeVoicePersona, setVoicePersona, type VoicePersona } from "@/lib/voice-preferences";

export type UserProfilePreference = {
  name: string;
  business: string;
  email: string;
  phone: string;
  businessType: string;
  currency: string;
  vat: string;
  voicePersona: VoicePersona;
  invoiceStyle: string;
};

export type NotificationPreferences = {
  overdueInvoices: boolean;
  zakatReminder: boolean;
  contractAnalysis: boolean;
  receiptScan: boolean;
  monthlyReports: boolean;
  islamicPhrases: boolean;
};

const PROFILE_KEY = "masraf_user_profile";
const NOTIFICATION_KEY = "masraf_notification_preferences";
export const DEFAULT_GUEST_NAME = "أحمد الشمري";
export const DEFAULT_GUEST_BUSINESS = "شمري للتصميم";
const OLD_GUEST_NAME = "Masref Guest";
const OLD_GUEST_BUSINESS = "Smart Financial Consultations";

export const DEFAULT_PROFILE: UserProfilePreference = {
  name: DEFAULT_GUEST_NAME,
  business: DEFAULT_GUEST_BUSINESS,
  email: "ahmad@shamri.design",
  phone: "+962 79 555 0123",
  businessType: "freelancer",
  currency: getCurrencyPreference(MASRAF_DATA.user.currency),
  vat: "16",
  voicePersona: getVoicePersona("abdullahai"),
  invoiceStyle: "heritage_green",
};

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  overdueInvoices: true,
  zakatReminder: true,
  contractAnalysis: true,
  receiptScan: true,
  monthlyReports: true,
  islamicPhrases: true,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export function getUserProfilePreference(): UserProfilePreference {
  const stored = readJson<UserProfilePreference>(PROFILE_KEY, DEFAULT_PROFILE);
  const storedName = typeof stored.name === "string" ? stored.name.trim() : "";
  const storedBusiness = typeof stored.business === "string" ? stored.business.trim() : "";
  const name = storedName && storedName !== OLD_GUEST_NAME ? storedName : DEFAULT_GUEST_NAME;
  const business = storedBusiness && storedBusiness !== OLD_GUEST_BUSINESS ? storedBusiness : DEFAULT_GUEST_BUSINESS;
  return {
    ...DEFAULT_PROFILE,
    ...stored,
    name,
    business,
    currency: normalizeCurrency(stored.currency, DEFAULT_PROFILE.currency),
    voicePersona: normalizeVoicePersona(stored.voicePersona, DEFAULT_PROFILE.voicePersona),
  };
}

export function setUserProfilePreference(next: UserProfilePreference) {
  const nextName = typeof next.name === "string" ? next.name.trim() : "";
  const nextBusiness = typeof next.business === "string" ? next.business.trim() : "";
  const normalized: UserProfilePreference = {
    ...next,
    name: nextName || DEFAULT_GUEST_NAME,
    business: nextBusiness || DEFAULT_GUEST_BUSINESS,
    currency: normalizeCurrency(next.currency, DEFAULT_PROFILE.currency),
    voicePersona: normalizeVoicePersona(next.voicePersona, DEFAULT_PROFILE.voicePersona),
  };

  setCurrencyPreference(normalized.currency);
  setVoicePersona(normalized.voicePersona);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function getNotificationPreferences(): NotificationPreferences {
  return readJson<NotificationPreferences>(NOTIFICATION_KEY, DEFAULT_NOTIFICATIONS);
}

export function setNotificationPreferences(next: NotificationPreferences) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(next));
  }
  return next;
}

export function profileInitials(profile: Pick<UserProfilePreference, "name">) {
  const parts = profile.name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("") || "م";
}
