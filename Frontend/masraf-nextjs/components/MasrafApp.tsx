"use client";
import React, { useMemo, useState } from "react";
import {
  Agreement01Icon,
  AiVoiceIcon,
  Alert02Icon,
  ChartBarLineIcon,
  Home01Icon,
  InformationCircleIcon,
  Invoice03Icon,
  Menu01Icon,
  Mic01Icon,
  Money03Icon,
  UserMultipleIcon,
  Wallet02Icon,
  ZakatIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import { MasrafIcon } from "@/components/icons";
import { buildAgentSessionSnapshot } from "@/lib/api/agent-context";
import { MasrafProvider, useMasrafApp } from "@/lib/masraf-context";
import {
  DashboardScreen, InvoicesScreen, ClientsScreen,
  ExpensesScreen, ZakatScreen, ContractsScreen, ReportsScreen,
  NotificationsScreen, SettingsScreen,
} from "@/components/Screens";

type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports" | "notifications" | "settings";

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps: { icon: IconSvgElement; title: string; sub: string; body: string; cta: string }[] = [
    { icon: Wallet02Icon, title: "مرحباً بك في مصرف", sub: "هوية مالية عربية هادئة", body: "إدارة فواتيرك، عملائك، ومصاريفك بواجهة واضحة وقوية، مصممة للمستقل العربي.", cta: "ابدأ الآن" },
    { icon: AiVoiceIcon, title: "صوتك أمر واضح", sub: "مساعد مختصر وعملي", body: 'قل: "كم رصيدي؟" أو "أرسل فاتورة" وسيعرض مصرف ما حدث وأين تم التغيير.', cta: "التالي" },
    { icon: ZakatIcon, title: "شريعة أولاً", sub: "زكاة ومراجعة مالية", body: "زكاة تلقائية، متابعة تحصيل، وتنبيهات بسيطة بلا ألوان مزعجة أو ازدحام بصري.", cta: "ادخل التطبيق" },
  ];
  const s = steps[step];

  return (
    <div style={{ height: "100%", background: "#FAFAF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", fontFamily: "var(--font-ar)", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ width: 88, height: 88, borderRadius: 22, background: "#1B5E20", color: "#F0C542", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 18px 40px rgba(27,94,32,0.22)" }}>
        <MasrafIcon icon={s.icon} size={40} color="currentColor" strokeWidth={1.7} />
      </div>
      <div style={{ fontSize: 27, fontWeight: 900, color: "#11100E", marginBottom: 8, lineHeight: 1.25 }}>{s.title}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#9C7614", marginBottom: 14 }}>{s.sub}</div>
      <div style={{ fontSize: 15, color: "#6D675E", lineHeight: 1.9, maxWidth: 292, marginBottom: 44 }}>{s.body}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {steps.map((_, i) => <div key={i} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 4, background: i === step ? "#1B5E20" : "#DDD6CA", transition: "width 0.3s" }} />)}
      </div>
      <button onClick={() => step < steps.length - 1 ? setStep((v) => v + 1) : onDone()} style={{ background: "#1B5E20", color: "#FFFDF8", border: "none", borderRadius: 12, padding: "15px 0", fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%", maxWidth: 300, fontFamily: "var(--font-ar)" }}>{s.cta}</button>
      {step < steps.length - 1 && <button onClick={onDone} style={{ background: "none", border: "none", color: "#8A8276", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 14, fontFamily: "var(--font-ar)" }}>تخطّ</button>}
    </div>
  );
}

export default function MasrafApp() {
  return (
    <MasrafProvider>
      <MasrafAppShell />
    </MasrafProvider>
  );
}

function MoreDrawer({ onNavigate, onClose }: { onNavigate: (page: string) => void; onClose: () => void }) {
  const items: { icon: IconSvgElement; label: string; page: Page; sub: string }[] = [
    { icon: ZakatIcon, label: "الزكاة", page: "zakat", sub: "احسب وأدّ زكاتك" },
    { icon: Agreement01Icon, label: "العقود", page: "contracts", sub: "تحليل العقود بهدوء ووضوح" },
    { icon: Money03Icon, label: "المصاريف", page: "expenses", sub: "تتبع إنفاقك" },
    { icon: ChartBarLineIcon, label: "التقارير", page: "reports", sub: "ملخصات مالية شهرية" },
    { icon: Alert02Icon, label: "الإشعارات", page: "notifications", sub: "تنبيهات عاجلة ومهام مهمة" },
    { icon: InformationCircleIcon, label: "الإعدادات", page: "settings", sub: "الحساب والثيم والتنبيهات" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(17,16,14,0.34)", zIndex: 90, display: "flex", alignItems: "flex-end", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: "#FFFDF8", borderRadius: "22px 22px 0 0", borderTop: "1px solid #DDD6CA", padding: "20px 20px 32px", width: "100%", fontFamily: "var(--font-ar)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#DDD6CA", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 17, fontWeight: 900, color: "#11100E", marginBottom: 16 }}>المزيد</div>
        {items.map((item) => (
          <button key={item.page} onClick={() => { onNavigate(item.page); onClose(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 0", background: "none", border: "none", borderBottom: "1px solid #F1EDE5", cursor: "pointer", textAlign: "right", fontFamily: "var(--font-ar)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F1EDE5", border: "1px solid #DDD6CA", color: "#11100E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MasrafIcon icon={item.icon} size={22} color="currentColor" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E" }}>{item.label}</div>
              <div style={{ fontSize: 13, color: "#6D675E", marginTop: 1 }}>{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MasrafAppShell() {
  const [screen, setScreen] = useState<"onboarding" | Page>("onboarding");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { data, refetch, currency, voicePersona, usingMock, error } = useMasrafApp();
  const { toasts, toast } = useToast();
  const agentSessionData = useMemo(() => buildAgentSessionSnapshot(data, currency), [data, currency]);

  function navigate(page: string) { setScreen(page as Page); }
  function handleVoiceCommand(type: string, payload: string) {
    if (type === "navigate") navigate(payload);
    if (type === "refresh") void refetch();
  }

  const screenMap: Record<Page, React.ReactNode> = {
    dashboard: <DashboardScreen onNavigate={navigate} showBalance={true} toast={toast} />,
    invoices:  <InvoicesScreen  onNavigate={navigate} toast={toast} />,
    clients:   <ClientsScreen   onNavigate={navigate} />,
    expenses:  <ExpensesScreen  toast={toast} />,
    zakat:     <ZakatScreen     toast={toast} />,
    contracts: <ContractsScreen />,
    reports:   <ReportsScreen />,
    notifications: <NotificationsScreen toast={toast} onNavigate={navigate} />,
    settings: <SettingsScreen toast={toast} />,
  };

  const navItems: { page: Page | "more"; icon: IconSvgElement; label: string }[] = [
    { page: "dashboard", icon: Home01Icon, label: "لوحة" },
    { page: "invoices", icon: Invoice03Icon, label: "فواتير" },
    { page: "clients", icon: UserMultipleIcon, label: "عملاء" },
    { page: "more", icon: Menu01Icon, label: "المزيد" },
  ];

  const phoneShell: React.CSSProperties = {
    width: 390,
    height: 844,
    borderRadius: 48,
    overflow: "hidden",
    position: "relative",
    background: "#FAFAF8",
    boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.16)",
  };

  if (screen === "onboarding") {
    return (
      <div style={phoneShell}>
        <OnboardingScreen onDone={() => setScreen("dashboard")} />
      </div>
    );
  }

  return (
    <div style={phoneShell}>
      <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 126, height: 37, borderRadius: 24, background: "#000", zIndex: 50 }} />

      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FAFAF8", position: "relative", overflow: "hidden" }}>
        <ToastContainer toasts={toasts} />

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
          {(error || usingMock) && (
            <div style={{ margin: "52px 14px 0", background: error ? "#FFF9E8" : "#F0F7F0", border: `1px solid ${error ? "#FFE0A3" : "#C8E6C9"}`, color: error ? "#8A6400" : "#1B5E20", borderRadius: 12, padding: "9px 12px", fontSize: 11, fontWeight: 800, fontFamily: "var(--font-ar)", position: "relative", zIndex: 2 }}>
              {error ? "بيانات جزئية من الخلفية" : "وضع العرض التجريبي"}
            </div>
          )}
          <div key={screen}>
            {screenMap[screen as Page] || screenMap.dashboard}
          </div>
        </div>

        <nav style={{ flexShrink: 0, background: "rgba(255,253,248,0.96)", backdropFilter: "blur(18px)", borderTop: "1px solid #DDD6CA", display: "grid", gridTemplateColumns: "1fr 1fr 72px 1fr 1fr", alignItems: "center", padding: "8px 10px 20px" }}>
          {navItems.slice(0, 2).map((item) => {
            const active = screen === item.page;
            return (
              <button key={item.page} onClick={() => navigate(item.page)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", fontFamily: "var(--font-ar)", color: active ? "#11100E" : "#6D675E" }}>
                <MasrafIcon icon={item.icon} size={22} color="currentColor" strokeWidth={active ? 2.1 : 1.8} />
                <span style={{ fontSize: 11, fontWeight: active ? 900 : 700 }}>{item.label}</span>
              </button>
            );
          })}

          <button onClick={() => setVoiceOpen(true)}
            style={{ width: 58, height: 58, borderRadius: "50%", background: "#1B5E20", border: "3px solid #FFFDF8", boxShadow: voiceOpen ? "0 0 0 8px rgba(240,197,66,0.18), 0 12px 32px rgba(27,94,32,0.36)" : "0 0 0 5px rgba(240,197,66,0.14), 0 10px 26px rgba(27,94,32,0.30)", color: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: -20, flexShrink: 0 }}>
            <MasrafIcon icon={Mic01Icon} size={24} color="currentColor" strokeWidth={1.9} />
          </button>

          {navItems.slice(2).map((item) => {
            const active = screen === item.page;
            return (
              <button key={item.page} onClick={() => item.page === "more" ? setMoreOpen(true) : navigate(item.page)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", fontFamily: "var(--font-ar)", color: active ? "#11100E" : "#6D675E" }}>
                <MasrafIcon icon={item.icon} size={22} color="currentColor" strokeWidth={active ? 2.1 : 1.8} />
                <span style={{ fontSize: 11, fontWeight: active ? 900 : 700 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {voiceOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 100, pointerEvents: "none" }}>
            <VoiceOverlay currentScreen={screen} sessionData={agentSessionData} voicePersona={voicePersona} onClose={() => setVoiceOpen(false)} onCommand={(t, p) => { handleVoiceCommand(t, p); if (t !== "refresh") setVoiceOpen(false); }} />
          </div>
        )}

        {moreOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 90 }}>
            <MoreDrawer onNavigate={navigate} onClose={() => setMoreOpen(false)} />
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60, height: 34, display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 8, pointerEvents: "none" }}>
          <div style={{ width: 139, height: 5, borderRadius: 100, background: "rgba(17,16,14,0.25)" }} />
        </div>
      </div>
    </div>
  );
}
