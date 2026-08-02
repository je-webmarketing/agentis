"use client"

import type { ReactNode } from "react"
import { AlertTriangle, X } from "lucide-react"

export type ConfirmDialogTone =
  | "danger"
  | "warning"
  | "primary"

type Props = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmDialogTone
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const toneStyles: Record<
  ConfirmDialogTone,
  {
    icon: string
    button: string
  }
> = {
  danger: {
    icon: "border-red-500/30 bg-red-500/10 text-red-300",
    button:
      "bg-red-500 text-white hover:bg-red-400 focus:ring-red-500/40",
  },

  warning: {
    icon:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    button:
      "bg-yellow-500 text-slate-950 hover:bg-yellow-400 focus:ring-yellow-500/40",
  },

  primary: {
    icon:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    button:
      "bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus:ring-cyan-500/40",
  },
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
  loading = false,
  icon,
  children,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  const styles = toneStyles[tone]

  function handleCancel() {
    if (loading) return

    onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel()
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}
            >
              {icon || <AlertTriangle className="h-6 w-6" />}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                AGENTIS
              </p>

              <h2
                id="confirm-dialog-title"
                className="mt-1 text-xl font-bold text-white"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            aria-label="Fermer"
            className="rounded-xl border border-slate-700 p-2 text-slate-400 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {description && (
            <p className="leading-6 text-slate-300">
              {description}
            </p>
          )}

          {children && (
            <div className="rounded-2xl border border-slate-800 bg-[#020817]/70 p-4 text-sm text-slate-400">
              {children}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 px-6 py-5">
          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className={`rounded-xl px-5 py-3 font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
          >
            {loading ? "Traitement en cours…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}