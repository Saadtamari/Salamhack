"use client";

const STORAGE_KEY = "masraf.auth";

export type AuthUser = {
  username: string;
  role: "user" | "admin";
  displayName: string;
};

type Credential = {
  username: string;
  password: string;
  role: "user" | "admin";
  displayName: string;
};

const CREDENTIALS: Credential[] = [
  { username: "normal_user", password: "normal_user@123", role: "user", displayName: "أحمد الشمري" },
  { username: "admin", password: "admin@123", role: "admin", displayName: "مدير النظام" },
];

export function login(username: string, password: string): AuthUser | null {
  const match = CREDENTIALS.find(
    (entry) => entry.username === username.trim() && entry.password === password,
  );
  if (!match) return null;

  const user: AuthUser = {
    username: match.username,
    role: match.role,
    displayName: match.displayName,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore quota / private mode failures
    }
  }

  return user;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && typeof parsed.username === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
