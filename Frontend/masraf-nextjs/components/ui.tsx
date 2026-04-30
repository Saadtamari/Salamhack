"use client";
import React from "react";
import { Alert02Icon, CheckmarkCircle02Icon, Clock05Icon, Wallet02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { MasrafIcon } from "./icons";

// ─── fmt helper ───────────────────────────────────────────────────────────────
export function fmt(n: number, currency = "USD") {
  const symbols: Record<string, string> = { USD: "$", SAR: "ر.س", AED: "د.إ", JOD: "د.أ", EGP: "ج.م", KWD: "د.ك" };
  const sym = symbols[currency] || currency;
  const num = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(Math.abs(n));
  return `${num} ${sym}`;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: IconSvgElement }> = {
    paid:    { label: "مدفوعة", color: "#147A41", icon: CheckmarkCircle02Icon },
    sent:    { label: "مُرسلة", color: "#8A6400", icon: Clock05Icon },
    overdue: { label: "متأخرة", color: "#B3261E", icon: Alert02Icon },
    draft:   { label: "مسودة",  color: "#6D675E", icon: Wallet02Icon },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: s.color, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <MasrafIcon icon={s.icon} size={14} color={s.color} strokeWidth={2} />
      {s.label}
    </span>
  );
}

// ─── RiskBadge ────────────────────────────────────────────────────────────────
export function RiskBadge({ risk, score }: { risk: string; score: number }) {
  const map: Record<string, { label: string; color: string; icon: IconSvgElement }> = {
    low:    { label: "منخفض", color: "#147A41", icon: CheckmarkCircle02Icon },
    medium: { label: "متوسط", color: "#8A6400", icon: Clock05Icon },
    high:   { label: "مرتفع", color: "#B3261E", icon: Alert02Icon },
  };
  const r = map[risk] || map.low;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: r.color, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <MasrafIcon icon={r.icon} size={14} color={r.color} strokeWidth={2} />
      {r.label} · {score}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 40, color = "#11100E" }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#F1EDE5", color: color === "#FFFFFF" ? "#11100E" : color, border: "1px solid #DDD6CA", fontWeight: 800, fontSize: size * 0.35, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-ar)" }}>
      {initials}
    </div>
  );
}

// ─── HalalBadge ───────────────────────────────────────────────────────────────
export function HalalBadge({ halal = true }: { halal?: boolean }) {
  return (
    <span style={{ fontSize: 11, color: halal ? "#147A41" : "#B3261E", fontWeight: 800, fontFamily: "var(--font-ar)" }}>
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
          <stop offset="0%"   stopColor="#11100E" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#11100E" stopOpacity="0"    />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#F0C542" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F0C542" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={toArea(incomePoints)} fill="url(#incomeGrad)" />
      <path d={toArea(expPoints)}    fill="url(#expGrad)"    />
      <path d={toPath(incomePoints)} fill="none" stroke="#11100E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(expPoints)}    fill="none" stroke="#9C7614" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
      {incomePoints.slice(3).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#11100E" opacity="0.35" />)}
    </svg>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
export function DonutChart({ categories }: { categories: { name: string; color: string; pct: number }[] }) {
  const size = 120, r = 44, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const segments = categories.reduce<{ cat: { name: string; color: string; pct: number }; offset: number }[]>((acc, cat) => {
    const offset = acc.reduce((sum, item) => sum + item.cat.pct, 0);
    return [...acc, { cat, offset }];
  }, []);
  return (
    <svg width={size} height={size}>
      {segments.map(({ cat, offset }, i) => {
        const dash = (cat.pct / 100) * circumference;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={cat.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset * circumference / 100}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }} />
        );
      })}
      <circle cx={cx} cy={cy} r="28" fill="#F7F4EE" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#11100E" fontWeight="700" fontFamily="var(--font-ar)">$247</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#92897C" fontFamily="var(--font-ar)">هذا الشهر</text>
    </svg>
  );
}

// ─── RunwayIndicator ──────────────────────────────────────────────────────────
export function RunwayIndicator({ days = 47 }: { days?: number }) {
  const color = days > 60 ? "#147A41" : days > 30 ? "#8A6400" : "#B3261E";
  return (
    <div style={{ background: "#FFFDF8", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-ar)", border: "1px solid #DDD6CA" }}>
      <div>
        <div style={{ fontSize: 12, color, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
          <MasrafIcon icon={Alert02Icon} size={15} color={color} strokeWidth={2} />
          المدرج المالي
        </div>
        <div style={{ fontSize: 13, color: "#6D675E", marginTop: 2 }}>المصاريف الحالية تكفي لـ</div>
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{days}</div>
        <div style={{ fontSize: 12, color, fontWeight: 700 }}>يوماً</div>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, cta, onCta }: { icon?: React.ReactNode; title: string; subtitle: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", textAlign: "center", fontFamily: "var(--font-ar)" }}>
      <div style={{ width: 72, height: 72, borderRadius: 18, background: "#F1EDE5", border: "1px solid #DDD6CA", color: "#11100E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        {icon || <MasrafIcon icon={Wallet02Icon} size={30} color="#11100E" />}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#11100E", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#6D675E", marginBottom: 24, maxWidth: 260, lineHeight: 1.7 }}>{subtitle}</div>
      {cta && <button onClick={onCta} style={{ background: "#11100E", color: "#FFFDF8", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>{cta}</button>}
    </div>
  );
}
