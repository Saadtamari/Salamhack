"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  AiVoiceIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  DashboardSquare01Icon,
  Invoice03Icon,
  LinkSquare02Icon,
  Mic01Icon,
} from "@hugeicons/core-free-icons";
import { MasrafIcon } from "./icons";

const COMMANDS = [
  "كم رصيدي؟",
  "أرسل فاتورة لشركة النجوم بمبلغ ٥٠٠ دولار",
  "ذكّر شركة النجوم بفاتورتها المتأخرة",
  "كم صرفت هذا الشهر؟",
  "احسب زكاتي",
  "خذني للفواتير",
  "مين أسوأ عميل عندي؟",
];

type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports";
type Phase = "idle" | "listening" | "processing" | "responding";

type VoiceResult = {
  message: string;
  section: string;
  page: Page;
  changes: string[];
};

const RESULTS: VoiceResult[] = [
  {
    message: "رصيدك الحالي ١٢,٨٤٠ دولار، والدخل هذا الشهر أعلى من الشهر الماضي.",
    section: "لوحة التحكم",
    page: "dashboard",
    changes: ["قراءة الرصيد من بطاقة الملخص", "مراجعة اتجاه الدخل والمصاريف", "لم يتم تعديل أي بيانات"],
  },
  {
    message: "تم تجهيز فاتورة INV-2026-024 لشركة النجوم بمبلغ ٥٠٠ دولار.",
    section: "الفواتير",
    page: "invoices",
    changes: ["إضافة مسودة فاتورة في قسم الفواتير", "تحديد العميل: شركة النجوم", "تعيين المبلغ: ٥٠٠ دولار"],
  },
  {
    message: "تم تجهيز رسالة متابعة مختصرة للفاتورة المتأخرة.",
    section: "الفواتير",
    page: "invoices",
    changes: ["فتح حالة التحصيل للفاتورة المتأخرة", "إنشاء نص تذكير مهذب", "ربط الإجراء بسجل العميل"],
  },
  {
    message: "مصروفاتك هذا الشهر ٢٤٧ دولار، وأكبر بند هو البرمجيات والأدوات.",
    section: "المصاريف",
    page: "expenses",
    changes: ["قراءة إجمالي مصاريف الشهر", "ترتيب البنود حسب الأعلى تكلفة", "لم يتم تعديل أي بيانات"],
  },
  {
    message: "زكاتك المستحقة ٣٢١ دولار بناءً على الوعاء الزكوي الحالي.",
    section: "الزكاة",
    page: "zakat",
    changes: ["احتساب الوعاء الزكوي", "تطبيق نسبة ٢.٥٪", "إظهار المبلغ المستحق في قسم الزكاة"],
  },
  {
    message: "جاهز. افتح قسم الفواتير من زر التفاصيل.",
    section: "الفواتير",
    page: "invoices",
    changes: ["تحديد الوجهة المطلوبة", "تجهيز انتقال مباشر إلى قسم الفواتير", "لم يتم تنفيذ الانتقال إلا عند الضغط"],
  },
  {
    message: "شركة النجوم هي الأعلى خطورة بسبب مبلغ متأخر وعدد أيام التأخير.",
    section: "العملاء",
    page: "clients",
    changes: ["مراجعة درجات المخاطر", "تحديد العميل الأعلى خطورة", "عرض سبب التصنيف"],
  },
];

