"use client";
import React, { useEffect, useMemo, useState } from "react";
import { MASRAF_DATA } from "@/lib/data";
import {
  Agreement01Icon,
  AiVoiceIcon,
  Alert02Icon,
  ChartBarLineIcon,
  DashboardSquare01Icon,
  InformationCircleIcon,
  Invoice03Icon,
  Money03Icon,
  UserMultipleIcon,
  ZakatIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import { MasrafIcon } from "@/components/icons";
import { apiConfig, useBackendHealth, useMasrafBackend } from "@/lib/api";
import { buildAgentSessionSnapshot } from "@/lib/api/agent-context";
import {
  DesktopDashboard, DesktopInvoices, DesktopClients,
  DesktopExpenses, DesktopZakat, DesktopContracts, DesktopReports,
  DesktopNotifications, DesktopSettings,
} from "@/components/DesktopScreens";

type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports" | "notifications" | "settings";

const NAV_ITEMS: { page: Page; icon: IconSvgElement; label: string; badge?: number }[] = [
  { page: "dashboard", icon: DashboardSquare01Icon, label: "لوحة التحكم" },
  { page: "invoices", icon: Invoice03Icon, label: "الفواتير", badge: 2 },
  { page: "clients", icon: UserMultipleIcon, label: "العملاء" },
  { page: "expenses", icon: Money03Icon, label: "المصاريف" },
  { page: "zakat", icon: ZakatIcon, label: "الزكاة" },
  { page: "contracts", icon: Agreement01Icon, label: "العقود", badge: 1 },
  { page: "reports", icon: ChartBarLineIcon, label: "التقارير" },
  { page: "notifications", icon: Alert02Icon, label: "الإشعارات", badge: 3 },
  { page: "settings", icon: InformationCircleIcon, label: "الإعدادات" },
];

const PAGE_TITLES: Record<Page, { ar: string; sub: string }> = {
  dashboard: { ar: "لوحة التحكم", sub: "AHLAN — DASHBOARD" },
  invoices: { ar: "الفواتير", sub: "INVOICES" },
  clients: { ar: "العملاء", sub: "CLIENTS" },
  expenses: { ar: "المصاريف", sub: "EXPENSES" },
  zakat: { ar: "الزكاة", sub: "ZAKAT" },
  contracts: { ar: "العقود", sub: "CONTRACTS" },
  reports: { ar: "التقارير", sub: "REPORTS" },
  notifications: { ar: "الإشعارات", sub: "NOTIFICATIONS" },
  settings: { ar: "الإعدادات", sub: "SETTINGS" },
};

function SidebarPattern() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 200 600" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 8 }).map((_, r) => Array.from({ length: 6 }).map((__, c) => (
        <polygon key={`${r}-${c}`} points={`${c * 40 + 20},${r * 80 + 4} ${c * 40 + 36},${r * 80 + 12} ${c * 40 + 36},${r * 80 + 28} ${c * 40 + 20},${r * 80 + 36} ${c * 40 + 4},${r * 80 + 28} ${c * 40 + 4},${r * 80 + 12}`} fill="none" stroke="white" strokeWidth="0.6" />
      )))}
    </svg>
  );
}

function DesktopOnboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState("abdullahai");
  const [form, setForm] = useState({ name: "", business: "", type: "freelancer", currency: "USD", vat: "16" });
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", border: "1px solid #E8E5DE", borderRadius: 14, fontSize: 15, fontFamily: "var(--font-ar)", direction: "rtl", background: "#FAFAF8", outline: "none", color: "#1A1A18" };
  const steps = [
    {
      title: "مرحباً بك في مصرف",
      sub: "المستشار المالي الذكي للمستقلين العرب",
      content: (
        <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
          <div style={{ width: 90, height: 90, borderRadius: 24, background: "#F0F7F0", color: "#1B5E20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, margin: "0 auto 24px" }}>م</div>
          <div style={{ fontSize: 16, color: "#6B6B65", lineHeight: 1.9, maxWidth: 480, margin: "0 auto" }}>إدارة فواتيرك، عملائك، ومصاريفك، كل شيء بالعربي وبذكاء اصطناعي يفهم السياق الثقافي والإسلامي.</div>
        </div>
      ),
    },
    {
      title: "أخبرنا عنك",
      sub: "سنخصّص تجربتك بناءً على معلوماتك",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, width: "100%" }}>
          {[
            { k: "name", l: "اسمك الكامل", ph: "مثال: أحمد الشمري" },
            { k: "business", l: "اسم نشاطك التجاري", ph: "مثال: شمري للتصميم" },
          ].map((field) => (
            <label key={field.k} style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>{field.l}</span>
              <input value={form[field.k as "name" | "business"]} onChange={(e) => setForm((current) => ({ ...current, [field.k]: e.target.value }))} placeholder={field.ph} style={inputStyle} />
            </label>
          ))}
          <div>
            <div style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 8 }}>نوع النشاط</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ k: "freelancer", l: "مستقل" }, { k: "small_business", l: "شركة صغيرة" }, { k: "agency", l: "وكالة" }].map((type) => (
                <button key={type.k} onClick={() => setForm((current) => ({ ...current, type: type.k }))} style={{ flex: 1, background: form.type === type.k ? "#1B5E20" : "#F5F5F0", color: form.type === type.k ? "white" : "#1A1A18", border: "none", borderRadius: 12, padding: "10px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>{type.l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              <span style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>العملة</span>
              <select value={form.currency} onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value }))} style={inputStyle}>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="JOD">دينار أردني (JOD)</option>
              </select>
            </label>
            <label>
              <span style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>ضريبة القيمة المضافة</span>
              <input type="number" value={form.vat} onChange={(e) => setForm((current) => ({ ...current, vat: e.target.value }))} style={inputStyle} />
            </label>
          </div>
        </div>
      ),
    },
    {
      title: "اختر صوت مساعدك",
      sub: "سيُجيبك مصرف بهذا الصوت عند استخدام الأوامر الصوتية",
      content: (
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ k: "abdullahai", l: "عبدالله", sub: "صوت ذكوري" }, { k: "fatima", l: "فاطمة", sub: "صوت أنثوي" }].map((voice) => (
              <button key={voice.k} onClick={() => setPersona(voice.k)} style={{ padding: "18px 16px", border: `1px solid ${persona === voice.k ? "#7B1FA2" : "#E8E5DE"}`, background: persona === voice.k ? "#F3E5F5" : "#FAFAF8", color: persona === voice.k ? "#7B1FA2" : "#1A1A18", borderRadius: 16, cursor: "pointer", fontFamily: "var(--font-ar)", textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{voice.l}</div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{voice.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ background: "#F5F5F0", borderRadius: 14, padding: "14px 18px", marginTop: 20, fontSize: 13, color: "#6B6B65", lineHeight: 1.8 }}>جرّب قول: &quot;كم رصيدي؟&quot; أو &quot;أرسل فاتورة لأحمد بـ٥٠٠ دولار&quot;. سيرد عليك <strong style={{ color: "#7B1FA2" }}>{persona === "abdullahai" ? "عبدالله" : "فاطمة"}</strong> بصوت عربي طبيعي.</div>
        </div>
      ),
    },
  ];
  const current = steps[step];
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF8", position: "relative", overflow: "hidden", direction: "rtl", fontFamily: "var(--font-ar)" }}>
      <div style={{ color: "#1B5E20" }}><SidebarPattern /></div>
      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 80, alignItems: "center", maxWidth: 1100, width: "100%", padding: "0 60px" }}>
        <div style={{ flex: "0 0 340px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "#1B5E20", color: "#C6A35A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, marginBottom: 8 }}>م</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#1A1A18", lineHeight: 1.2 }}>{current.title}</div>
          <div style={{ fontSize: 15, color: "#6B6B65", marginTop: 6, lineHeight: 1.7 }}>{current.sub}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32 }}>
            {steps.map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i <= step ? "#1B5E20" : "#E8E5DE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: i <= step ? "white" : "#9C9C95", fontWeight: 800 }}>{i < step ? "✓" : i + 1}</div>
                <div style={{ fontSize: 13, color: i === step ? "#1A1A18" : "#9C9C95", fontWeight: i === step ? 800 : 500 }}>{["معلومات البداية", "ملفك الشخصي", "صوت المساعد"][i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 24, padding: "40px 48px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid #E8E5DE" }}>
          <div key={step} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeIn 0.22s ease-out" }}>{current.content}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 32, width: "100%", maxWidth: 480 }}>
            {step > 0 && <button onClick={() => setStep((value) => value - 1)} style={{ flex: 1, background: "#F5F5F0", color: "#1A1A18", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>رجوع</button>}
            <button onClick={() => step < steps.length - 1 ? setStep((value) => value + 1) : onDone()} style={{ flex: 2, background: "#1B5E20", color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>{step < steps.length - 1 ? "التالي" : "ابدأ استخدام مصرف ✓"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MasrafDesktopApp() {
  const [screen, setScreen] = useState<Page>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [currency, setCurrency] = useState(MASRAF_DATA.user.currency);
  const backendHealth = useBackendHealth();
  const backend = useMasrafBackend();
  const { toasts, toast } = useToast();
  const agentSessionData = useMemo(() => buildAgentSessionSnapshot(backend.data), [backend.data]);

  useEffect(() => {
    (globalThis as typeof globalThis & { MASRAF_CURRENCY?: string }).MASRAF_CURRENCY = currency;
  }, [currency]);

  useEffect(() => {
    Object.assign(MASRAF_DATA, backend.data);
    void Promise.resolve().then(() => setCurrency(backend.data.user.currency));
  }, [backend.data]);

  function navigate(page: string) {
    setScreen(page as Page);
  }

  const screenMap: Record<Page, React.ReactNode> = {
    dashboard: <DesktopDashboard onNavigate={navigate} toast={toast} />,
    invoices:  <DesktopInvoices  toast={toast} />,
    clients:   <DesktopClients   toast={toast} />,
    expenses:  <DesktopExpenses  toast={toast} />,
    zakat:     <DesktopZakat     toast={toast} />,
    contracts: <DesktopContracts toast={toast} />,
    reports:   <DesktopReports   toast={toast} />,
    notifications: <DesktopNotifications toast={toast} />,
    settings: <DesktopSettings toast={toast} currency={currency} onCurrencyChange={setCurrency} />,
  };

  if (showOnboarding) {
    return <DesktopOnboarding onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#FAFAF8", fontFamily: "var(--font-ar)", direction: "rtl", position: "relative", color: "#11100E" }}>
      <ToastContainer toasts={toasts} />

      <aside style={{ width: 260, background: "#0F3D29", color: "#F4EDE0", display: "flex", flexDirection: "column", flexShrink: 0, borderLeft: "1px solid rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
        <SidebarPattern />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#C6A35A", color: "#0F3D29", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, marginBottom: 14 }}>م</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#F4EDE0", letterSpacing: 0 }}>مصرف</div>
          <div style={{ fontSize: 11, color: "rgba(244,237,224,0.52)", marginTop: 4, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase" }}>Masraf · المستشار المالي الذكي</div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = screen === item.page;
            return (
              <button key={item.page} onClick={() => setScreen(item.page)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14, position: "relative",
                  padding: "12px 16px", background: "transparent",
                  border: "none", borderRadius: 10,
                  color: active ? "#C6A35A" : "rgba(244,237,224,0.62)",
                  cursor: "pointer", textAlign: "right", fontFamily: "var(--font-ar)",
                  fontSize: 15, fontWeight: active ? 900 : 600,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(198,163,90,0.08)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {active && <span style={{ position: "absolute", right: 0, top: 8, bottom: 8, width: 3, background: "#C6A35A", borderRadius: "0 3px 3px 0" }} />}
                <span style={{ width: 24, textAlign: "center", color: "inherit", opacity: 0.86 }}>
                  <MasrafIcon icon={item.icon} size={19} color="currentColor" strokeWidth={active ? 2.1 : 1.7} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? <span style={{ marginRight: "auto", background: "#C6A35A", color: "#0F3D29", fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 10 }}>{item.badge}</span> : null}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 12px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setVoiceOpen(true)} style={{ width: "100%", background: voiceOpen ? "#C6A35A" : "transparent", color: voiceOpen ? "#0F3D29" : "#C6A35A", border: "1px solid #C6A35A", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "var(--font-ar)", fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <MasrafIcon icon={AiVoiceIcon} size={18} color="currentColor" />
              تحدّث مع مصرف
            </span>
          </button>

          <div onClick={() => setScreen("settings")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(198,163,90,0.06)", cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#C6A35A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#0F3D29" }}>أش</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#F4EDE0" }}>أحمد الشمري</div>
              <div style={{ fontSize: 10, color: "rgba(244,237,224,0.52)" }}>شمري للتصميم</div>
            </div>
          </div>
        </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#FAFAF8" }}>
        <header style={{ height: 76, borderBottom: "1px solid #E8DFCF", background: "rgba(250,250,248,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", gap: 18, padding: "0 32px", flexShrink: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#2A2520", minWidth: 190 }}>
            {PAGE_TITLES[screen].ar}
            <div style={{ fontSize: 10, color: "#C6A35A", letterSpacing: 2.2, marginTop: 2, textTransform: "uppercase" }}>{PAGE_TITLES[screen].sub}</div>
          </div>
          <div style={{ flex: 1, maxWidth: 420, height: 42, borderRadius: 12, border: "1px solid #E8DFCF", background: "#FFFFFF", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
            <span style={{ color: "#B8AC97", fontSize: 16 }}>⌕</span>
            <input placeholder="ابحث..." style={{ background: "none", border: "none", outline: "none", fontSize: 13, fontFamily: "var(--font-ar)", color: "#2A2520", width: "100%", direction: "rtl" }} />
          </div>
          <div title={apiConfig.baseUrl} style={{ height: 42, background: backendHealth === "online" ? "#E8F5E9" : backendHealth === "offline" ? "#FFF3E0" : "#FFFFFF", border: "1px solid #E8DFCF", borderRadius: 12, padding: "0 12px", color: backendHealth === "online" ? "#1B5E20" : backendHealth === "offline" ? "#8A6400" : "#5C5346", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: backendHealth === "online" ? "#1B5E20" : backendHealth === "offline" ? "#E07A1F" : "#C6A35A" }} />
            {backendHealth === "online" ? "API" : backendHealth === "offline" ? "Mock" : "Ready"}
          </div>
          <button onClick={() => setScreen("notifications")} style={{ height: 42, background: "#FFFFFF", border: "1px solid #E8DFCF", borderRadius: 12, padding: "0 14px", color: "#5C5346", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)", display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            إشعارات
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B71C1C", boxShadow: "0 0 0 3px #FFEBEE" }} />
          </button>
          <button onClick={() => setScreen("settings")} style={{ height: 42, background: screen === "settings" ? "#0F3D29" : "#FFFFFF", border: "1px solid #E8DFCF", borderRadius: 12, padding: "0 16px", fontSize: 13, fontWeight: 800, color: screen === "settings" ? "#F4EDE0" : "#5C5346", cursor: "pointer", fontFamily: "var(--font-ar)" }}>الإعدادات</button>
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>
          <div key={`${screen}-${currency}`} style={{ animation: "fadeIn 0.2s ease-out" }}>
            {screenMap[screen]}
          </div>
        </div>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>

      {voiceOpen && (
        <VoiceOverlay
          currentScreen={screen}
          sessionData={agentSessionData}
          onClose={() => setVoiceOpen(false)}
          onCommand={(type, payload) => {
            if (type === "navigate") navigate(payload);
            if (type === "refresh") void backend.refetch();
            if (type !== "refresh") setVoiceOpen(false);
          }}
          currentScreen={screen}
        />
      )}
    </div>
  );
}
