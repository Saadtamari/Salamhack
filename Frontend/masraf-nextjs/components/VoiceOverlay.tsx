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
import { apiConfig } from "@/lib/api/client";
import { masrafApi } from "@/lib/api/masraf-api";

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

export function VoiceOverlay({ onClose, onCommand, currentScreen }: {
  onClose: () => void;
  onCommand: (type: string, payload: string) => void;
  currentScreen?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(18).fill(6));
  const [cmdIdx, setCmdIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const realModeRef = useRef<boolean>(apiConfig.useBackend && typeof window !== "undefined" && typeof navigator !== "undefined" && !!navigator.mediaDevices);

  useEffect(() => {
    if (realModeRef.current) {
      timerRef.current = setTimeout(() => startRealRecording(), 320);
    } else {
      timerRef.current = setTimeout(() => startListening(), 420);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopRecorder();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopRecorder() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch { /* ignore */ }
    }
    recorder?.stream?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
  }

  async function startRealRecording() {
    setExpanded(false);
    setErrorMsg(null);
    setTranscript("");
    setResult(null);
    setPhase("listening");
    intervalRef.current = setInterval(() => {
      setWaveHeights(() => Array(18).fill(0).map(() => Math.random() * 22 + 5));
    }, 90);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recorder.stream.getTracks().forEach((track) => track.stop());
        if (blob.size > 0) {
          submitAudio(blob);
        } else {
          setPhase("idle");
          setErrorMsg("لم يتم تسجيل أي صوت.");
        }
      };
      recorder.start();
    } catch (error) {
      setPhase("idle");
      const message = error instanceof Error ? error.message : "تعذر الوصول إلى الميكروفون.";
      setErrorMsg(message);
      // Fallback to demo if mic fails
      realModeRef.current = false;
      timerRef.current = setTimeout(() => startListening(), 200);
    }
  }

  function stopAndSubmit() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWaveHeights(Array(18).fill(6));
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try { recorderRef.current.stop(); } catch { /* ignore */ }
    }
  }

  async function submitAudio(blob: Blob) {
    setPhase("processing");
    try {
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `voice.${ext}`, { type: blob.type || "audio/webm" });
      const result = await masrafApi.voice.process(file, currentScreen ? { screen: currentScreen } : undefined);
      const transcriptText = result?.transcript || "";
      const responseMessage = result?.response?.message || "";
      const action = result?.response?.action;

      setTranscript(transcriptText || "(لم يُسمع نص واضح)");
      setResult({
        message: responseMessage || "تم.",
        section: sectionForAction(action),
        page: pageForAction(action),
        changes: result?.response?.suggestions?.length ? result.response.suggestions : ["نُفذ الإجراء حسب طلبك"],
      });
      setPhase("responding");

      // Play TTS audio if available
      if (result?.audio?.base64) {
        try {
          const audio = new Audio(`data:${result.audio.contentType};base64,${result.audio.base64}`);
          audioElRef.current = audio;
          audio.play().catch(() => { /* autoplay blocked */ });
        } catch {
          // ignore
        }
      }

      // Auto-execute navigate action after a brief delay so user sees confirmation
      if (action?.type === "navigate" && action.screen) {
        timerRef.current = setTimeout(() => {
          onCommand("navigate", String(action.screen));
        }, 1400);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر معالجة الطلب.";
      setErrorMsg(message);
      setPhase("idle");
    }
  }

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
    setTranscript("");
    setResult(null);
    setExpanded(false);
    setErrorMsg(null);
    setPhase("idle");
    if (realModeRef.current) {
      timerRef.current = setTimeout(() => startRealRecording(), 200);
      return;
    }
    const next = (cmdIdx + 1) % COMMANDS.length;
    setCmdIdx(next);
    timerRef.current = setTimeout(() => startListening(next), 260);
  }

  const status = phase === "listening" ? (realModeRef.current ? "أستمع... اضغط للإرسال" : "أستمع...") : phase === "processing" ? "أراجع الطلب..." : phase === "responding" ? "تم التنفيذ" : "مصرف";
  const accent = phase === "responding" ? "#147A41" : phase === "processing" ? "#9C7614" : "#F0C542";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 220, pointerEvents: "none", fontFamily: "var(--font-ar)", direction: "rtl" }}>
      <div style={{ position: "absolute", left: "50%", bottom: expanded ? 26 : 82, transform: "translateX(-50%)", width: "min(352px, calc(100% - 28px))", pointerEvents: "auto" }}>
        <div style={{ background: "rgba(255,253,248,0.96)", border: "1px solid #DDD6CA", borderRadius: expanded ? 22 : 28, boxShadow: "0 22px 70px rgba(17,16,14,0.22)", backdropFilter: "blur(22px)", overflow: "hidden" }}>
          <div style={{ padding: expanded ? "16px 16px 12px" : "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -5, borderRadius: "50%", background: `radial-gradient(circle, ${accent}55 0%, transparent 66%)`, filter: "blur(2px)", animation: phase === "listening" ? "voicePulse 1.6s ease-in-out infinite" : "none" }} />
              <button
                onClick={realModeRef.current && phase === "listening" ? stopAndSubmit : undefined}
                aria-label={realModeRef.current && phase === "listening" ? "إيقاف التسجيل وإرسال" : "ميكروفون"}
                style={{ position: "relative", width: 54, height: 54, borderRadius: "50%", background: "#11100E", color: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 5px ${accent}22`, border: "none", cursor: realModeRef.current && phase === "listening" ? "pointer" : "default", padding: 0 }}>
                <MasrafIcon icon={phase === "responding" ? AiVoiceIcon : Mic01Icon} size={24} color="currentColor" />
              </button>
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

          {(transcript || result || errorMsg) && (
            <div style={{ padding: "0 16px 16px" }}>
              {errorMsg && !result && (
                <div style={{ background: "#FFF6F4", border: "1px solid #F5C9C0", borderRadius: 16, padding: "10px 12px", marginBottom: transcript || result ? 9 : 0 }}>
                  <div style={{ fontSize: 11, color: "#B33A20", fontWeight: 800, marginBottom: 3 }}>تعذر التنفيذ</div>
                  <div style={{ fontSize: 13, color: "#7A2515", fontWeight: 700, lineHeight: 1.6 }}>{errorMsg}</div>
                  <button onClick={tryNext} style={{ marginTop: 8, background: "#11100E", color: "#FFFDF8", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>
                    حاول مرة أخرى
                  </button>
                </div>
              )}
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

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return undefined;
}

function pageForAction(action?: { type?: string; screen?: string | null } | null): Page {
  const screen = action?.screen?.toLowerCase();
  const allowed: Page[] = ["dashboard", "invoices", "clients", "expenses", "zakat", "contracts", "reports"];
  if (screen && (allowed as string[]).includes(screen)) return screen as Page;
  return "dashboard";
}

function sectionForAction(action?: { type?: string; screen?: string | null } | null): string {
  const map: Record<string, string> = {
    dashboard: "لوحة التحكم",
    invoices: "الفواتير",
    clients: "العملاء",
    expenses: "المصاريف",
    zakat: "الزكاة",
    contracts: "العقود",
    reports: "التقارير",
  };
  const screen = action?.screen?.toLowerCase();
  if (screen && map[screen]) return map[screen];
  return "مصرف";
}
