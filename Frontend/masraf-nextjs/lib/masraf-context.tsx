"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMasrafBackend, type MasrafData } from "@/lib/api";
import {
  getNotificationPreferences,
  getUserProfilePreference,
  setNotificationPreferences,
  setUserProfilePreference,
  type NotificationPreferences,
  type UserProfilePreference,
} from "@/lib/app-preferences";
import { setCurrencyPreference } from "@/lib/currency-preferences";
import { setVoicePersona, type VoicePersona } from "@/lib/voice-preferences";

type MasrafContextValue = {
  data: MasrafData;
  loading: boolean;
  connected: boolean;
  usingMock: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  profile: UserProfilePreference;
  updateProfile: (patch: Partial<UserProfilePreference>) => void;
  notifications: NotificationPreferences;
  updateNotification: (key: keyof NotificationPreferences, value: boolean) => void;
  currency: string;
  voicePersona: VoicePersona;
};

const MasrafContext = createContext<MasrafContextValue | null>(null);

export function MasrafProvider({ children }: { children: React.ReactNode }) {
  const backend = useMasrafBackend();
  const [profile, setProfile] = useState<UserProfilePreference>(() => getUserProfilePreference());
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => getNotificationPreferences());

  useEffect(() => {
    setCurrencyPreference(profile.currency);
  }, [profile.currency]);

  useEffect(() => {
    setVoicePersona(profile.voicePersona);
  }, [profile.voicePersona]);

  const value = useMemo<MasrafContextValue>(() => ({
    data: backend.data,
    loading: backend.loading,
    connected: backend.connected,
    usingMock: backend.usingMock,
    error: backend.error,
    refetch: backend.refetch,
    profile,
    updateProfile: (patch) => {
      setProfile((current) => {
        const cleanPatch = Object.fromEntries(
          Object.entries(patch).filter(([, value]) => value !== undefined),
        ) as Partial<UserProfilePreference>;
        return setUserProfilePreference({ ...current, ...cleanPatch });
      });
    },
    notifications,
    updateNotification: (key, enabled) => {
      setNotifications((current) => setNotificationPreferences({ ...current, [key]: enabled }));
    },
    currency: profile.currency,
    voicePersona: profile.voicePersona,
  }), [backend.connected, backend.data, backend.error, backend.loading, backend.refetch, backend.usingMock, notifications, profile]);

  return <MasrafContext.Provider value={value}>{children}</MasrafContext.Provider>;
}

export function useMasrafApp() {
  const value = useContext(MasrafContext);
  if (!value) {
    throw new Error("useMasrafApp must be used inside MasrafProvider");
  }
  return value;
}
