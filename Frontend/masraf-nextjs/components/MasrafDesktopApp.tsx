"use client";
import React, { useState } from "react";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/ToastContainer";
import {
  DesktopDashboard, DesktopInvoices, DesktopClients,
  DesktopExpenses, DesktopZakat, DesktopContracts, DesktopReports,
} from "@/components/DesktopScreens";

type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports";

const NAV_ITEMS = [
  { page: "dashboard" as Page, icon: "🏠", label: "لوحة التحكم" },
  { page: "invoices"  as Page, icon: "🧾", label: "الفواتير"    },
  { page: "clients"   as Page, icon: "👥", label: "العملاء"     },
  { page: "expenses"  as Page, icon: "💸", label: "المصاريف"    },
  { page: "zakat"     as Page, icon: "🧮", label: "الزكاة"      },
  { page: "contracts" as Page, icon: "📎", label: "العقود"      },
  { page: "reports"   as Page, icon: "📊", label: "التقارير"    },
];

export default function MasrafDesktopApp() {
  const [screen, setScreen] = useState<Page>("dashboard");
  const { toasts, toast }   = useToast();

  const screenMap: Record<Page, React.ReactNode> = {
    dashboard: <DesktopDashboard onNavigate={(p) => setScreen(p as Page)} toast={toast} />,
    invoices:  <DesktopInvoices  toast={toast} />,
    clients:   <DesktopClients   toast={toast} />,
    expenses:  <DesktopExpenses  toast={toast} />,
    zakat:     <DesktopZakat     toast={toast} />,
    contracts: <DesktopContracts toast={toast} />,
    reports:   <DesktopReports   toast={toast} />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F5F5F0", fontFamily: "IBM Plex Sans Arabic, sans-serif", direction: "rtl", position: "relative" }}>
      <ToastContainer toasts={toasts} />

      {/* Sidebar */}
      <aside style={{ width: 240, background: "#1B5E20", display: "flex", flexDirection: "column", padding: "28px 0", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "0 24px 32px" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px" }}>مصرف</div>
          <div style={{ fontSize: 11, color: "#A5D6A7", marginTop: 2 }}>Masraf · المستقلون العرب</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.page} onClick={() => setScreen(item.page)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 24px", background: screen === item.page ? "rgba(255,255,255,0.15)" : "transparent",
                border: "none", borderRight: screen === item.page ? "3px solid #FFFFFF" : "3px solid transparent",
                color: screen === item.page ? "#FFFFFF" : "#A5D6A7",
                cursor: "pointer", textAlign: "right", fontFamily: "IBM Plex Sans Arabic, sans-serif",
                fontSize: 14, fontWeight: screen === item.page ? 700 : 400,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (screen !== item.page) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { if (screen !== item.page) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>أش</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>أحمد الشمري</div>
              <div style={{ fontSize: 11, color: "#A5D6A7" }}>شمري للتصميم</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", padding: "32px" }}>
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
    </div>
  );
}
