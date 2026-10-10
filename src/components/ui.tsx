"use client";

import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: "bg-emerald-900/80 border-emerald-700/60 text-emerald-300",
  error:   "bg-red-900/80 border-red-700/60 text-red-300",
  info:    "bg-brand-900/80 border-brand-700/60 text-brand-300",
  warning: "bg-amber-900/80 border-amber-700/60 text-amber-300",
};

export function Toast({ type, message, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const Icon = ICONS[type];

  function dismiss() {
    setVisible(false);
    onClose?.();
  }

  if (!visible) return null;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-up ${STYLES[type]}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Quota bar ───────────────────────────────────────────────
interface QuotaBarProps {
  used: number;
  limit: number;
  plan: string;
}

export function QuotaBar({ used, limit, plan }: QuotaBarProps) {
  const pct = Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 80;
  const isCritical = pct >= 95;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span className="capitalize">{plan} plan</span>
        <span>
          {used.toLocaleString()} / {limit.toLocaleString()} chars
        </span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCritical
              ? "bg-red-500"
              : isWarning
              ? "bg-amber-500"
              : "bg-brand-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isWarning && (
        <p className={`text-xs ${isCritical ? "text-red-400" : "text-amber-400"}`}>
          {isCritical
            ? "Quota nearly exhausted — upgrade to continue"
            : "Running low on quota — consider upgrading"}
        </p>
      )}
    </div>
  );
}
