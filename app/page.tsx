"use client";

import { useState, useEffect, useRef } from "react";
import AudioPlayer from "@/components/AudioPlayer";

/* ── Constants ─────────────────────────────────────────────────────────── */
const STYLES = [
  { value: "normal",        label: "Normal",       desc: "Clear, natural delivery" },
  { value: "excited",       label: "Excited",      desc: "High energy, enthusiastic" },
  { value: "whispers",      label: "Whisper",       desc: "Quiet, intimate tone" },
  { value: "news-anchor",   label: "News Anchor",  desc: "Formal, authoritative" },
  { value: "calm",          label: "Calm",         desc: "Soft, peaceful, gentle" },
  { value: "cheerful",      label: "Cheerful",     desc: "Warm, bright, positive" },
  { value: "sad",           label: "Somber",       desc: "Melancholic, emotional" },
] as const;

const VOICES = [
  { value: "Kore",   note: "Female · Warm"       },
  { value: "Aoede",  note: "Female · Bright"     },
  { value: "Leda",   note: "Female · Smooth"     },
  { value: "Charon", note: "Male · Deep"         },
  { value: "Fenrir", note: "Male · Grounded"     },
  { value: "Orus",   note: "Male · Rich"         },
  { value: "Puck",   note: "Male · Expressive"   },
] as const;

const SAMPLES = [
  "မင်္ဂလာပါ၊ ဒီနေ့ ရာသီဥတုကောင်းနေပါတယ်။",
  "မြန်မာနိုင်ငံသည် အရှေ့တောင်အာရှတွင် တည်ရှိသောနိုင်ငံဖြစ်သည်။",
  "သင်တို့ကို ကြိုဆိုပါသည်။ ဤဝန်ဆောင်မှုသည် မြန်မာဘာသာကို အသံဖြင့် ပြောင်းပေးသည်။",
];

const LS_KEY = "mm_tts_api_key";

/* ── SVG icons ──────────────────────────────────────────────────────────── */
const EyeIcon = ({ off }: { off?: boolean }) =>
  off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);

const SoundIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin-slow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

