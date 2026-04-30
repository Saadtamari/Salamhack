"use client";
import React, { useState } from "react";
import {
  Agreement01Icon,
  AiVoiceIcon,
  ChartBarLineIcon,
  DashboardSquare01Icon,
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
import {
  DesktopDashboard, DesktopInvoices, DesktopClients,
  DesktopExpenses, DesktopZakat, DesktopContracts, DesktopReports,
} from "@/components/DesktopScreens";

type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports";

const NAV_ITEMS: { page: Page; icon: IconSvgElement; label: string }[] = [
  { page: "dashboard", icon: DashboardSquare01Icon, label: "لوحة التحكم" },
  { page: "invoices", icon: Invoice03Icon, label: "الفواتير" },
  { page: "clients", icon: UserMultipleIcon, label: "العملاء" },
  { page: "expenses", icon: Money03Icon, label: "المصاريف" },
  { page: "zakat", icon: ZakatIcon, label: "الزكاة" },
  { page: "contracts", icon: Agreement01Icon, label: "العقود" },
  { page: "reports", icon: ChartBarLineIcon, label: "التقارير" },
];

export default function MasrafDesktopApp() {
  const [screen, setScreen] = useState<Page>("dashboard");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const { toasts, toast } = useToast();

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
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F7F4EE", fontFamily: "var(--font-ar)", direction: "rtl", position: "relative", color: "#11100E" }}>
      <ToastContainer toasts={toasts} />

      <aside style={{ width: 248, background: "#11100E", color: "#FFFDF8", display: "flex", flexDirection: "column", padding: "28px 0", flexShrink: 0, borderLeft: "1px solid rgba(255,253,248,0.08)" }}>
        <div style={{ padding: "0 24px 32px" }}>
          <div style={{ fontSize: 27, fontWeight: 900, color: "#FFFDF8", letterSpacing: 0 }}>مصرف</div>
          <div style={{ fontSize: 12, color: "rgba(255,253,248,0.58)", marginTop: 4, lineHeight: 1.5 }}>Masraf · المستقلون العرب</div>
        </div>

        <nav style={{ flex: 1, padding: "0 12px" }}>
          {NAV_ITEMS.map((item) => {
            const active = screen === item.page;
            return (
              <button key={item.page} onClick={() => setScreen(item.page)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: active ? "rgba(255,253,248,0.10)" : "transparent",
                  border: "none", borderRadius: 10,
                  color: active ? "#FFFDF8" : "rgba(255,253,248,0.60)",
                  cursor: "pointer", textAlign: "right", fontFamily: "var(--font-ar)",
                  fontSize: 15, fontWeight: active ? 850 : 650,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,253,248,0.06)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ color: active ? "#F0C542" : "currentColor" }}>
                  <MasrafIcon icon={item.icon} size={20} color="currentColor" strokeWidth={active ? 2 : 1.7} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,253,248,0.10)" }}>
          <button onClick={() => setVoiceOpen(true)} style={{ width: "100%", background: "#FFFDF8", color: "#11100E", border: "none", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer", fontFamily: "var(--font-ar)", fontWeight: 850, boxShadow: "0 0 0 4px rgba(240,197,66,0.10)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <MasrafIcon icon={AiVoiceIcon} size={20} color="#11100E" />
              المساعد الصوتي
            </span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F0C542" }} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F0C542", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#11100E" }}>أش</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 850, color: "#FFFDF8" }}>أحمد الشمري</div>
              <div style={{ fontSize: 12, color: "rgba(255,253,248,0.55)" }}>شمري للتصميم</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", padding: "32px", background: "#F7F4EE" }}>
        <div key={screen} style={{ animation: "fadeIn 0.2s ease-out" }}>
          {screenMap[screen]}
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
          onClose={() => setVoiceOpen(false)}
          onCommand={(type, payload) => {
            if (type === "navigate") navigate(payload);
            setVoiceOpen(false);
          }}
        />
      )}
    </div>
  );
}
