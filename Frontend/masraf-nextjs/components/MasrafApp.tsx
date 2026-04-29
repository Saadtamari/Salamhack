"use client";
import React, { useState } from "react";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import {
  DashboardScreen, InvoicesScreen, ClientsScreen,
  ExpensesScreen, ZakatScreen, ContractsScreen, ReportsScreen,
} from "@/components/Screens";

type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports";

// ─── Onboarding ───────────────────────────────────────────────────────────────
function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "🕌", title: "مرحباً بك في مصرف",  sub: "المستشار المالي الذكي للمستقلين العرب",  body: "إدارة فواتيرك، عملائك، ومصاريفك — كل شيء بالعربي وبذكاء اصطناعي.", cta: "ابدأ الآن" },
    { icon: "🎤", title: "صوتك أمرك",           sub: "Jarvis بالعربي",                          body: 'قل: "كم رصيدي؟" أو "أرسل فاتورة لأحمد بـ٥٠٠ دولار" وسيتولى مصرف الباقي.', cta: "التالي" },
    { icon: "☪️", title: "شريعة أولاً",          sub: "تمويل إسلامي أصيل",                      body: "زكاة تلقائية، مرابحة، وتطهير المبالغ — كل شيء بمبادئ التمويل الإسلامي.",  cta: "ادخل التطبيق" },
  ];
  const s = steps[step];
  return (
    <div style={{ height: "100%", background: "#FAFAF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", fontFamily: "IBM Plex Sans Arabic, sans-serif", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 76, marginBottom: 28 }}>{s.icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#1A1A18", marginBottom: 8, lineHeight: 1.3 }}>{s.title}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1B5E20", marginBottom: 14 }}>{s.sub}</div>
      <div style={{ fontSize: 14, color: "#6B6B65", lineHeight: 1.85, maxWidth: 270, marginBottom: 44 }}>{s.body}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {steps.map((_, i) => <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? "#1B5E20" : "#E8E5DE", transition: "width 0.3s" }}></div>)}
      </div>
      <button onClick={() => step < steps.length - 1 ? setStep((s) => s + 1) : onDone()} style={{ background: "#1B5E20", color: "white", border: "none", borderRadius: 16, padding: "15px 0", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%", maxWidth: 300, fontFamily: "IBM Plex Sans Arabic" }}>{s.cta}</button>
      {step < steps.length - 1 && <button onClick={onDone} style={{ background: "none", border: "none", color: "#9C9C95", fontSize: 13, cursor: "pointer", marginTop: 14, fontFamily: "IBM Plex Sans Arabic" }}>تخطّ</button>}
    </div>
  );
}