/* ── Decorative ring motif ──────────────────────────────────────────────── */
const Motif = () => (
  <svg width="110" height="110" viewBox="0 0 110 110" fill="none"
    className="absolute -top-5 -right-5 opacity-[0.06] pointer-events-none select-none" aria-hidden="true">
    <circle cx="55" cy="55" r="53" stroke="#d4960f" strokeWidth="1" />
    <circle cx="55" cy="55" r="39" stroke="#d4960f" strokeWidth="0.5" />
    <circle cx="55" cy="55" r="24" stroke="#d4960f" strokeWidth="1" />
    {[0,45,90,135,180,225,270,315].map(d => (
      <line key={d} x1="55" y1="55"
        x2={55 + 53 * Math.cos(d * Math.PI / 180)}
        y2={55 + 53 * Math.sin(d * Math.PI / 180)}
        stroke="#d4960f" strokeWidth="0.5" />
    ))}
  </svg>
);

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [apiKey,    setApiKey]    = useState("");
  const [showKey,   setShowKey]   = useState(false);
  const [keySaved,  setKeySaved]  = useState(false);
  const [text,      setText]      = useState("");
  const [style,     setStyle]     = useState("normal");
  const [voice,     setVoice]     = useState("Kore");
  const [loading,   setLoading]   = useState(false);
  const [audioSrc,  setAudioSrc]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const blobRef = useRef<string | null>(null);

  /* Load saved key on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) { setApiKey(saved); setKeySaved(true); }
    } catch {}
  }, []);

  function saveKey() {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    try { localStorage.setItem(LS_KEY, trimmed); setKeySaved(true); } catch {}
  }

  function clearKey() {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setApiKey(""); setKeySaved(false);
  }

  function handleKeyChange(v: string) {
    setApiKey(v);
    setKeySaved(false);
    if (error?.toLowerCase().includes("key")) setError(null);
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value.slice(0, 4000);
    setText(v); setCharCount(v.length);
  }

  function useSample() {
    const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    setText(s); setCharCount(s.length);
  }

  async function generate() {
    if (!text.trim()) return;
    setLoading(true); setError(null);
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    setAudioSrc(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style, voice, apiKey: apiKey.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      blobRef.current = url;
      setAudioSrc(url);

      /* Auto-save key on first successful generation */
      if (apiKey.trim() && !keySaved) saveKey();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  const keyValid   = apiKey.trim().startsWith("AIza") && apiKey.trim().length > 20;
  const canGenerate = text.trim().length > 0 && !loading && keyValid;

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-14"
      style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Header ───────────────────────────────────────── */}
      <header className="text-center mb-10 animate-fade-up">
        <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "var(--gold)" }}>
          Google Gemini TTS
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.2rem,5.5vw,3.8rem)",
          fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.15,
          color: "var(--parchment)",
        }}>
          Myanmar{" "}
          <em style={{ color: "var(--gold)", fontStyle: "italic" }}>Voice</em>
        </h1>
        <p className="mt-2 text-base" style={{
          fontFamily: "Noto Sans Myanmar, serif",
          color: "var(--text-muted)", letterSpacing: "0.04em",
        }}>
          မြန်မာစာကို သဘာဝကျသော အသံဖြင့် ပြောင်းလဲပေးသည်
        </p>
        <div className="gold-rule w-20 mx-auto mt-5" />
      </header>

      {/* ── Card ─────────────────────────────────────────── */}
      <div className="w-full max-w-2xl rounded-xl relative overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-dim)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)",
        }}>
        <Motif />

        <div className="relative z-10 p-6 sm:p-8 space-y-6">

          {/* ── API Key Section ───────────────────────────── */}
          <section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="api-key" className="flex items-center gap-1.5 text-xs uppercase tracking-widest"
                style={{ color: "var(--gold)" }}>
                <KeyIcon />
                Gemini API Key
              </label>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={e => (e.currentTarget.style.color = "var(--gold)")}
                onMouseOut={e  => (e.currentTarget.style.color = "var(--text-muted)")}>
                Get free key ↗
              </a>
            </div>

            {/* Input row */}
            <div className="flex gap-2">
              <div className="key-input-wrap flex-1">
                <input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  className={`key-input${keyValid ? " valid" : ""}`}
                  placeholder="AIzaSy••••••••••••••••••••••••••••••••"
                  value={apiKey}
                  onChange={e => handleKeyChange(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Gemini API Key"
                />
                <button className="key-toggle-btn" onClick={() => setShowKey(p => !p)}
                  aria-label={showKey ? "Hide key" : "Show key"} type="button">
                  <EyeIcon off={showKey} />
                </button>
              </div>

              {/* Save / Clear button */}
              {keySaved ? (
                <button onClick={clearKey} type="button"
                  className="flex items-center gap-1.5 px-3 rounded-md text-xs transition-colors flex-shrink-0"
                  style={{
                    border: "1px solid var(--success)", color: "var(--success)",
                    background: "var(--success-bg)", fontFamily: "var(--font-body)",
                  }}>
                  <CheckIcon />
                  Saved
                </button>
              ) : (
                <button onClick={saveKey} disabled={!keyValid} type="button"
                  className="flex-shrink-0 px-4 rounded-md text-xs font-medium transition-all"
                  style={{
                    border: `1px solid ${keyValid ? "var(--border-accent)" : "var(--border-dim)"}`,
                    color: keyValid ? "var(--gold)" : "var(--text-faint)",
                    background: "transparent", fontFamily: "var(--font-body)",
                    cursor: keyValid ? "pointer" : "not-allowed",
                  }}>
                  Save
                </button>
              )}
            </div>

            {/* Helper text */}
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
              Your key is stored in your browser only — never sent to our servers without your request.
            </p>
          </section>

          {/* ── Divider ───────────────────────────────────── */}
          <div className="gold-rule animate-fade-up" style={{ animationDelay: "0.10s" }} />

          {/* ── Myanmar Textarea ──────────────────────────── */}
          <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="myanmar-text" className="text-xs uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                Myanmar Text
              </label>
              <div className="flex items-center gap-3">
                <button onClick={useSample} type="button"
                  className="text-xs transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseOver={e => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseOut={e  => (e.currentTarget.style.color = "var(--text-muted)")}>
                  ↗ sample
                </button>
                <span className="text-xs tabular-nums"
                  style={{ color: charCount > 3600 ? "#ef4444" : "var(--text-faint)" }}>
                  {charCount} / 4000
                </span>
              </div>
            </div>
            <textarea
              id="myanmar-text"
              className="myanmar-input"
              placeholder="မြန်မာဘာသာ စာသားရိုက်ထည့်ပါ…"
              value={text}
              onChange={handleTextChange}
              rows={6}
              spellCheck={false}
            />
          </section>

          {/* ── Style + Voice ─────────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "0.20s" }}>
            <div>
              <label htmlFor="audio-style" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>
                Audio Style
              </label>
              <select id="audio-style" className="lacquer-select w-full"
                value={style} onChange={e => setStyle(e.target.value)}>
                {STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="voice-select" className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>
                Voice
              </label>
              <select id="voice-select" className="lacquer-select w-full"
                value={voice} onChange={e => setVoice(e.target.value)}>
                {VOICES.map(v => (
                  <option key={v.value} value={v.value}>{v.value} · {v.note}</option>
                ))}
              </select>
            </div>
          </section>

          {/* ── Divider ───────────────────────────────────── */}
          <div className="gold-rule animate-fade-up" style={{ animationDelay: "0.25s" }} />

          {/* ── Generate Button ───────────────────────────── */}
          <section className="animate-fade-up" style={{ animationDelay: "0.30s" }}>
            {!keyValid && apiKey.length > 0 && (
              <p className="text-xs mb-3 text-center" style={{ color: "#f59e0b" }}>
                ⚠ Key should start with "AIza" and be at least 20 characters
              </p>
            )}
            {!apiKey && (
              <p className="text-xs mb-3 text-center" style={{ color: "var(--text-muted)" }}>
                Enter your Gemini API key above to generate audio
              </p>
            )}
            <button
              onClick={generate}
              disabled={!canGenerate}
              className="btn-generate"
              aria-busy={loading}
            >
              {loading ? <><Spinner /><span>Synthesising Voice…</span></> : <><SoundIcon /><span>Generate Voiceover</span></>}
            </button>
          </section>

          {/* ── Error ─────────────────────────────────────── */}
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm animate-fade-in" role="alert"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                color: "#fca5a5",
              }}>
              <strong className="block mb-0.5">Error</strong>
              {error}
              {(error.includes("key") || error.includes("401") || error.includes("403")) && (
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                  className="block mt-1.5 underline text-xs" style={{ color: "var(--gold)" }}>
                  Get / check your API key at aistudio.google.com →
                </a>
              )}
            </div>
          )}

          {/* ── Audio Player ──────────────────────────────── */}
          {audioSrc && <AudioPlayer src={audioSrc} />}
        </div>
      </div>

      {/* ── Style pills ──────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center animate-fade-up" style={{ animationDelay: "0.38s" }}>
        {STYLES.map(s => (
          <button key={s.value} onClick={() => setStyle(s.value)} type="button"
            className="px-3 py-1 rounded-full text-xs transition-all"
            style={{
              border: `1px solid ${style === s.value ? "var(--border-accent)" : "var(--border-dim)"}`,
              background: style === s.value ? "rgba(212,150,15,0.12)" : "transparent",
              color: style === s.value ? "var(--gold)" : "var(--text-faint)",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="mt-12 text-center text-xs" style={{ color: "var(--text-faint)" }}>
        <p>Myanmar Voice · Gemini 2.5 Flash TTS · Deployed on Vercel</p>
        <p className="mt-1" style={{ fontFamily: "Noto Sans Myanmar, serif", fontSize: "0.72rem" }}>
          မြန်မာဘာသာ အသံပြောင်းလဲမှုဝန်ဆောင်မှု
        </p>
      </footer>
    </main>
  );
}
