"use client";
import { Alert02Icon, Cancel01Icon, CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Toast } from "@/lib/useToast";
import { MasrafIcon } from "./icons";

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const iconFor = (type: string) => type === "success" ? CheckmarkCircle02Icon : type === "error" ? Cancel01Icon : type === "warning" ? Alert02Icon : InformationCircleIcon;
  return (
    <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, display: "flex", flexDirection: "column", gap: 8, width: "90%", maxWidth: 360, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "success" ? "#11100E" : t.type === "error" ? "#B3261E" : t.type === "warning" ? "#8A6400" : "#11100E",
          color: "white", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 600,
          fontFamily: "IBM Plex Sans Arabic, sans-serif", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 10, pointerEvents: "all",
          animation: "toastSlide 0.3s ease-out",
        }}>
          <MasrafIcon icon={iconFor(t.type)} size={18} color="currentColor" strokeWidth={2} />
          <div style={{ flex: 1 }}>
            {t.title && <div style={{ fontWeight: 700 }}>{t.title}</div>}
            <div style={{ opacity: 0.9, fontSize: 12 }}>{t.message}</div>
          </div>
        </div>
      ))}
      <style>{`@keyframes toastSlide { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
