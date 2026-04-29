"use client";
import React from "react";
import { MASRAF_DATA } from "@/lib/data";

// ─── fmt helper ───────────────────────────────────────────────────────────────
export function fmt(n: number, currency = "USD") {
  const symbols: Record<string, string> = { USD: "$", SAR: "ر.س", AED: "د.إ", JOD: "د.أ", EGP: "ج.م", KWD: "د.ك" };
  const sym = symbols[currency] || currency;
  const num = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(Math.abs(n));
  return `${num} ${sym}`;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    paid:    { label: "مدفوعة", bg: "#E8F5E9", color: "#1B5E20" },
    sent:    { label: "مُرسلة", bg: "#FFF8E1", color: "#C6930A" },
    overdue: { label: "متأخرة", bg: "#FFEBEE", color: "#B71C1C" },
    draft:   { label: "مسودة",  bg: "#F5F5F0", color: "#6B6B65" },
  };
  const s = map[status] || map.draft;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
}

// ─── RiskBadge ────────────────────────────────────────────────────────────────
export function RiskBadge({ risk, score }: { risk: string; score: number }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    low:    { label: "منخفض", bg: "#E8F5E9", color: "#1B5E20" },
    medium: { label: "متوسط", bg: "#FFF8E1", color: "#C6930A" },
    high:   { label: "مرتفع", bg: "#FFEBEE", color: "#B71C1C" },
  };
  const r = map[risk] || map.low;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: r.bg, color: r.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, display: "inline-block" }}></span>
      {r.label} · {score}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 40, color = "#1B5E20" }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", color, fontWeight: 700, fontSize: size * 0.35, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      {initials}
    </div>
  );
}

// ─── HalalBadge ───────────────────────────────────────────────────────────────
export function HalalBadge({ halal = true }: { halal?: boolean }) {
  return (
    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: halal ? "#E8F5E9" : "#FFEBEE", color: halal ? "#1B5E20" : "#B71C1C", fontWeight: 700, fontFamily: "IBM Plex Sans Arabic" }}>
      {halal ? "حلال" : "مشبوه"}
    </span>
  );
}

// ─── IslamicPattern ───────────────────────────────────────────────────────────
export function IslamicPattern({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }} aria-hidden="true">
      <defs>
        <pattern id="islamic" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="2" x2="20" y2="38" stroke="currentColor" strokeWidth="0.4" />
          <line x1="2" y1="11" x2="38" y2="29" stroke="currentColor" strokeWidth="0.4" />
          <line x1="38" y1="11" x2="2" y2="29" stroke="currentColor" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic)" />
    </svg>
  );
}

// ─── MiniChart ────────────────────────────────────────────────────────────────
export function MiniChart({ data, width = 300, height = 80 }: { data: { income: number; expenses: number }[]; width?: number; height?: number }) {
  const incomePoints = data.map((d, i) => ({ x: (i / (data.length - 1)) * width, y: height - (d.income / 16000) * height }));
  const expPoints    = data.map((d, i) => ({ x: (i / (data.length - 1)) * width, y: height - (d.expenses / 16000) * height }));
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const toArea = (pts: { x: number; y: number }[]) => toPath(pts) + ` L${width},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height, overflow: "visible" }}>
      <defs>
        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1B5E20" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1B5E20" stopOpacity="0"    />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#C6930A" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#C6930A" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={toArea(incomePoints)} fill="url(#incomeGrad)" />
      <path d={toArea(expPoints)}    fill="url(#expGrad)"    />
      <path d={toPath(incomePoints)} fill="none" stroke="#1B5E20" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(expPoints)}    fill="none" stroke="#C6930A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
      {incomePoints.slice(3).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#1B5E20" opacity="0.4" />)}
    </svg>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
export function DonutChart({ categories }: { categories: { name: string; color: string; pct: number }[] }) {
  const size = 120, r = 44, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size}>
      {categories.map((cat, i) => {
        const dash = (cat.pct / 100) * circumference;
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={cat.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset * circumference / 100}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }} />
        );
        offset += cat.pct;
        return seg;
      })}
      <circle cx={cx} cy={cy} r="28" fill="#FAFAF8" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#1A1A18" fontWeight="700" fontFamily="IBM Plex Sans Arabic">$247</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9"  fill="#9C9C95" fontFamily="IBM Plex Sans Arabic">هذا الشهر</text>
    </svg>
  );
}

// ─── RunwayIndicator ──────────────────────────────────────────────────────────
export function RunwayIndicator({ days = 47 }: { days?: number }) {
  const color = days > 60 ? "#1B5E20" : days > 30 ? "#C6930A" : "#B71C1C";
  const bg    = days > 60 ? "#E8F5E9" : days > 30 ? "#FFF8E1" : "#FFEBEE";
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div>
        <div style={{ fontSize: 11, color, fontWeight: 600 }}>🛩️ المدرج المالي</div>
        <div style={{ fontSize: 12, color: "#6B6B65", marginTop: 2 }}>المصاريف الحالية تكفي لـ</div>
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{days}</div>
        <div style={{ fontSize: 11, color, fontWeight: 600 }}>يوماً</div>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📋", title, subtitle, cta, onCta }: { icon?: string; title: string; subtitle: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", textAlign: "center", fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "#F5F5F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A18", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#9C9C95", marginBottom: 24, maxWidth: 240, lineHeight: 1.7 }}>{subtitle}</div>
      {cta && <button onClick={onCta} style={{ background: "#1B5E20", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{cta}</button>}
    </div>
  );
}