export function VoiceOverlay({ onClose, onCommand }: {
  onClose: () => void;
  onCommand: (type: string, payload: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(18).fill(6));
  const [cmdIdx, setCmdIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => startListening(), 420);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startListening(index = cmdIdx) {
    setExpanded(false);
    setPhase("listening");
    intervalRef.current = setInterval(() => {
      setWaveHeights(() => Array(18).fill(0).map(() => Math.random() * 22 + 5));
    }, 90);

    const cmd = COMMANDS[index];
    let i = 0;
    const typeInterval = setInterval(() => {
      setTranscript(cmd.slice(0, ++i));
      if (i >= cmd.length) {
        clearInterval(typeInterval);
        timerRef.current = setTimeout(() => startProcessing(index), 650);
      }
    }, 52);
  }

  function startProcessing(index = cmdIdx) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWaveHeights(Array(18).fill(6));
    setPhase("processing");
    timerRef.current = setTimeout(() => {
      setResult(RESULTS[index]);
      setPhase("responding");
    }, 1100);
  }

  function tryNext() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = (cmdIdx + 1) % COMMANDS.length;
    setCmdIdx(next);
    setTranscript("");
    setResult(null);
    setExpanded(false);
    setPhase("idle");
    timerRef.current = setTimeout(() => startListening(next), 260);
  }

  const status = phase === "listening" ? "أستمع..." : phase === "processing" ? "أراجع الطلب..." : phase === "responding" ? "تم التنفيذ" : "مصرف";
  const accent = phase === "responding" ? "#147A41" : phase === "processing" ? "#9C7614" : "#F0C542";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 220, pointerEvents: "none", fontFamily: "var(--font-ar)", direction: "rtl" }}>
      <div style={{ position: "absolute", left: "50%", bottom: expanded ? 26 : 82, transform: "translateX(-50%)", width: "min(352px, calc(100% - 28px))", pointerEvents: "auto" }}>
        <div style={{ background: "rgba(255,253,248,0.96)", border: "1px solid #DDD6CA", borderRadius: expanded ? 22 : 28, boxShadow: "0 22px 70px rgba(17,16,14,0.22)", backdropFilter: "blur(22px)", overflow: "hidden" }}>
          <div style={{ padding: expanded ? "16px 16px 12px" : "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -5, borderRadius: "50%", background: `radial-gradient(circle, ${accent}55 0%, transparent 66%)`, filter: "blur(2px)", animation: phase === "listening" ? "voicePulse 1.6s ease-in-out infinite" : "none" }} />
              <div style={{ position: "relative", width: 54, height: 54, borderRadius: "50%", background: "#11100E", color: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 5px ${accent}22` }}>
                <MasrafIcon icon={phase === "responding" ? AiVoiceIcon : Mic01Icon} size={24} color="currentColor" />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ fontSize: 12, color: "#6D675E", fontWeight: 800 }}>{status}</div>
                <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 10, border: "1px solid #DDD6CA", background: "#F7F4EE", color: "#11100E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MasrafIcon icon={Cancel01Icon} size={15} color="currentColor" strokeWidth={2} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
                {waveHeights.map((h, i) => (
                  <div key={i} style={{ width: 3, height: phase === "listening" ? h : 6, background: phase === "idle" ? "#DDD6CA" : "#11100E", opacity: phase === "processing" ? 0.45 : 0.85, borderRadius: 4, transition: "height 0.08s ease" }} />
                ))}
              </div>
            </div>
          </div>

          {(transcript || result) && (
            <div style={{ padding: "0 16px 16px" }}>
              {transcript && (
                <div style={{ background: "#F7F4EE", border: "1px solid #E7DFD2", borderRadius: 16, padding: "10px 12px", marginBottom: result ? 9 : 0 }}>
                  <div style={{ fontSize: 11, color: "#92897C", fontWeight: 800, marginBottom: 3 }}>قلت</div>
                  <div style={{ fontSize: 15, color: "#11100E", fontWeight: 800, lineHeight: 1.55 }}>{transcript}</div>
                </div>
              )}

              {result && (
                <div style={{ background: "#FFFDF8", border: "1px solid #DDD6CA", borderRadius: 16, padding: "11px 12px" }}>
                  <div style={{ fontSize: 14, color: "#11100E", lineHeight: 1.7, fontWeight: 750 }}>{result.message}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => setExpanded((v) => !v)} style={{ flex: 1, background: "#11100E", color: "#FFFDF8", border: "none", borderRadius: 11, padding: "10px 12px", fontSize: 13, fontWeight: 850, cursor: "pointer", fontFamily: "var(--font-ar)" }}>
                      {expanded ? "إخفاء التفاصيل" : "تفاصيل الأمر"}
                    </button>
                    <button onClick={tryNext} style={{ background: "#F1EDE5", color: "#11100E", border: "1px solid #DDD6CA", borderRadius: 11, padding: "10px 12px", fontSize: 13, fontWeight: 850, cursor: "pointer", fontFamily: "var(--font-ar)" }}>
                      أمر آخر
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {expanded && result && (
            <div style={{ borderTop: "1px solid #DDD6CA", padding: "14px 16px 16px", background: "#F7F4EE" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#92897C", fontWeight: 800 }}>سيظهر في</div>
                  <div style={{ fontSize: 16, color: "#11100E", fontWeight: 900 }}>{result.section}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: "#11100E", color: "#F0C542", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MasrafIcon icon={result.page === "invoices" ? Invoice03Icon : DashboardSquare01Icon} size={21} color="currentColor" />
                </div>
              </div>

              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                {result.changes.map((change) => (
                  <div key={change} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2C2924", fontWeight: 700 }}>
                    <MasrafIcon icon={CheckmarkCircle02Icon} size={16} color="#147A41" strokeWidth={2} />
                    <span>{change}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => onCommand("navigate", result.page)} style={{ width: "100%", background: "#FFFDF8", color: "#11100E", border: "1px solid #DDD6CA", borderRadius: 12, padding: "11px 12px", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "var(--font-ar)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <MasrafIcon icon={LinkSquare02Icon} size={18} color="currentColor" />
                افتح قسم {result.section}
                <MasrafIcon icon={ArrowRight01Icon} size={16} color="currentColor" />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes voicePulse {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.16); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
