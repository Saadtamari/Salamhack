"use client";

import React, { useState } from "react";
import { login, type AuthUser } from "@/lib/auth";

export function LoginPage({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const user = login(username, password);
    if (!user) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      setSubmitting(false);
      return;
    }
    onAuth(user);
  }

  function fill(presetUser: string, presetPass: string) {
    setUsername(presetUser);
    setPassword(presetPass);
    setError(null);
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0D3B0F 0%, #1B5E20 52%, #FAFAF8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-ar), 'IBM Plex Sans Arabic', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFFDF8",
          borderRadius: 24,
          border: "1px solid #E8DFCF",
          boxShadow: "0 30px 80px rgba(13, 59, 15, 0.32)",
          padding: 32,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#0F3D29",
              color: "#F0C542",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 900,
              marginBottom: 14,
            }}
          >
            م
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#11100E" }}>مصرف</div>
          <div style={{ fontSize: 12, color: "#6D675E", fontWeight: 700, marginTop: 6 }}>
            محاسبة شرعية ذكية للأعمال الصغيرة
          </div>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ display: "block", fontSize: 12, color: "#6D675E", fontWeight: 700, marginBottom: 6 }}>
              اسم المستخدم
            </span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="normal_user"
              autoComplete="username"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #DDD6CA",
                borderRadius: 12,
                background: "#FAFAF8",
                color: "#11100E",
                fontFamily: "inherit",
                outline: "none",
                fontSize: 14,
                direction: "ltr",
                textAlign: "left",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ display: "block", fontSize: 12, color: "#6D675E", fontWeight: 700, marginBottom: 6 }}>
              كلمة المرور
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #DDD6CA",
                borderRadius: 12,
                background: "#FAFAF8",
                color: "#11100E",
                fontFamily: "inherit",
                outline: "none",
                fontSize: 14,
                direction: "ltr",
                textAlign: "left",
              }}
            />
          </label>

          {error && (
            <div
              style={{
                background: "#FFF6F4",
                border: "1px solid #F5C9C0",
                color: "#7A2515",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 14,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            style={{
              width: "100%",
              background: submitting || !username || !password ? "#A8B7AB" : "#1B5E20",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "13px",
              fontSize: 15,
              fontWeight: 800,
              cursor: submitting || !username || !password ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              marginBottom: 14,
            }}
          >
            تسجيل الدخول
          </button>
        </form>

        <div
          style={{
            background: "#F7F4EE",
            border: "1px dashed #DDD6CA",
            borderRadius: 14,
            padding: 14,
            fontSize: 12,
            color: "#6D675E",
          }}
        >
          <div style={{ fontWeight: 800, color: "#11100E", marginBottom: 8 }}>حسابات تجريبية</div>
          <div style={{ display: "grid", gap: 8 }}>
            <button
              type="button"
              onClick={() => fill("normal_user", "normal_user@123")}
              style={{
                background: "#FFFDF8",
                color: "#11100E",
                border: "1px solid #DDD6CA",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "right",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              مستخدم عادي · normal_user
            </button>
            <button
              type="button"
              onClick={() => fill("admin", "admin@123")}
              style={{
                background: "#FFFDF8",
                color: "#11100E",
                border: "1px solid #DDD6CA",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "right",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              مدير · admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
