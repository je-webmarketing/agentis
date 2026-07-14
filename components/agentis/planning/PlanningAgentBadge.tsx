"use client"

import {
  BriefcaseBusiness,
  Clock3,
  Trash2,
  UserRound,
  UserRoundPlus,
} from "lucide-react"

type PlanningAgentBadgeProps = {
  assignmentId?: string | number
  name: string
  position?: string
  start?: string
  end?: string
  status?: "present" | "absence" | "replacement"
  onReplace?: (assignmentId: string | number) => void
  onDelete?: (assignmentId: string | number) => void
}

const themes = {
  present: {
    border: "border-cyan-500/25",
    background: "bg-cyan-500/[0.06]",
    text: "text-cyan-100",
    accent: "text-cyan-400",
    label: "Présent",
  },
  absence: {
    border: "border-red-500/35",
    background: "bg-red-500/10",
    text: "text-red-200",
    accent: "text-red-400",
    label: "Absent",
  },
  replacement: {
    border: "border-violet-500/35",
    background: "bg-violet-500/10",
    text: "text-violet-200",
    accent: "text-violet-400",
    label: "Remplacé",
  },
}

export default function PlanningAgentBadge({
  assignmentId,
  name,
  position = "Agent",
  start = "",
  end = "",
  status = "present",
  onReplace,
  onDelete,
}: PlanningAgentBadgeProps) {
  const theme = themes[status]
  const isAbsence = status === "absence"

  return (
    <div
      className={`group rounded-xl border ${theme.border} ${theme.background} px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-black/20`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${theme.border} bg-[#020817]/70`}
          >
            <UserRound className={`h-3.5 w-3.5 ${theme.accent}`} />
          </div>

          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold leading-5 ${theme.text}`}
            >
              {name}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <BriefcaseBusiness className="h-3 w-3 shrink-0" />
              <span className="truncate">{position}</span>
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border ${theme.border} bg-[#020817]/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${theme.accent}`}
        >
          {theme.label}
        </span>
      </div>

      {(start || end) && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
          <Clock3 className="h-3 w-3 shrink-0" />

          <span>
            {start || "—"}
            {end ? ` → ${end}` : ""}
          </span>
        </div>
      )}

      {isAbsence && assignmentId !== undefined && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-red-500/15 pt-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onReplace?.(assignmentId)
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-[10px] font-semibold text-violet-300 transition hover:border-violet-400/60 hover:bg-violet-500/20"
          >
            <UserRoundPlus className="h-3 w-3" />
            Remplacer
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete?.(assignmentId)
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-500/20"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}