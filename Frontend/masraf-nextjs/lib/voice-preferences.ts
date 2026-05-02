"use client";

export type VoicePersona = "abdullahai" | "fatima";

const STORAGE_KEY = "masraf_voice_persona";

type VoiceGlobal = typeof globalThis & {
  MASRAF_VOICE_PERSONA?: VoicePersona;
};

export function normalizeVoicePersona(value: unknown, fallback: VoicePersona = "abdullahai"): VoicePersona {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();

  if (["fatima", "aisha", "female", "woman"].includes(normalized) || value.trim() === "فاطمة") {
    return "fatima";
  }

  if (
    ["abdullahai", "abdullah", "abdulla", "male", "man"].includes(normalized) ||
    value.trim() === "عبدالله"
  ) {
    return "abdullahai";
  }

  return fallback;
}

export function getVoicePersona(fallback: VoicePersona = "abdullahai"): VoicePersona {
  if (typeof window === "undefined") {
    return fallback;
  }

  return normalizeVoicePersona(window.localStorage.getItem(STORAGE_KEY), fallback);
}

export function setVoicePersona(value: VoicePersona) {
  const persona = normalizeVoicePersona(value);
  (globalThis as VoiceGlobal).MASRAF_VOICE_PERSONA = persona;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, persona);
  }

  return persona;
}

export function getRuntimeVoicePersona(fallback: VoicePersona = "abdullahai"): VoicePersona {
  const runtimeValue = (globalThis as VoiceGlobal).MASRAF_VOICE_PERSONA;
  if (runtimeValue) {
    return normalizeVoicePersona(runtimeValue, fallback);
  }

  return getVoicePersona(fallback);
}
