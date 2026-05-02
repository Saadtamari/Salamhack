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
import { masrafApi } from "@/lib/api";
import type { AgentAction, AgentHistoryMessage, AgentPage, AgentRunResult } from "@/lib/api/types";
import { getRuntimeVoicePersona, type VoicePersona } from "@/lib/voice-preferences";
import { useMasrafApp } from "@/lib/masraf-context";
import { buildInvoiceHtml } from "@/lib/invoice-pdf";
import { MasrafIcon } from "./icons";

type Phase = "idle" | "listening" | "processing" | "responding" | "error";

export function VoiceOverlay({
  onClose,
  onCommand,
  currentScreen,
  sessionData,
  voicePersona,
}: {
  onClose: () => void;
  onCommand: (type: string, payload: string) => void;
  currentScreen?: string;
  sessionData?: Record<string, unknown>;
  voicePersona?: VoicePersona;
}) {
  const { profile, currency } = useMasrafApp();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("جاهزة");
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<{
    invoiceId: string; invoiceNumber: string; title: string; titleEn: string;
    totalAmount: number; subtotal: number; vatAmount: number; currency: string;
    dueDate: string | null; status: string; paymentTerms: string; pdfUrl: string | null;
  } | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(18).fill(6));
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationIdRef = useRef(`voice-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const historyRef = useRef<AgentHistoryMessage[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startRecording();
    }, 180);

    return () => {
      window.clearTimeout(timer);
      cleanupRecorder();
      audioRef.current?.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "listening") {
      const frame = window.requestAnimationFrame(() => setWaveHeights(Array(18).fill(6)));
      return () => window.cancelAnimationFrame(frame);
    }

    const interval = window.setInterval(() => {
      setWaveHeights(Array(18).fill(0).map(() => Math.random() * 22 + 5));
    }, 90);

    return () => window.clearInterval(interval);
  }, [phase]);

  async function startRecording() {
    setError(null);
    setTranscript("");
    setResult(null);
    setMessage("أستمع الآن...");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPhase("error");
      setError("التسجيل الصوتي غير مدعوم في هذا المتصفح.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void submitRecording();
      };

      recorder.start();
      setPhase("listening");
    } catch (caught) {
      setPhase("error");
      setError(caught instanceof Error ? caught.message : "تم رفض إذن الميكروفون.");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    setPhase("processing");
    setMessage("جاري المعالجة...");
    recorder.stop();
  }

  async function submitRecording() {
    const chunks = chunksRef.current;
    cleanupRecorder();

    if (chunks.length === 0) {
      setPhase("error");
      setError("لم يتم التقاط أي صوت.");
      return;
    }

    try {
      const type = chunks[0]?.type || "audio/webm";
      const blob = new Blob(chunks, { type });
      const file = new File([blob], `masraf-command-${Date.now()}.webm`, { type });
      const activeVoice = voicePersona ?? getRuntimeVoicePersona();
      const response = await masrafApi.voice.process(file, agentContext(), true, historyRef.current, activeVoice);
      const agent = response.agentResponse;

      setTranscript(response.transcript || "");
      setResult(agent ?? null);
      setMessage(agent?.message ?? response.aiResponse?.message ?? "تم.");
      setPhase("responding");
      playTts(response.audioBase64, response.audioContentType, agent?.message ?? response.aiResponse?.message);

      if (agent) {
        rememberTurn(response.transcript || "", agent.message);
        applyCommandSideEffects(agent, false);
      }
    } catch (caught) {
      setPhase("error");
      setError(caught instanceof Error ? caught.message : "فشل الأمر الصوتي.");
    }
  }

  async function confirmAction(approved: boolean) {
    const action = result?.action;
    if (!action) {
      return;
    }

    setPhase("processing");
    setMessage(approved ? "جاري التأكيد..." : "جاري الإلغاء...");

    try {
      const confirmed = await masrafApi.agent.command({
        context: agentContext(),
        executeAction: true,
        confirmation: {
          approved,
          action,
          idempotencyKey: `${Date.now()}-${action.tool}`,
        },
      });

      setResult(confirmed);
      setMessage(confirmed.message);
      setPhase("responding");
      applyCommandSideEffects(confirmed, approved);
    } catch (caught) {
      setPhase("error");
      setError(caught instanceof Error ? caught.message : "لم أتمكن من تأكيد الإجراء.");
    }
  }

  function applyCommandSideEffects(agent: AgentRunResult, confirmed: boolean) {
    const target = agent.actionResult?.targetScreen ?? agent.plan.targetScreen;

    if (agent.status === "executed") {
      onCommand("refresh", "");
    }

    if (agent.action?.tool === "invoices.download" && agent.status === "executed") {
      const d = agent.actionResult?.data as Record<string, unknown> | undefined;
      if (d?.invoiceId) {
        setDownloadReady({
          invoiceId: String(d.invoiceId),
          invoiceNumber: String(d.invoiceNumber ?? d.invoiceId),
          title: String(d.title ?? d.titleEn ?? d.invoiceNumber ?? ""),
          titleEn: String(d.titleEn ?? d.title ?? ""),
          totalAmount: Number(d.totalAmount ?? 0),
          subtotal: Number(d.subtotal ?? 0),
          vatAmount: Number(d.vatAmount ?? 0),
          currency: String(d.currency ?? currency),
          dueDate: d.dueDate ? String(d.dueDate) : null,
          status: String(d.status ?? "draft"),
          paymentTerms: String(d.paymentTerms ?? "net_30"),
          pdfUrl: d.pdfUrl ? String(d.pdfUrl) : null,
        });
      }
      return;
    }

    if (agent.action?.tool === "ui.navigate" && target) {
      onCommand("navigate", target);
      onClose();
      return;
    }

    if (confirmed && agent.status === "executed" && target) {
      onCommand("navigate", target);
      onClose();
    }
  }

  function agentContext() {
    return {
      screen: currentScreen,
      conversationId: conversationIdRef.current,
      data: sessionData,
    };
  }

  function rememberTurn(userMessage: string, assistantMessage: string) {
    const next = [...historyRef.current];
    if (userMessage.trim()) {
      next.push({ role: "user", content: userMessage.trim() });
    }
    if (assistantMessage.trim()) {
      next.push({ role: "assistant", content: assistantMessage.trim() });
    }
    historyRef.current = next.slice(-12);
  }

  function cleanupRecorder() {
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function speakWithBrowser(text: string) {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ar-SA";
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.startsWith("ar"));
    if (arVoice) utter.voice = arVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function playTts(base64?: string, contentType?: string, text?: string) {
    if (!base64) {
      speakWithBrowser(text ?? "");
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(`data:${contentType || "audio/wav"};base64,${base64}`);
    audioRef.current = audio;
    void audio.play().catch(() => speakWithBrowser(text ?? ""));
  }

  const pendingAction = result?.status === "needs_confirmation" ? result.action : null;
  const targetScreen = result?.actionResult?.targetScreen ?? result?.plan.targetScreen;
  const activeVoice = voicePersona ?? getRuntimeVoicePersona();
  const status = phase === "listening"
    ? "أستمع"
    : phase === "processing"
      ? "أعمل على طلبك"
      : phase === "error"
        ? "يحتاج انتباه"
        : result?.status === "needs_confirmation"
          ? "تأكيد الإجراء"
          : activeVoice === "fatima" ? "فاطمة · مساعدة مصرف" : "عبدالله · مساعد مصرف";
  const accent = phase === "responding" ? "#147A41" : phase === "processing" ? "#9C7614" : "#F0C542";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 220, pointerEvents: "none", fontFamily: "var(--font-ar)", direction: "rtl" }}>
      <div style={{ position: "absolute", left: "50%", bottom: 28, transform: "translateX(-50%)", width: "min(386px, calc(100% - 28px))", pointerEvents: "auto" }}>
        <div style={{ background: "rgba(255,253,248,0.97)", border: "1px solid #DDD6CA", borderRadius: 22, boxShadow: "0 22px 70px rgba(17,16,14,0.22)", backdropFilter: "blur(22px)", overflow: "hidden" }}>
          <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -5, borderRadius: "50%", background: `radial-gradient(circle, ${accent}55 0%, transparent 66%)`, filter: "blur(2px)", animation: phase === "listening" ? "voicePulse 1.6s ease-in-out infinite" : "none" }} />
              <div style={{ position: "relative", width: 54, height: 54, borderRadius: "50%", background: "#11100E", color: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 5px ${accent}22` }}>
                <MasrafIcon icon={phase === "responding" ? AiVoiceIcon : Mic01Icon} size={24} color="currentColor" />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ fontSize: 12, color: "#6D675E", fontWeight: 850 }}>{status}</div>
                <button onClick={onClose} style={iconButtonStyle}>
                  <MasrafIcon icon={Cancel01Icon} size={15} color="currentColor" strokeWidth={2} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
                {waveHeights.map((height, index) => (
                  <div key={index} style={{ width: 3, height, background: phase === "idle" ? "#DDD6CA" : "#11100E", opacity: phase === "processing" ? 0.45 : 0.85, borderRadius: 4, transition: "height 0.08s ease" }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px 16px", display: "grid", gap: 9 }}>
            {transcript && (
              <div style={panelStyle}>
                <div style={labelStyle}>النص المسموع</div>
                <div style={{ fontSize: 14, color: "#11100E", fontWeight: 800, lineHeight: 1.55, overflowWrap: "anywhere" }}>{transcript}</div>
              </div>
            )}

            {(message || error) && (
              <div style={{ ...panelStyle, background: phase === "error" ? "#FFF3F0" : "#FFFDF8" }}>
                <div style={labelStyle}>{phase === "error" ? "خطأ" : "الرد"}</div>
                <div style={{ fontSize: 15, color: phase === "error" ? "#B3261E" : "#11100E", lineHeight: 1.65, fontWeight: 800, overflowWrap: "anywhere" }}>
                  {error || message}
                </div>
              </div>
            )}

            {pendingAction && <ActionSummary action={pendingAction} targetScreen={targetScreen} />}

            <div style={{ display: "flex", gap: 8 }}>
              {phase === "listening" && (
                <button onClick={stopRecording} style={{ ...primaryButtonStyle, flex: 1 }}>
                  أوقف وأرسل
                </button>
              )}

              {(phase === "idle" || phase === "error" || phase === "responding") && !pendingAction && (
                <button onClick={() => void startRecording()} style={{ ...primaryButtonStyle, flex: 1 }}>
                  سجّل مرة أخرى
                </button>
              )}

              {pendingAction && (
                <>
                  <button onClick={() => void confirmAction(true)} style={{ ...primaryButtonStyle, flex: 1 }}>
                    تأكيد
                  </button>
                  <button onClick={() => void confirmAction(false)} style={secondaryButtonStyle}>
                    إلغاء
                  </button>
                </>
              )}

              {downloadReady && (
                <button
                  onClick={() => {
                    const win = window.open("", "_blank", "width=720,height=960");
                    if (!win) return;
                    const dr = downloadReady;
                    const sym: Record<string, string> = { USD: "$", SAR: "ر.س", AED: "د.إ", JOD: "د.أ", EGP: "ج.م", KWD: "د.ك" };
                    const html = buildInvoiceHtml({
                      id: dr.invoiceNumber,
                      client: dr.title,
                      clientEn: dr.titleEn,
                      amount: dr.totalAmount,
                      due: dr.dueDate ?? "—",
                      status: dr.status,
                      business: profile.business || "مصرف",
                      currency: dr.currency,
                      sym: sym[dr.currency] || dr.currency,
                      subtotal: dr.subtotal,
                      vat: dr.vatAmount,
                      terms: dr.paymentTerms,
                      description: dr.title,
                    });
                    win.document.write(html);
                    win.document.close();
                    win.focus();
                    setTimeout(() => win.print(), 450);
                  }}
                  style={{ ...primaryButtonStyle, flex: 1 }}
                >
                  تحميل فاتورة {downloadReady.invoiceNumber}
                </button>
              )}
            </div>
          </div>
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

function ActionSummary({ action, targetScreen }: { action: AgentAction; targetScreen?: AgentPage }) {
  return (
    <div style={{ background: "#F7F4EE", border: "1px solid #E7DFD2", borderRadius: 16, padding: "11px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={labelStyle}>الإجراء</div>
          <div style={{ fontSize: 14, color: "#11100E", fontWeight: 900 }}>{actionLabel(action.tool)}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 13, background: "#11100E", color: "#F0C542", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MasrafIcon icon={targetScreen === "invoices" ? Invoice03Icon : DashboardSquare01Icon} size={19} color="currentColor" />
        </div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {Object.entries(action.args).slice(0, 5).map(([key, value]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#2C2924", fontWeight: 700, minWidth: 0 }}>
            <MasrafIcon icon={CheckmarkCircle02Icon} size={15} color="#147A41" strokeWidth={2} />
            <span style={{ color: "#6D675E", flexShrink: 0 }}>{key}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(value)}</span>
          </div>
        ))}
      </div>
      {targetScreen && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6D675E", fontSize: 12, fontWeight: 800, marginTop: 9 }}>
          <MasrafIcon icon={LinkSquare02Icon} size={15} color="currentColor" />
          يفتح صفحة {targetScreen}
          <MasrafIcon icon={ArrowRight01Icon} size={14} color="currentColor" />
        </div>
      )}
    </div>
  );
}

function actionLabel(tool: string) {
  switch (tool) {
    case "transactions.create": return "تسجيل معاملة";
    case "transactions.list": return "مراجعة المعاملات";
    case "clients.create": return "إنشاء عميل";
    case "clients.find": return "البحث عن عميل";
    case "invoices.create_draft": return "إنشاء مسودة فاتورة";
    case "invoices.send": return "إرسال فاتورة";
    case "invoices.send_reminder": return "إرسال تذكير دفع";
    case "invoices.download": return "تحميل فاتورة PDF";
    case "zakat.calculate": return "حساب الزكاة";
    case "reports.generate": return "إنشاء تقرير";
    case "ui.navigate": return "التنقل";
    default: return tool;
  }
}

const iconButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  border: "1px solid #DDD6CA",
  background: "#F7F4EE",
  color: "#11100E",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle: React.CSSProperties = {
  background: "#F7F4EE",
  border: "1px solid #E7DFD2",
  borderRadius: 16,
  padding: "10px 12px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#92897C",
  fontWeight: 850,
  marginBottom: 3,
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#11100E",
  color: "#FFFDF8",
  border: "none",
  borderRadius: 11,
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "var(--font-ar)",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#F1EDE5",
  color: "#11100E",
  border: "1px solid #DDD6CA",
  borderRadius: 11,
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 850,
  cursor: "pointer",
  fontFamily: "var(--font-ar)",
};
