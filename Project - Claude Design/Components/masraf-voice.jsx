// ─── Voice Overlay ────────────────────────────────────────────────────────────
const { useState, useEffect, useRef } = React;

function VoiceOverlay({ onClose, onCommand }) {
  const [phase, setPhase] = useState("idle"); // idle | listening | processing | responding
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [waveHeights, setWaveHeights] = useState(Array(24).fill(4));
  const [cmdIdx, setCmdIdx] = useState(0);
  const timerRef = useRef(null);

  const COMMANDS = window.MASRAF_DATA.voiceCommands;

  useEffect(() => {
    // Start listening after mount
    timerRef.current = setTimeout(() => startListening(), 400);
    return () => clearTimeout(timerRef.current);
  }, []);

  function startListening() {
    setPhase("listening");
    animateWave();
    // Simulate speech recognition
    const cmd = COMMANDS[cmdIdx];
    let i = 0;
    const typeInterval = setInterval(() => {
      setTranscript(cmd.slice(0, ++i));
      if (i >= cmd.length) {
        clearInterval(typeInterval);
        setTimeout(() => startProcessing(cmd), 600);
      }
    }, 60);
  }

  function animateWave() {
    const interval = setInterval(() => {
      setPhase(p => {
        if (p !== "listening") { clearInterval(interval); return p; }
        return p;
      });
      setWaveHeights(h => h.map(() => Math.random() * 28 + 4));
    }, 100);
    timerRef.current = interval;
  }

  function startProcessing(cmd) {
    clearInterval(timerRef.current);
    setWaveHeights(Array(24).fill(4));
    setPhase("processing");

    setTimeout(() => {
      const responses = {
        "كم رصيدي؟": "رصيدك الحالي هو ١٢٬٨٤٠ دولار. الدخل هذا الشهر ١٨٬٥٠٠ وهو أعلى بـ٦٧٪ من الشهر الماضي. ممتاز!",
        "أرسل فاتورة لشركة النجوم بمبلغ ٥٠٠ دولار": "تم إنشاء فاتورة INV-2026-024 بمبلغ ٥٠٠ دولار لشركة النجوم. هل تريد إرسالها الآن؟",
        "ذكّر شركة النجوم بفاتورتها المتأخرة": "تم إرسال رسالة متابعة لطيفة لشركة النجوم بخصوص الفاتورة المتأخرة ٢٢ يوماً. سأُعلمك عند الرد.",
        "كم صرفت هذا الشهر؟": "أنفقت ٢٤٧ دولاراً هذا الشهر. أكبر بند هو البرمجيات والأدوات بـ٩٨ دولار، تليها المطاعم بـ٤٢ دولار.",
        "احسب زكاتي": "زكاتك المستحقة هي ٣٢١ دولاراً، بناءً على وعاء زكوي قدره ١٢٬٨٤٠ دولار. الموعد بعد ٣٨ يوماً.",
        "خذني للفواتير": "حسناً، آخذك لصفحة الفواتير الآن.",
        "مين أسوأ عميل عندي؟": "شركة النجوم هي العميل الأعلى خطورة بمعدل ٨.٢/١٠. لديهم ٢٤٠٠ دولار متأخرة ومتوسط دفع ٤٨ يوماً.",
      };
      const r = responses[cmd] || "حسناً، سأعالج طلبك الآن.";
      setResponse(r);
      setPhase("responding");
      if (cmd === "خذني للفواتير") setTimeout(() => { onCommand("navigate", "invoices"); onClose(); }, 2000);
    }, 1800);
  }

  function tryNext() {
    const next = (cmdIdx + 1) % COMMANDS.length;
    setCmdIdx(next);
    setTranscript("");
    setResponse("");
    setPhase("idle");
    setTimeout(() => startListening(), 300);
  }

  const colors = {
    idle:       { bg: "rgba(10,10,9,0.92)", mic: "#7B1FA2", ring: "#7B1FA2" },
    listening:  { bg: "rgba(10,10,9,0.95)", mic: "#7B1FA2", ring: "#AB47BC" },
    processing: { bg: "rgba(10,10,9,0.95)", mic: "#C6930A", ring: "#FFB300" },
    responding: { bg: "rgba(10,10,9,0.95)", mic: "#1B5E20", ring: "#66BB6A" },
  };
  const c = colors[phase];

  return (
    <div style={{ position:"fixed", inset:0, background:c.bg, zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"IBM Plex Sans Arabic, sans-serif", backdropFilter:"blur(20px)" }}>
      {/* Close */}
      <button onClick={onClose} style={{ position:"absolute", top:60, right:20, background:"rgba(255,255,255,0.1)", border:"none", borderRadius:12, width:40, height:40, color:"white", fontSize:18, cursor:"pointer" }}>✕</button>

      {/* Waveform */}
      <div style={{ display:"flex", alignItems:"center", gap:3, height:48, marginBottom:40 }}>
        {waveHeights.map((h, i) => (
          <div key={i} style={{ width:3, height:h, background: phase==="listening" ? `rgba(171,71,188,${0.4+h/40})` : phase==="responding" ? `rgba(27,94,32,${0.4+h/40})` : "rgba(255,255,255,0.15)", borderRadius:4, transition:"height 0.08s ease" }}></div>
        ))}
      </div>

      {/* Mic Circle */}
      <div style={{ position:"relative", marginBottom:32 }}>
        {phase === "listening" && (
          <>
            <div style={{ position:"absolute", inset:-20, borderRadius:"50%", border:`2px solid ${c.ring}`, opacity:0.3, animation:"ripple1 1.5s ease-out infinite" }}></div>
            <div style={{ position:"absolute", inset:-36, borderRadius:"50%", border:`1px solid ${c.ring}`, opacity:0.15, animation:"ripple1 1.5s ease-out infinite 0.5s" }}></div>
          </>
        )}
        <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg, ${c.mic}aa, ${c.mic})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, boxShadow:`0 0 40px ${c.ring}66` }}>
          {phase === "processing" ? "⚙️" : phase === "responding" ? "🔊" : "🎤"}
        </div>
      </div>

      {/* Status */}
      <div style={{ fontSize:14, color: phase==="listening" ? "#CE93D8" : phase==="processing" ? "#FFB300" : "#A5D6A7", fontWeight:600, marginBottom:24, letterSpacing:"0.5px" }}>
        {phase === "idle" && "اضغط للبدء"}
        {phase === "listening" && "أستمع إليك..."}
        {phase === "processing" && "أعالج طلبك..."}
        {phase === "responding" && "ردّي:"}
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:16, padding:"14px 20px", maxWidth:300, textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>قلت:</div>
          <div style={{ fontSize:18, color:"white", fontWeight:700, lineHeight:1.5 }}>{transcript}</div>
        </div>
      )}

      {/* Response */}
      {response && (
        <div style={{ background:"rgba(27,94,32,0.2)", border:"1px solid rgba(27,94,32,0.4)", borderRadius:16, padding:"14px 20px", maxWidth:300, textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:13, color:"#A5D6A7", lineHeight:1.7 }}>{response}</div>
        </div>
      )}

      {/* Try next demo command */}
      {phase === "responding" && (
        <button onClick={tryNext} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"10px 24px", color:"white", fontSize:13, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic", marginTop:8 }}>
          جرّب أمراً آخر ←
        </button>
      )}

      {/* Sample commands hint */}
      {phase === "idle" && (
        <div style={{ textAlign:"center", marginTop:20 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>جرّب مثلاً:</div>
          {window.MASRAF_DATA.voiceCommands.slice(0,3).map((c,i) => (
            <div key={i} style={{ fontSize:13, color:"rgba(255,255,255,0.5)", padding:"4px 0" }}>"{c}"</div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes ripple1 {
          0%   { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { VoiceOverlay });
