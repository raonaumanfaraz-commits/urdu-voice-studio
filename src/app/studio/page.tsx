"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic2, Download, Loader2, Volume2, Settings2,
  AlertCircle, RefreshCw
} from "lucide-react";
import { Toast, QuotaBar } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";

const CHAR_LIMIT_PER_REQUEST = 5000;

interface VoiceCard {
  name: string;
  displayName: string;
  modelType?: string;
  supportsPitch?: boolean;
  ssmlGender: string;
  languageCodes: string[];
  baseVoiceName?: string;
  presetPitch?: number;
  presetSpeed?: number;
  description?: string;
}

export default function StudioPage() {
  // ── Auth / profile ──
  const [profile, setProfile] = useState<Profile | null>(null);

  // ── Script ──
  const [scriptText, setScriptText] = useState("");
  const [language, setLanguage] = useState("ur-IN");

  // ── Voices ──
  const [voices, setVoices] = useState<{ urdu: VoiceCard[]; english: VoiceCard[] }>({ urdu: [], english: [] });
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [modelFilter, setModelFilter] = useState("all");

  // ── Controls ──
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  // ── Generation ──
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const audioRef = useRef<HTMLAudioElement>(null);

  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const supabase = createSupabaseBrowserClient();
  const charCount = scriptText.length;
  const overLimit = charCount > CHAR_LIMIT_PER_REQUEST;

  // ── Load profile ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data as Profile));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load voices ──
  useEffect(() => {
    setVoicesLoading(true);
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => {
        setVoices({ urdu: data.urdu ?? [], english: data.english ?? [] });
        // Default: first Chirp voice or first voice
        if (data.urdu?.length) {
          const defaultV = data.urdu.find((v: VoiceCard) => v.name.includes("Achernar")) || data.urdu[0];
          setSelectedVoice(defaultV.name);
        }
      })
      .catch(() => setToast({ type: "error", message: "Failed to load voices. Please refresh." }))
      .finally(() => setVoicesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getVoiceLanguageCode(voiceName: string, fallback: string = "ur-IN"): string {
    const parts = voiceName.split("-");
    if (parts.length >= 2 && parts[0].length >= 2 && parts[1].length >= 2) {
      return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
    }
    return fallback;
  }

  function handleSelectVoice(v: VoiceCard) {
    setSelectedVoice(v.name);
    const parsedLang = v.languageCodes?.[0] || getVoiceLanguageCode(v.name, language);
    setLanguage(parsedLang);
    if (typeof v.presetPitch === "number") {
      setPitch(v.presetPitch);
    }
    if (typeof v.presetSpeed === "number") {
      setSpeed(v.presetSpeed);
    }
  }

  // ── Switch language tab (Urdu vs English) → pick first voice in category ──
  const isUrdu = language.toLowerCase().startsWith("ur");
  const isEnglish = language.toLowerCase().startsWith("en");

  function handleLanguageCategoryChange(category: "ur" | "en") {
    setModelFilter("all");
    const list = category === "ur" ? voices.urdu : voices.english;
    if (list.length) {
      handleSelectVoice(list[0]);
    } else {
      setLanguage(category === "ur" ? "ur-IN" : "en-US");
    }
  }

  const visibleVoices = isUrdu ? voices.urdu : voices.english;
  const currentVoice = visibleVoices.find((v) => v.name === selectedVoice);
  const voiceSupportsPitch = currentVoice?.supportsPitch ?? !selectedVoice.toLowerCase().includes("chirp");

  // Unique model types present in current language
  const availableModels = [
    "all",
    ...Array.from(new Set(visibleVoices.map((v) => v.modelType || (v.name.toLowerCase().includes("chirp") ? "Chirp3-HD" : "Standard")))),
  ];

  const displayedVoices =
    modelFilter === "all"
      ? visibleVoices
      : visibleVoices.filter(
          (v) => (v.modelType || (v.name.toLowerCase().includes("chirp") ? "Chirp3-HD" : "Standard")) === modelFilter
        );

  // ── Generate ──
  async function handleGenerate() {
    if (!scriptText.trim()) {
      setToast({ type: "info", message: "Please enter some text first." });
      return;
    }
    if (overLimit) {
      setToast({ type: "error", message: `Script exceeds ${CHAR_LIMIT_PER_REQUEST.toLocaleString()} characters.` });
      return;
    }
    if (!selectedVoice) {
      setToast({ type: "error", message: "Please select a voice." });
      return;
    }

    setGenerating(true);
    setToast(null);

    const targetLang =
      currentVoice?.languageCodes?.[0] ||
      getVoiceLanguageCode(selectedVoice, language);

    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText,
          language: targetLang,
          voiceName: selectedVoice,
          speed,
          pitch: voiceSupportsPitch ? pitch : undefined,
          projectTitle,
          projectId,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setToast({ type: "error", message: data.detail ?? "Quota exceeded. Please upgrade your plan." });
        return;
      }
      if (!res.ok) {
        const errorMsg =
          data.detail && data.error && !data.error.includes(data.detail)
            ? `${data.error}: ${data.detail}`
            : data.error ?? "Synthesis failed. Please try again.";
        setToast({ type: "error", message: errorMsg });
        return;
      }

      setAudioUrl(data.audioUrl);
      setProjectId(data.projectId);
      setToast({ type: "success", message: `Generated! ${data.charCount.toLocaleString()} characters used.` });

      // Update profile quota display
      if (profile) {
        setProfile((p) => p ? { ...p, chars_used: p.chars_used + data.charCount } : p);
      }

      // Auto-play
      setTimeout(() => audioRef.current?.play(), 200);
    } catch {
      setToast({ type: "error", message: "Network error. Please check your connection." });
    } finally {
      setGenerating(false);
    }
  }

  // ── Download ──
  async function handleDownload(format: "mp3" | "wav") {
    if (!audioUrl) return;
    try {
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error("Failed to fetch audio file");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${projectTitle || "voiceover"}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `${projectTitle || "voiceover"}.${format}`;
      a.target = "_blank";
      a.click();
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Studio</h1>
          <p className="text-sm text-ink-muted mt-0.5">Compose your script and synthesize a voice-over</p>
        </div>
        {profile && (
          <div className="hidden lg:block w-60">
            <QuotaBar used={profile.chars_used} limit={profile.chars_limit} plan={profile.plan} />
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left: Script editor ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Project title */}
          <div>
            <label className="section-label mb-1.5 block" htmlFor="project-title">Project Title</label>
            <input
              id="project-title"
              type="text"
              className="input"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="My Voice Project"
            />
          </div>

          {/* Language tabs */}
          <div>
            <p className="section-label mb-2">Language</p>
            <div className="flex gap-1 bg-surface-2 rounded-xl p-1 w-fit">
              {[
                { category: "ur" as const, label: "اردو — Urdu", active: isUrdu },
                { category: "en" as const, label: "English", active: isEnglish },
              ].map(({ category, label, active }) => (
                <button
                  key={category}
                  onClick={() => handleLanguageCategoryChange(category)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-brand-600 text-white shadow"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  id={`lang-tab-${category}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Script textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="section-label" htmlFor="script-textarea">Script</label>
              <span
                className={`text-xs font-mono ${
                  overLimit ? "text-red-400" : charCount > 4000 ? "text-amber-400" : "text-ink-subtle"
                }`}
              >
                {charCount.toLocaleString()} / {CHAR_LIMIT_PER_REQUEST.toLocaleString()}
              </span>
            </div>
            <textarea
              id="script-textarea"
              className="urdu-textarea w-full"
              dir="auto"
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder={isUrdu ? "یہاں اپنا متن لکھیں..." : "Type your script here..."}
              rows={10}
            />
            {overLimit && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                Script is too long. Please shorten it to {CHAR_LIMIT_PER_REQUEST.toLocaleString()} characters.
              </p>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || overLimit || !scriptText.trim()}
            className="btn-primary w-full py-3 text-base"
            id="btn-generate"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Synthesizing…
              </>
            ) : (
              <>
                <Mic2 className="w-5 h-5" />
                Generate Voice-Over
              </>
            )}
          </button>

          {/* Audio player */}
          {audioUrl && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Volume2 className="w-4 h-4 text-brand-400" />
                Preview
              </div>
              <audio ref={audioRef} controls src={audioUrl} className="w-full" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload("mp3")}
                  className="btn-secondary flex-1 py-2"
                  id="btn-download-mp3"
                >
                  <Download className="w-3.5 h-3.5" />
                  MP3
                </button>
                <button
                  onClick={() => handleDownload("wav")}
                  className="btn-secondary flex-1 py-2"
                  id="btn-download-wav"
                >
                  <Download className="w-3.5 h-3.5" />
                  WAV
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-ghost flex-1 py-2"
                  id="btn-regenerate"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                  Re-generate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Voice picker + controls ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Voice picker */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Voice</p>
              <span className="text-xs text-ink-subtle">
                {displayedVoices.length} voice{displayedVoices.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Model Filter Tabs */}
            {availableModels.length > 2 && (
              <div className="flex gap-1 bg-surface-2 p-1 rounded-xl mb-3 overflow-x-auto">
                {availableModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModelFilter(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      modelFilter === m
                        ? "bg-brand-600 text-white shadow"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {m === "all" ? "All" : m}
                  </button>
                ))}
              </div>
            )}

            {voicesLoading ? (
              <div className="flex items-center gap-2 text-ink-muted text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading voices…
              </div>
            ) : displayedVoices.length === 0 ? (
              <p className="text-sm text-ink-muted py-4">No voices found for this filter.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {displayedVoices.map((v) => {
                  const isFemale =
                    v.ssmlGender === "FEMALE" ||
                    v.name.toLowerCase().includes("achernar") ||
                    v.name.toLowerCase().includes("female");
                  const model = v.modelType || (v.name.toLowerCase().includes("chirp") ? "Chirp3-HD" : v.name.toLowerCase().includes("wavenet") ? "WaveNet" : "Standard");
                  const canPitch = v.supportsPitch ?? !v.name.toLowerCase().includes("chirp");

                  const modelBadgeClass =
                    model === "Preset"
                      ? "bg-amber-950/70 text-amber-300 border border-amber-800/50"
                      : model === "Chirp3-HD"
                      ? "bg-purple-950/70 text-purple-300 border border-purple-800/50"
                      : model === "WaveNet"
                      ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                      : "bg-blue-950/70 text-blue-300 border border-blue-800/50";

                  return (
                    <button
                      key={v.name}
                      onClick={() => handleSelectVoice(v)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedVoice === v.name
                          ? "border-brand-500 bg-brand-600/10 ring-1 ring-brand-500/50"
                          : "border-surface-3 bg-surface-2 hover:border-surface-4"
                      }`}
                      id={`voice-${v.name}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium text-ink truncate">
                            {v.displayName || v.name.split("-").slice(3).join(" ")}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${modelBadgeClass}`}>
                            {model}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-ink-subtle truncate max-w-[210px]">{v.description || v.name}</p>
                          <span
                            className={`text-[10px] font-medium shrink-0 ${
                              canPitch ? "text-emerald-400" : "text-ink-subtle"
                            }`}
                          >
                            {canPitch ? "• Pitch ✓" : "• Pitch N/A"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`badge text-[10px] shrink-0 ${
                          model === "Preset"
                            ? "bg-amber-900/30 text-amber-300 border border-amber-700/40"
                            : isFemale
                            ? "badge-starter"
                            : "bg-surface-4 text-ink-muted border border-surface-3"
                        }`}
                      >
                        {v.displayName.includes("Child")
                          ? "Child"
                          : v.displayName.includes("Old Man")
                          ? "Elderly"
                          : isFemale
                          ? "Female"
                          : "Male"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="card p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-ink-muted" />
              <p className="section-label">Audio Controls</p>
            </div>

            {/* Speed */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium text-ink" htmlFor="speed-slider">
                  Speed
                </label>
                <span className="text-xs font-mono text-brand-400">{speed.toFixed(1)}×</span>
              </div>
              <input
                id="speed-slider"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-brand-500 h-1.5 rounded"
              />
              <div className="flex justify-between text-[10px] text-ink-subtle mt-1">
                <span>0.5×</span><span>1.0×</span><span>2.0×</span>
              </div>
            </div>

            {/* Pitch */}
            <div className={!voiceSupportsPitch ? "opacity-60" : ""}>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium text-ink" htmlFor="pitch-slider">
                  Pitch
                </label>
                <span className="text-xs font-mono text-brand-400">
                  {voiceSupportsPitch ? `${pitch > 0 ? "+" : ""}${pitch}` : "Not supported"}
                </span>
              </div>
              <input
                id="pitch-slider"
                type="range"
                min="-20"
                max="20"
                step="1"
                value={voiceSupportsPitch ? pitch : 0}
                disabled={!voiceSupportsPitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-full accent-brand-500 h-1.5 rounded disabled:cursor-not-allowed disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-ink-subtle mt-1">
                <span>-20</span><span>0</span><span>+20</span>
              </div>
              {!voiceSupportsPitch ? (
                <p className="text-[11px] text-ink-muted mt-1.5">
                  Pitch adjustment is not supported for Chirp3-HD voices.
                </p>
              ) : (
                <p className="text-[11px] text-emerald-400/90 mt-1.5">
                  Pitch adjustment supported for {currentVoice?.modelType === "Preset" ? "presets" : `${currentVoice?.modelType || "this"} voices`}.
                </p>
              )}
            </div>

            {/* Reset */}
            <button
              onClick={() => { setSpeed(1.0); setPitch(0); }}
              className="btn-ghost w-full text-xs py-1.5"
            >
              Reset to defaults
            </button>
          </div>

          {/* Mobile quota */}
          {profile && (
            <div className="card p-4 lg:hidden">
              <QuotaBar used={profile.chars_used} limit={profile.chars_limit} plan={profile.plan} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