// ─── More Drawer ──────────────────────────────────────────────────────────────
function MoreDrawer({ onNavigate, onClose }: { onNavigate: (page: string) => void; onClose: () => void }) {
  const items = [
    { icon: "🧮", label: "الزكاة",    page: "zakat",     sub: "احسب وأدّ زكاتك" },
    { icon: "📎", label: "العقود",    page: "contracts", sub: "تحليل العقود بالذكاء الاصطناعي" },
    { icon: "💸", label: "المصاريف", page: "expenses",  sub: "تتبع إنفاقك" },
    { icon: "📊", label: "التقارير", page: "reports",   sub: "ملخصات مالية شهرية" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 90, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", fontFamily: "IBM Plex Sans Arabic, sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#E8E5DE", borderRadius: 2, margin: "0 auto 20px" }}></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18", marginBottom: 16 }}>المزيد</div>
        {items.map((item) => (
          <button key={item.page} onClick={() => { onNavigate(item.page); onClose(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 0", background: "none", border: "none", borderBottom: "1px solid #F5F5F0", cursor: "pointer", textAlign: "right", fontFamily: "IBM Plex Sans Arabic" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#F5F5F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#9C9C95" }}>{item.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MasrafApp() {
  const [screen, setScreen]       = useState<"onboarding" | Page>("onboarding");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [moreOpen, setMoreOpen]   = useState(false);
  const { toasts, toast }         = useToast();

  function navigate(page: string) { setScreen(page as Page); }
  function handleVoiceCommand(type: string, payload: string) {
    if (type === "navigate") navigate(payload);
  }

  const screenMap: Record<Page, React.ReactNode> = {
    dashboard: <DashboardScreen onNavigate={navigate} showBalance={true} toast={toast} />,
    invoices:  <InvoicesScreen  onNavigate={navigate} toast={toast} />,
    clients:   <ClientsScreen   onNavigate={navigate} />,
    expenses:  <ExpensesScreen  toast={toast} />,
    zakat:     <ZakatScreen     toast={toast} />,
    contracts: <ContractsScreen />,
    reports:   <ReportsScreen />,
  };

  if (screen === "onboarding") {
    return (
      <div style={{ width: 390, height: 844, borderRadius: 48, overflow: "hidden", position: "relative", background: "#FAFAF8", boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)" }}>
        <OnboardingScreen onDone={() => setScreen("dashboard")} />
      </div>
    );
  }

  return (
    <div style={{ width: 390, height: 844, borderRadius: 48, overflow: "hidden", position: "relative", background: "#FAFAF8", boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)" }}>
      {/* Dynamic island */}
      <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 126, height: 37, borderRadius: 24, background: "#000", zIndex: 50 }} />

      {/* App shell */}
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FAFAF8", position: "relative", overflow: "hidden" }}>
        <ToastContainer toasts={toasts} />

        {/* Screen */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" as any }}>
          <div key={screen}>
            {screenMap[screen as Page] || screenMap.dashboard}
          </div>
        </div>

        {/* Bottom Nav */}
        <nav style={{ flexShrink: 0, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid #E8E5DE", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "8px 0 20px" }}>
          {[
            { page: "dashboard", icon: "🏠", label: "لوحة" },
            { page: "invoices",  icon: "🧾", label: "فواتير" },
          ].map((item) => (
            <button key={item.page} onClick={() => navigate(item.page)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 14px", fontFamily: "IBM Plex Sans Arabic, sans-serif", minWidth: 60 }}>
              <span style={{ fontSize: 22, transform: screen === item.page ? "scale(1.18)" : "scale(1)", transition: "transform 0.15s" }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: screen === item.page ? "#1B5E20" : "#9C9C95", fontWeight: screen === item.page ? 700 : 500 }}>{item.label}</span>
            </button>
          ))}

          <button onClick={() => setVoiceOpen(true)}
            style={{ width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg, #7B1FA2, #AB47BC)", border: "3px solid white", boxShadow: voiceOpen ? "0 4px 40px rgba(123,31,162,0.85), 0 0 0 10px rgba(123,31,162,0.12)" : "0 4px 20px rgba(123,31,162,0.45)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 24, marginTop: -20, flexShrink: 0 }}>🎤</button>

          {[
            { page: "clients", icon: "👥", label: "عملاء" },
            { page: "more",    icon: "☰",  label: "المزيد" },
          ].map((item) => (
            <button key={item.page} onClick={() => item.page === "more" ? setMoreOpen(true) : navigate(item.page)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 14px", fontFamily: "IBM Plex Sans Arabic, sans-serif", minWidth: 60 }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: screen === item.page ? "#1B5E20" : "#9C9C95", fontWeight: screen === item.page ? 700 : 500 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Voice overlay */}
        {voiceOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
            <VoiceOverlay onClose={() => setVoiceOpen(false)} onCommand={(t, p) => { handleVoiceCommand(t, p); setVoiceOpen(false); }} />
          </div>
        )}

        {/* More drawer */}
        {moreOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 90 }}>
            <MoreDrawer onNavigate={navigate} onClose={() => setMoreOpen(false)} />
          </div>
        )}

        {/* Home indicator */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60, height: 34, display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 8, pointerEvents: "none" }}>
          <div style={{ width: 139, height: 5, borderRadius: 100, background: "rgba(0,0,0,0.25)" }} />
        </div>
      </div>
    </div>
  );
}
