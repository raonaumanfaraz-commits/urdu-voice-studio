"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, Download, Trash2, RefreshCw, Loader2, Mic2, Play, Calendar, FileText } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Project } from "@/lib/types";
import { Toast } from "@/components/ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const supabase = createSupabaseBrowserClient();

  async function fetchProjects() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error) setProjects((data ?? []) as Project[]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProjects(); }, []);

  async function handleDelete(project: Project) {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setDeletingId(project.id);

    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      setToast({ type: "error", message: "Failed to delete project." });
    } else {
      setProjects((p) => p.filter((x) => x.id !== project.id));
      setToast({ type: "success", message: `"${project.title}" deleted.` });
    }
    setDeletingId(null);
  }

  async function handleRegenerate(project: Project) {
    setRegenId(project.id);
    setToast(null);

    try {
      const isChirp = project.voice_name.toLowerCase().includes("chirp");
      const voiceLangParts = project.voice_name.split("-");
      const targetLang =
        voiceLangParts.length >= 2 && voiceLangParts[0].length >= 2 && voiceLangParts[1].length >= 2
          ? `${voiceLangParts[0].toLowerCase()}-${voiceLangParts[1].toUpperCase()}`
          : project.language;

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText: project.script_text,
          language: targetLang,
          voiceName: project.voice_name,
          speed: project.speed,
          pitch: isChirp ? undefined : project.pitch,
          projectTitle: project.title,
          projectId: project.id,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setToast({ type: "error", message: data.detail ?? "Quota exceeded." });
        return;
      }
      if (!res.ok) {
        const errorMsg =
          data.detail && data.error && !data.error.includes(data.detail)
            ? `${data.error}: ${data.detail}`
            : data.error ?? "Re-generation failed.";
        setToast({ type: "error", message: errorMsg });
        return;
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, audio_url: data.audioUrl, updated_at: new Date().toISOString() } : p
        )
      );
      setToast({ type: "success", message: "Re-generated successfully!" });
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setRegenId(null);
    }
  }

  function handlePreview(project: Project) {
    if (previewUrl === project.audio_url) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(project.audio_url);
      setPreviewTitle(project.title);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {projects.length} saved project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/studio" className="btn-primary" id="btn-new-project">
          <Mic2 className="w-4 h-4" />
          New project
        </Link>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Inline audio preview */}
      {previewUrl && (
        <div className="card p-4 mb-4 flex items-center gap-4">
          <Play className="w-4 h-4 text-brand-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-ink-muted mb-1">{previewTitle}</p>
            <audio controls autoPlay src={previewUrl} className="w-full" />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-ink-muted gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FolderOpen className="w-12 h-12 text-ink-subtle mb-4" />
          <p className="text-ink font-semibold mb-2">No projects yet</p>
          <p className="text-sm text-ink-muted mb-5">Head to the Studio to create your first voice-over.</p>
          <Link href="/studio" className="btn-primary">Open Studio</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card p-5 hover:border-surface-4 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-brand-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-ink truncate">{project.title}</h2>
                      <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 font-mono" dir="auto">
                        {project.script_text.slice(0, 80)}{project.script_text.length > 80 ? "…" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Preview */}
                      {project.audio_url && (
                        <button
                          onClick={() => handlePreview(project)}
                          className="btn-ghost p-2"
                          title="Preview"
                          id={`btn-preview-${project.id}`}
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Download */}
                      {project.audio_url && (
                        <a
                          href={project.audio_url}
                          download={`${project.title}.mp3`}
                          className="btn-ghost p-2"
                          title="Download"
                          id={`btn-download-${project.id}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {/* Re-generate */}
                      <button
                        onClick={() => handleRegenerate(project)}
                        disabled={regenId === project.id}
                        className="btn-ghost p-2"
                        title="Re-generate"
                        id={`btn-regen-${project.id}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regenId === project.id ? "animate-spin" : ""}`} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(project)}
                        disabled={deletingId === project.id}
                        className="btn-ghost p-2 hover:text-red-400"
                        title="Delete"
                        id={`btn-delete-${project.id}`}
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-ink-subtle">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.updated_at)}
                    </span>
                    <span>{project.char_count.toLocaleString()} chars</span>
                    <span>{formatSize(project.file_size)}</span>
                    <span className="font-mono truncate max-w-[180px]">{project.voice_name}</span>
                    <span>{project.speed}× · pitch {project.pitch > 0 ? "+" : ""}{project.pitch}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
